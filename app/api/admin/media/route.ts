import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUploadExtension, getUploadRoot, MAX_UPLOAD_SIZE } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "업로드할 이미지를 선택해주세요." }, { status: 400 });
  }

  const extension = getUploadExtension(file.type);
  if (!extension) {
    return NextResponse.json({ error: "GIF, JPG, PNG, WebP 이미지만 업로드할 수 있습니다." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "이미지는 10MB 이하만 업로드할 수 있습니다." }, { status: 400 });
  }

  const uploadRoot = getUploadRoot();
  await mkdir(uploadRoot, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(uploadRoot, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, bytes);

  const asset = await prisma.mediaAsset.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${filename}`
    },
    select: {
      id: true,
      originalName: true,
      url: true
    }
  });

  revalidatePath("/admin/media");

  return NextResponse.json({
    ...asset,
    markdown: `![${escapeMarkdownAlt(asset.originalName)}](${asset.url})`
  });
}

function escapeMarkdownAlt(value: string) {
  return value.replaceAll("[", "\\[").replaceAll("]", "\\]");
}
