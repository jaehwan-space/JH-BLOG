import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getPublishedPosts } from "@/lib/data";
import { ArticleListItem } from "@/components/ArticleListItem";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === resolvedParams.slug);

  if (!category) {
    return { title: "카테고리를 찾을 수 없습니다" };
  }

  const title = `${category.name} 카테고리`;
  const description = `${siteConfig.name}의 ${category.name} 카테고리 글 목록입니다.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/categories/${category.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/categories/${category.slug}`),
      siteName: siteConfig.name
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const [categories, posts] = await Promise.all([
    getCategories(),
    getPublishedPosts({ categorySlug: resolvedParams.slug })
  ]);
  const category = categories.find((item) => item.slug === resolvedParams.slug);
  if (!category) notFound();

  return (
    <>
      <PublicHeader />
      <main className="page-wrap grid gap-8 py-10">
        <header className="grid gap-4 border-b border-slate-200 pb-8">
          <Link href="/#articles" className="muted hover:text-primary-strong">
            ← 전체 글
          </Link>
          <SectionHeader
            eyebrow="Category"
            title={category.name}
            description={`${posts.length}개의 글이 있습니다.`}
          />
        </header>
        <section className="card px-5">
          {posts.map((post) => (
            <ArticleListItem key={post.id} post={post} />
          ))}
        </section>
      </main>
    </>
  );
}
