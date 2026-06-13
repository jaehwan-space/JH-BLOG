import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPosts, getTags } from "@/lib/data";
import { ArticleListItem } from "@/components/ArticleListItem";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tags = await getTags();
  const tag = tags.find((item) => item.slug === resolvedParams.slug);

  if (!tag) {
    return { title: "태그를 찾을 수 없습니다" };
  }

  const title = `#${tag.name}`;
  const description = `${siteConfig.name}의 #${tag.name} 태그 글 목록입니다.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/tags/${tag.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/tags/${tag.slug}`),
      siteName: siteConfig.name
    }
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const [tags, posts] = await Promise.all([
    getTags(),
    getPublishedPosts({ tagSlug: resolvedParams.slug })
  ]);
  const tag = tags.find((item) => item.slug === resolvedParams.slug);
  if (!tag) notFound();

  return (
    <>
      <PublicHeader />
      <main className="page-wrap grid gap-8 py-10">
        <header className="grid gap-4 border-b border-slate-200 pb-8">
          <Link href="/#articles" className="muted hover:text-primary-strong">
            ← 전체 글
          </Link>
          <SectionHeader eyebrow="Tag" title={`#${tag.name}`} description={`${posts.length}개의 글이 있습니다.`} />
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
