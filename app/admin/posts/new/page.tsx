import { AdminShell } from "@/components/AdminShell";
import { PostEditor } from "@/components/PostEditor";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdmin();
  const mediaAssets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, originalName: true, url: true }
  });

  return (
    <AdminShell title="새 글 작성" subtitle="마크다운 작성과 미리보기를 함께 확인합니다.">
      <PostEditor
        mediaAssets={mediaAssets}
        initialPost={{
          title: "",
          slug: "",
          excerpt: "",
          content: "# 새 글 제목\n\n여기에 글을 작성하세요.",
          category: "개발",
          tags: "",
          cover: "blog",
          heroImageUrl: null,
          heroImageAlt: null,
          status: "DRAFT"
        }}
      />
    </AdminShell>
  );
}
