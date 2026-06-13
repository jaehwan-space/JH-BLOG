import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { addFeaturedPostAction, moveFeaturedPostAction, removeFeaturedPostAction } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FEATURED_POST_LIMIT = 3;

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ featured?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [postCount, publishedCount, commentCount, totalViews, popularPosts, recentComments, featuredPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.comment.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { views: "desc" },
      take: 5,
      include: { category: true }
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { post: { select: { title: true, slug: true } } }
    }),
    prisma.featuredPost.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        post: {
          include: {
            category: true,
            _count: { select: { comments: true } }
          }
        }
      }
    })
  ]);

  const featuredPostIds = featuredPosts.map((item) => item.postId);
  const availablePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      ...(featuredPostIds.length ? { id: { notIn: featuredPostIds } } : {})
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { category: true },
    take: 50
  });
  const featuredMessage = getFeaturedMessage(params?.featured);

  return (
    <AdminShell
      title="대시보드"
      subtitle="오늘 블로그 상태와 처리할 일을 한 화면에서 확인합니다."
      action={
        <Link href="/admin/posts/new" className="button button-primary">
          새 글 작성
        </Link>
      }
    >
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="전체 조회수" value={(totalViews._sum.views || 0).toLocaleString()} caption="누적 기준" />
        <StatCard label="전체 글" value={postCount.toLocaleString()} caption={`발행 ${publishedCount}개`} />
        <StatCard label="댓글" value={commentCount.toLocaleString()} caption="즉시 공개" />
        <StatCard label="초안" value={(postCount - publishedCount).toLocaleString()} caption="작성 중인 글" />
      </section>

      <section className="card mt-6 p-5" data-testid="featured-admin-panel">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Home Carousel</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">대표 글 캐러셀 관리</h2>
            <p className="muted mt-1">홈 상단에 노출할 대표 글을 최대 {FEATURED_POST_LIMIT}개까지 직접 고릅니다.</p>
          </div>
          <span className="pill w-max">{featuredPosts.length} / {FEATURED_POST_LIMIT}</span>
        </div>

        {featuredMessage ? (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
            {featuredMessage}
          </div>
        ) : null}

        <div className="grid gap-3">
          {featuredPosts.map((item, index) => (
            <article
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[40px_minmax(0,1fr)_auto] lg:items-center"
              data-testid={`featured-admin-item-${index + 1}`}
              key={item.id}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-sm font-black text-primary-strong">
                {index + 1}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-slate-950">{item.post.title}</strong>
                <p className="muted mt-1">
                  {item.post.category.name} · 조회 {item.post.views.toLocaleString()} · 댓글 {item.post._count.comments}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <form action={moveFeaturedPostAction}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="direction" type="hidden" value="up" />
                  <button className="button h-9 px-3" disabled={index === 0} type="submit">
                    위로
                  </button>
                </form>
                <form action={moveFeaturedPostAction}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="direction" type="hidden" value="down" />
                  <button className="button h-9 px-3" disabled={index === featuredPosts.length - 1} type="submit">
                    아래로
                  </button>
                </form>
                <form action={removeFeaturedPostAction}>
                  <input name="id" type="hidden" value={item.id} />
                  <button className="button button-danger h-9 px-3" type="submit">
                    제거
                  </button>
                </form>
              </div>
            </article>
          ))}
          {!featuredPosts.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              아직 선택한 대표 글이 없습니다. 홈에서는 최신 공개 글 3개가 임시로 표시됩니다.
            </div>
          ) : null}
        </div>

        <form className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" action={addFeaturedPostAction}>
          <select
            className="input"
            data-testid="featured-post-select"
            disabled={featuredPosts.length >= FEATURED_POST_LIMIT || !availablePosts.length}
            name="postId"
            required
          >
            <option value="">대표 글로 추가할 공개 글 선택</option>
            {availablePosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title} · {post.category.name}
              </option>
            ))}
          </select>
          <button
            className="button button-primary"
            disabled={featuredPosts.length >= FEATURED_POST_LIMIT || !availablePosts.length}
            type="submit"
          >
            대표 글 추가
          </button>
        </form>
        {featuredPosts.length >= FEATURED_POST_LIMIT ? (
          <p className="muted mt-3">대표 글은 최대 {FEATURED_POST_LIMIT}개까지 등록할 수 있습니다.</p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-black">인기 글</h2>
          <div className="grid gap-3">
            {popularPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <strong className="line-clamp-1">{post.title}</strong>
                  <span className="pill shrink-0">조회 {post.views.toLocaleString()}</span>
                </div>
                <p className="muted mt-1">{post.category.name}</p>
              </Link>
            ))}
            {!popularPosts.length ? <p className="muted">아직 발행한 글이 없습니다.</p> : null}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-black">최근 댓글</h2>
          <div className="grid gap-3">
            {recentComments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong>{comment.author}</strong>
                  <span className="muted">{formatDateTime(comment.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{comment.body}</p>
                <Link className="muted mt-2 inline-block hover:text-primary-strong" href={`/posts/${comment.post.slug}`}>
                  {comment.post.title}
                </Link>
              </div>
            ))}
            {!recentComments.length ? <p className="muted">아직 댓글이 없습니다.</p> : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="card p-5">
      <p className="muted">{label}</p>
      <strong className="mt-2 block text-3xl font-black text-slate-950">{value}</strong>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </article>
  );
}

function getFeaturedMessage(code?: string) {
  switch (code) {
    case "added":
      return "대표 글을 추가했습니다.";
    case "removed":
      return "대표 글을 제거했습니다.";
    case "moved":
      return "대표 글 순서를 변경했습니다.";
    case "max":
      return "대표 글은 최대 3개까지 등록할 수 있습니다.";
    case "duplicate":
      return "이미 대표 글로 등록된 글입니다.";
    case "unpublished":
      return "발행된 글만 대표 글로 등록할 수 있습니다.";
    case "invalid":
      return "대표 글 입력값을 확인해주세요.";
    case "unchanged":
      return "변경할 순서가 없습니다.";
    default:
      return "";
  }
}
