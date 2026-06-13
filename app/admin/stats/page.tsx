import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  await requireAdmin();
  const [totalViews, postStats, dailyStats] = await Promise.all([
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.post.findMany({
      orderBy: { views: "desc" },
      take: 10,
      include: { _count: { select: { comments: true } } }
    }),
    prisma.postViewStat.findMany({
      orderBy: { date: "desc" },
      take: 14,
      include: { post: { select: { title: true, slug: true } } }
    })
  ]);

  return (
    <AdminShell title="통계" subtitle="글별 조회수와 최근 일자별 조회수를 확인합니다.">
      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="card p-5">
          <p className="muted">총 조회수</p>
          <strong className="mt-2 block text-4xl font-black">{(totalViews._sum.views || 0).toLocaleString()}</strong>
          <p className="muted mt-2">글 상세 방문 시 증가합니다.</p>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">글</th>
                <th className="px-4 py-3">조회수</th>
                <th className="px-4 py-3">댓글</th>
                <th className="px-4 py-3">바로가기</th>
              </tr>
            </thead>
            <tbody>
              {postStats.map((post) => (
                <tr key={post.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-bold">{post.title}</td>
                  <td className="px-4 py-3">{post.views.toLocaleString()}</td>
                  <td className="px-4 py-3">{post._count.comments}</td>
                  <td className="px-4 py-3">
                    <Link href={`/posts/${post.slug}`} className="button">
                      보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">글</th>
              <th className="px-4 py-3">조회수</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map((stat) => (
              <tr key={stat.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">{formatDate(stat.date)}</td>
                <td className="px-4 py-3">{stat.post.title}</td>
                <td className="px-4 py-3">{stat.views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
