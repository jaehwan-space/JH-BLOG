import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { deletePostAction } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; category?: string; saved?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const q = filters?.q?.trim() || "";
  const status = filters?.status === "PUBLISHED" || filters?.status === "DRAFT" ? filters.status : "";
  const category = filters?.category || "";
  const message = getPostListMessage(filters);

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        ...(status ? { status: status as PostStatus } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { excerpt: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: "desc" },
      include: { category: true, _count: { select: { comments: true } } }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <AdminShell
      title="글 관리"
      subtitle="발행 글과 초안을 검색하고 정리합니다."
      action={
        <Link href="/admin/posts/new" className="button button-primary">
          새 글 작성
        </Link>
      }
    >
      {message ? (
        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          {message}
        </div>
      ) : null}

      <form className="card mb-5 grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]" action="/admin/posts">
        <input className="input" name="q" defaultValue={q} placeholder="제목, 요약, slug 검색" />
        <select className="input" name="status" defaultValue={status}>
          <option value="">전체 상태</option>
          <option value="PUBLISHED">발행</option>
          <option value="DRAFT">초안</option>
        </select>
        <select className="input" name="category" defaultValue={category}>
          <option value="">전체 카테고리</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <button className="button button-primary" type="submit">
          필터 적용
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">조회/댓글</th>
              <th className="px-4 py-3">수정일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <strong className="block max-w-md truncate text-slate-950">{post.title}</strong>
                  <span className="muted">/{post.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={post.status === "PUBLISHED" ? "pill pill-active" : "pill"}>
                    {post.status === "PUBLISHED" ? "발행" : "초안"}
                  </span>
                </td>
                <td className="px-4 py-3">{post.category.name}</td>
                <td className="px-4 py-3">
                  조회 {post.views.toLocaleString()} · 댓글 {post._count.comments}
                </td>
                <td className="px-4 py-3">{formatDate(post.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link className="button" href={`/admin/posts/${post.id}/preview`}>
                      미리보기
                    </Link>
                    <Link className="button" href={`/admin/posts/${post.id}/edit`}>
                      수정
                    </Link>
                    <form action={deletePostAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <ConfirmSubmitButton message="이 글과 연결된 댓글을 모두 삭제할까요?">삭제</ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!posts.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  조건에 맞는 글이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function getPostListMessage(params?: { saved?: string; deleted?: string; error?: string }) {
  if (params?.saved) return "글이 저장되었습니다.";
  if (params?.deleted) return "글이 삭제되었습니다.";
  if (params?.error === "invalid-post") return "글 입력값을 확인해주세요.";
  return "";
}
