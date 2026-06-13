import Link from "next/link";
import { SearchDialog } from "@/components/SearchDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCategories, getTags } from "@/lib/data";

export async function PublicHeader() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);
  const categoryOptions = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    count: category._count.posts
  }));
  const tagOptions = tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
    count: tag._count.posts
  }));

  return (
    <header className="public-header">
      <div className="page-wrap public-header-inner">
        <Link href="/" className="public-logo">
          <span className="public-logo-mark">JH</span>
          <span>JH_BLOG</span>
        </Link>
        <nav className="public-nav">
          <Link href="/#articles">글 목록</Link>
          <Link href="/admin/login">관리자</Link>
        </nav>
        <div className="public-header-actions">
          <SearchDialog categories={categoryOptions} tags={tagOptions} />
          <ThemeToggle />
          <Link href="/admin/login" className="public-mobile-admin">
            관리자
          </Link>
        </div>
      </div>
    </header>
  );
}
