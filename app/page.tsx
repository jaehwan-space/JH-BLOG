import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  getCategorySeries,
  getFeaturedPosts,
  getPopularPosts,
  getPublishedPostPage,
  getRecentComments,
  type PostListItem
} from "@/lib/data";
import { ArticleListItem } from "@/components/ArticleListItem";
import { FeaturedHeroCarousel, type FeaturedHeroSlide } from "@/components/FeaturedHeroCarousel";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicSidebar } from "@/components/PublicSidebar";
import { SeriesCard } from "@/components/SeriesCard";
import { formatDate, readingMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

const HOME_PAGE_SIZE = 5;

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = parsePage(resolvedSearchParams?.page);
  const [postPage, featuredPosts, fallbackFeaturedPage, popularPosts, recentComments, categorySeries] = await Promise.all([
    getPublishedPostPage({ page: requestedPage, pageSize: HOME_PAGE_SIZE }),
    getFeaturedPosts(3),
    getPublishedPostPage({ page: 1, pageSize: 3 }),
    getPopularPosts(),
    getRecentComments(),
    getCategorySeries(4)
  ]);
  const heroPosts = featuredPosts.length ? featuredPosts : fallbackFeaturedPage.posts;
  const heroSlides = heroPosts.map(toFeaturedHeroSlide);

  return (
    <>
      <PublicHeader />
      <main>
        <section className="page-wrap home-hero-section">
          {heroSlides.length ? <FeaturedHeroCarousel slides={heroSlides} /> : <EmptyHero />}
        </section>

        <section id="articles" className="page-wrap home-article-grid">
          <div>
            <div className="section-heading">
              <p className="eyebrow">All Articles</p>
              <h2>전체 아티클</h2>
            </div>
            <div className="article-list-card card">
              {postPage.posts.map((post) => (
                <ArticleListItem key={post.id} post={post} />
              ))}
              {!postPage.posts.length ? <EmptyState /> : null}
            </div>
            <Pagination currentPage={postPage.page} totalPages={postPage.totalPages} />
          </div>
          <PublicSidebar popularPosts={popularPosts} recentComments={recentComments} />
        </section>

        {categorySeries.length ? (
          <section className="page-wrap series-section">
            <div className="section-heading">
              <p className="eyebrow">Series</p>
              <h2>아티클 시리즈</h2>
            </div>
            <div className="series-grid">
              {categorySeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

function toFeaturedHeroSlide(post: PostListItem): FeaturedHeroSlide {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover: post.cover,
    categoryName: post.category.name,
    dateLabel: formatDate(post.publishedAt || post.createdAt),
    readingMinutes: readingMinutes(post.content),
    comments: post._count.comments
  };
}

function EmptyHero() {
  return (
    <div className="empty-hero">
      <p className="eyebrow">Personal Blog</p>
      <h1>JH_BLOG</h1>
      <p>개발 기록, 회고, 마크다운 글쓰기를 차분하게 모아두는 개인 기술 블로그입니다.</p>
      <Link href="/admin/login" className="button button-primary">
        첫 글 작성하기
      </Link>
    </div>
  );
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <nav aria-label="전체 아티클 페이지" className="article-pagination" data-testid="article-pagination">
      {previousPage >= 1 ? (
        <Link className="pagination-link" href={pageHref(previousPage)} aria-label="이전 페이지">
          <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.4} />
        </Link>
      ) : (
        <span className="pagination-link pagination-disabled" aria-hidden="true">
          <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.4} />
        </span>
      )}
      {pages.map((page) => (
        <Link
          aria-current={page === currentPage ? "page" : undefined}
          className={`pagination-link ${page === currentPage ? "pagination-active" : ""}`}
          data-testid={`article-page-${page}`}
          href={pageHref(page)}
          key={page}
        >
          {page}
        </Link>
      ))}
      {nextPage <= totalPages ? (
        <Link className="pagination-link" href={pageHref(nextPage)} aria-label="다음 페이지">
          <ChevronRight aria-hidden="true" size={18} strokeWidth={2.4} />
        </Link>
      ) : (
        <span className="pagination-link pagination-disabled" aria-hidden="true">
          <ChevronRight aria-hidden="true" size={18} strokeWidth={2.4} />
        </span>
      )}
    </nav>
  );
}

function getVisiblePages(currentPage: number, totalPages: number, windowSize = 7) {
  const safeWindowSize = Math.max(1, windowSize);
  const halfWindow = Math.floor(safeWindowSize / 2);
  const maxStartPage = Math.max(1, totalPages - safeWindowSize + 1);
  const startPage = Math.min(Math.max(1, currentPage - halfWindow), maxStartPage);
  const endPage = Math.min(totalPages, startPage + safeWindowSize - 1);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

function pageHref(page: number) {
  return page <= 1 ? "/#articles" : `/?page=${page}#articles`;
}

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div>
        <h2>아직 표시할 글이 없습니다.</h2>
        <p className="muted">관리자에서 첫 글을 발행하면 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}
