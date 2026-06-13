"use server";

import crypto from "node:crypto";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureUniqueSlug } from "@/lib/data";
import { getValidHeroImage } from "@/lib/markdown-images";
import { fallbackSlug } from "@/lib/slug";
import { getUploadExtension, getUploadRoot, MAX_UPLOAD_SIZE } from "@/lib/uploads";

const coverValues = ["none", "admin", "blog", "comment", "dev", "markdown", "retro", "search", "stats", "til"] as const;
const FEATURED_POST_LIMIT = 3;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function redirectBack(pathname: string, error: string): never {
  redirect(`${pathname}?error=${encodeURIComponent(error)}`);
}

const loginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200)
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"]
  });

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(160),
  slug: z.string().max(120).optional(),
  excerpt: z.string().min(1).max(320),
  content: z.string().min(1),
  cover: z.enum(coverValues).default("blog"),
  heroImageUrl: z.string().max(2048).optional(),
  category: z.string().min(1).max(60),
  tags: z.string().max(360).transform(splitTags),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT")
});

const commentSchema = z.object({
  postId: z.string().min(1),
  slug: z.string().min(1),
  author: z.string().min(1).max(40),
  password: z.string().min(4).max(80),
  body: z.string().min(1).max(1200)
});

const commentPasswordSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
  password: z.string().min(4).max(80)
});

const commentUpdateSchema = commentPasswordSchema.extend({
  body: z.string().min(1).max(1200)
});

type CommentActionState = {
  ok: boolean;
  message: string;
  code?: "idle" | "rate" | "missing" | "password" | "updated" | "deleted";
};

function commentActionState(ok: boolean, message: string, code: CommentActionState["code"]): CommentActionState {
  return { ok, message, code };
}

const taxonomySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  slug: z.string().max(80).optional(),
  description: z.string().max(180).optional()
});

const featuredPostSchema = z.object({
  postId: z.string().min(1)
});

const featuredPostMoveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"])
});

async function upsertCategory(name: string) {
  const safeName = name || "개발";
  const slug = fallbackSlug(safeName, "category");
  return prisma.category.upsert({
    where: { slug },
    update: { name: safeName },
    create: { name: safeName, slug }
  });
}

async function syncTags(postId: string, tagNames: string[]) {
  await prisma.postTag.deleteMany({ where: { postId } });

  for (const name of tagNames) {
    const slug = fallbackSlug(name, "tag");
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });

    await prisma.postTag.create({
      data: { postId, tagId: tag.id }
    });
  }
}

export async function loginAction(formData: FormData) {
  const limited = await checkRateLimit("admin-login", 8, 60_000);
  if (!limited) {
    redirect("/admin/login?error=rate");
  }

  const parsed = loginSchema.safeParse({
    username: getString(formData, "username"),
    password: getString(formData, "password")
  });

  if (!parsed.success) {
    redirect("/admin/login?error=invalid");
  }

  const ok = await loginAdmin(parsed.data.username, parsed.data.password);
  if (!ok) {
    redirect("/admin/login?error=invalid");
  }

  redirect("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/");
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireAdmin();
  const limited = await checkRateLimit(`admin-password:${session.sub}`, 5, 60_000);
  if (!limited) {
    redirect("/admin/settings?error=rate");
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newPassword: getString(formData, "newPassword"),
    confirmPassword: getString(formData, "confirmPassword")
  });

  if (!parsed.success) {
    redirect("/admin/settings?error=invalid-password");
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) {
    redirect("/admin/login");
  }

  const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    redirect("/admin/settings?error=current-password");
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash, passwordUpdatedAt: new Date() }
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=password");
}

export async function savePostAction(formData: FormData) {
  await requireAdmin();

  const parsed = postSchema.safeParse({
    id: getOptionalString(formData, "id"),
    title: getString(formData, "title"),
    slug: getOptionalString(formData, "slug"),
    excerpt: getString(formData, "excerpt"),
    content: getString(formData, "content"),
    cover: getString(formData, "cover") || "blog",
    heroImageUrl: getOptionalString(formData, "heroImageUrl"),
    category: getString(formData, "category") || "개발",
    tags: getString(formData, "tags"),
    status: getString(formData, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
  });

  const fallbackPath = parsed.success && parsed.data.id ? `/admin/posts/${parsed.data.id}/edit` : "/admin/posts/new";
  if (!parsed.success) {
    redirectBack(fallbackPath, "invalid-post");
  }

  const data = parsed.data;
  const category = await upsertCategory(data.category);
  const slug = await ensureUniqueSlug(data.slug || data.title, data.id);
  const existing = data.id ? await prisma.post.findUnique({ where: { id: data.id } }) : null;
  const status = data.status === "PUBLISHED" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
  const publishedAt = status === PostStatus.PUBLISHED ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null;
  const heroImage = getValidHeroImage(data.content, data.heroImageUrl);

  const post = data.id
    ? await prisma.post.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          cover: data.cover,
          heroImageUrl: heroImage.heroImageUrl,
          heroImageAlt: heroImage.heroImageAlt,
          status,
          publishedAt,
          categoryId: category.id
        }
      })
    : await prisma.post.create({
        data: {
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          cover: data.cover,
          heroImageUrl: heroImage.heroImageUrl,
          heroImageAlt: heroImage.heroImageAlt,
          status,
          publishedAt,
          categoryId: category.id
        }
      });

  await syncTags(post.id, data.tags);

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/taxonomy");
  redirect("/admin/posts?saved=1");
}

export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const postId = getString(formData, "id");
  if (postId) {
    await prisma.post.delete({ where: { id: postId } });
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  redirect("/admin/posts?deleted=1");
}

async function normalizeFeaturedPostOrder() {
  const entries = await prisma.featuredPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  await Promise.all(
    entries.map((entry, index) =>
      entry.sortOrder === index + 1
        ? Promise.resolve()
        : prisma.featuredPost.update({
            where: { id: entry.id },
            data: { sortOrder: index + 1 }
          })
    )
  );
}

export async function addFeaturedPostAction(formData: FormData) {
  await requireAdmin();

  const parsed = featuredPostSchema.safeParse({
    postId: getString(formData, "postId")
  });
  if (!parsed.success) {
    redirect("/admin?featured=invalid");
  }

  const [count, post, existing] = await Promise.all([
    prisma.featuredPost.count(),
    prisma.post.findUnique({ where: { id: parsed.data.postId }, select: { id: true, status: true } }),
    prisma.featuredPost.findUnique({ where: { postId: parsed.data.postId }, select: { id: true } })
  ]);

  if (!post || post.status !== PostStatus.PUBLISHED) {
    redirect("/admin?featured=unpublished");
  }
  if (existing) {
    redirect("/admin?featured=duplicate");
  }
  if (count >= FEATURED_POST_LIMIT) {
    redirect("/admin?featured=max");
  }

  await prisma.featuredPost.create({
    data: {
      postId: post.id,
      sortOrder: count + 1
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?featured=added");
}

export async function removeFeaturedPostAction(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  if (!id) {
    redirect("/admin?featured=invalid");
  }

  await prisma.featuredPost.deleteMany({ where: { id } });
  await normalizeFeaturedPostOrder();

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?featured=removed");
}

export async function moveFeaturedPostAction(formData: FormData) {
  await requireAdmin();
  const parsed = featuredPostMoveSchema.safeParse({
    id: getString(formData, "id"),
    direction: getString(formData, "direction")
  });
  if (!parsed.success) {
    redirect("/admin?featured=invalid");
  }

  const entries = await prisma.featuredPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const currentIndex = entries.findIndex((entry) => entry.id === parsed.data.id);
  const targetIndex = parsed.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= entries.length) {
    redirect("/admin?featured=unchanged");
  }

  const current = entries[currentIndex];
  const target = entries[targetIndex];
  await prisma.$transaction([
    prisma.featuredPost.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
    prisma.featuredPost.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } })
  ]);
  await normalizeFeaturedPostOrder();

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?featured=moved");
}

export async function createCommentAction(formData: FormData) {
  const slug = getString(formData, "slug");
  const limited = await checkRateLimit(`comment-create:${slug || "unknown"}`, 6, 60_000);
  if (!limited) {
    redirect(`/posts/${slug}?commentError=rate#comments`);
  }

  const parsed = commentSchema.safeParse({
    postId: getString(formData, "postId"),
    slug,
    author: getString(formData, "author"),
    password: getString(formData, "password"),
    body: getString(formData, "body")
  });

  if (!parsed.success) {
    redirect(`/posts/${slug}?commentError=missing#comments`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      author: parsed.data.author,
      passwordHash,
      body: parsed.data.body
    }
  });

  revalidatePath(`/posts/${parsed.data.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/comments");
  redirect(`/posts/${parsed.data.slug}?comment=created#comments`);
}

async function verifyCommentPassword(commentId: string, password: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { passwordHash: true }
  });
  if (!comment) return false;
  return bcrypt.compare(password, comment.passwordHash);
}

export async function updateCommentAction(_state: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const slug = getString(formData, "slug");
  const limited = await checkRateLimit(`comment-update:${slug || "unknown"}`, 10, 60_000);
  if (!limited) {
    return commentActionState(false, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", "rate");
  }

  const parsed = commentUpdateSchema.safeParse({
    commentId: getString(formData, "commentId"),
    slug,
    password: getString(formData, "password"),
    body: getString(formData, "body")
  });

  if (!parsed.success) {
    return commentActionState(false, "댓글 내용과 비밀번호를 모두 입력해주세요.", "missing");
  }

  const ok = await verifyCommentPassword(parsed.data.commentId, parsed.data.password);
  if (!ok) {
    return commentActionState(false, "댓글 비밀번호가 올바르지 않습니다.", "password");
  }

  await prisma.comment.update({ where: { id: parsed.data.commentId }, data: { body: parsed.data.body } });
  revalidatePath(`/posts/${parsed.data.slug}`);
  redirect(`/posts/${parsed.data.slug}?comment=updated#comments`);
}

export async function deleteOwnCommentAction(_state: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const slug = getString(formData, "slug");
  const limited = await checkRateLimit(`comment-delete:${slug || "unknown"}`, 10, 60_000);
  if (!limited) {
    return commentActionState(false, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", "rate");
  }

  const parsed = commentPasswordSchema.safeParse({
    commentId: getString(formData, "commentId"),
    slug,
    password: getString(formData, "password")
  });

  if (!parsed.success) {
    return commentActionState(false, "댓글 비밀번호를 입력해주세요.", "missing");
  }

  const ok = await verifyCommentPassword(parsed.data.commentId, parsed.data.password);
  if (!ok) {
    return commentActionState(false, "댓글 비밀번호가 올바르지 않습니다.", "password");
  }

  await prisma.comment.delete({ where: { id: parsed.data.commentId } });
  revalidatePath(`/posts/${parsed.data.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/comments");
  redirect(`/posts/${parsed.data.slug}?comment=deleted#comments`);
}

export async function adminDeleteCommentAction(formData: FormData) {
  await requireAdmin();
  const commentId = getString(formData, "commentId");
  if (commentId) {
    await prisma.comment.delete({ where: { id: commentId } });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/comments");
  redirect("/admin/comments?deleted=1");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const parsed = taxonomySchema.safeParse({
    id: getOptionalString(formData, "id"),
    name: getString(formData, "name"),
    slug: getOptionalString(formData, "slug"),
    description: getOptionalString(formData, "description")
  });

  if (!parsed.success) {
    redirectBack("/admin/taxonomy", "invalid-category");
  }

  const slug = fallbackSlug(parsed.data.slug || parsed.data.name, "category");
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing && existing.id !== parsed.data.id) {
    redirectBack("/admin/taxonomy", "category-slug-exists");
  }

  if (parsed.data.id) {
    await prisma.category.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, slug, description: parsed.data.description }
    });
  } else {
    await prisma.category.create({
      data: { name: parsed.data.name, slug, description: parsed.data.description }
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy?saved=category");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const posts = id ? await prisma.post.count({ where: { categoryId: id } }) : 0;
  if (!id || posts > 0) {
    redirectBack("/admin/taxonomy", "category-in-use");
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy?deleted=category");
}

export async function saveTagAction(formData: FormData) {
  await requireAdmin();
  const parsed = taxonomySchema.pick({ id: true, name: true, slug: true }).safeParse({
    id: getOptionalString(formData, "id"),
    name: getString(formData, "name"),
    slug: getOptionalString(formData, "slug")
  });

  if (!parsed.success) {
    redirectBack("/admin/taxonomy", "invalid-tag");
  }

  const slug = fallbackSlug(parsed.data.slug || parsed.data.name, "tag");
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing && existing.id !== parsed.data.id) {
    redirectBack("/admin/taxonomy", "tag-slug-exists");
  }

  if (parsed.data.id) {
    await prisma.tag.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, slug } });
  } else {
    await prisma.tag.create({ data: { name: parsed.data.name, slug } });
  }

  revalidatePath("/");
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy?saved=tag");
}

export async function deleteTagAction(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  if (id) {
    await prisma.tag.delete({ where: { id } });
  }
  revalidatePath("/");
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy?deleted=tag");
}

export async function uploadMediaAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=missing");
  }

  const extension = getUploadExtension(file.type);
  if (!extension || file.size > MAX_UPLOAD_SIZE) {
    redirect("/admin/media?error=invalid");
  }

  const uploadRoot = getUploadRoot();
  await mkdir(uploadRoot, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(uploadRoot, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, bytes);
  await prisma.mediaAsset.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${filename}`
    }
  });

  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const asset = id ? await prisma.mediaAsset.findUnique({ where: { id } }) : null;
  if (asset) {
    const uploadRoot = getUploadRoot();
    const target = path.resolve(uploadRoot, asset.filename);
    if (target !== uploadRoot && target.startsWith(`${uploadRoot}${path.sep}`)) {
      await unlink(target).catch(() => undefined);
    }
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
  }
  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}
