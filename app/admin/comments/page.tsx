import Link from "next/link";
import { adminDeleteCommentAction } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams
}: {
  searchParams?: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const [comments, params] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: { post: { select: { title: true, slug: true } } }
    }),
    searchParams
  ]);

  return (
    <AdminShell title="댓글 관리" subtitle="방문자가 남긴 댓글을 확인하고 삭제합니다.">
      <div className="grid gap-4">
        {params?.deleted ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
            댓글이 삭제되었습니다.
          </div>
        ) : null}

        {comments.map((comment) => (
          <article className="card grid gap-3 p-5" key={comment.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>{comment.author}</strong>
                <p className="muted">{formatDateTime(comment.createdAt)}</p>
              </div>
              <Link href={`/posts/${comment.post.slug}`} className="pill">
                {comment.post.title}
              </Link>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{comment.body}</p>
            <form action={adminDeleteCommentAction} className="flex justify-end">
              <input type="hidden" name="commentId" value={comment.id} />
              <ConfirmSubmitButton message="이 댓글을 삭제할까요?">관리자 삭제</ConfirmSubmitButton>
            </form>
          </article>
        ))}

        {!comments.length ? (
          <div className="card p-8 text-center">
            <h2 className="font-black">아직 댓글이 없습니다.</h2>
            <p className="muted mt-2">공개 글에 댓글이 달리면 이곳에서 확인할 수 있습니다.</p>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
