import Link from "next/link";
import { IconCover } from "@/components/IconCover";
import type { CategorySeriesItem } from "@/lib/data";

export function SeriesCard({ series }: { series: CategorySeriesItem }) {
  const firstPost = series.posts[0];
  const cover = firstPost?.cover && firstPost.cover !== "none" ? firstPost.cover : "blog";

  return (
    <Link className="series-card" href={`/categories/${series.slug}`}>
      <IconCover cover={cover} label={series.name} compact />
      <div className="series-card-body">
        <h3>{series.name}</h3>
        <p>{series.description || firstPost?.title || "카테고리 글 모음"}</p>
        <span className="pill">아티클 {series._count.posts}개</span>
      </div>
    </Link>
  );
}
