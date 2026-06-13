import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { PostEditor } from "@/components/PostEditor";
import { getAdminPost } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  const [post, mediaAssets] = await Promise.all([
    getAdminPost(resolvedParams.id),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, originalName: true, url: true }
    })
  ]);

  if (!post) notFound();

  return (
    <AdminShell title="글 수정" subtitle="발행 상태와 본문을 안전하게 수정합니다.">
      <PostEditor
        mediaAssets={mediaAssets}
        initialPost={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category.name,
          tags: post.tags.map(({ tag }) => tag.name).join(", "),
          cover: post.cover,
          heroImageUrl: post.heroImageUrl,
          heroImageAlt: post.heroImageAlt,
          status: post.status
        }}
      />
    </AdminShell>
  );
}
