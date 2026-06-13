import Link from "next/link";
import type { PostListItem, RecentCommentItem } from "@/lib/data";

export function PublicSidebar({
  popularPosts,
  recentComments
}: {
  popularPosts: PostListItem[];
  recentComments: RecentCommentItem[];
}) {
  return (
    <aside className="public-sidebar">
      <section className="side-panel">
        <h2 className="side-panel-title">인기 있는 글</h2>
        <ol className="popular-list">
          {popularPosts.map((post, index) => (
            <li className="popular-item" key={post.id}>
              <span className="popular-rank">{index + 1}</span>
              <div className="popular-content">
                <Link className="popular-link" href={`/posts/${post.slug}`}>
                  {post.title}
                </Link>
                <p className="muted popular-meta">조회 {post.views.toLocaleString()}</p>
              </div>
            </li>
          ))}
          {!popularPosts.length ? <p className="muted">아직 인기 글이 없습니다.</p> : null}
        </ol>
      </section>

      <section className="side-panel">
        <h2 className="side-panel-title">최신 댓글</h2>
        <div className="recent-comment-list">
          {recentComments.map((comment) => (
            <Link className="speech-card" href={`/posts/${comment.post.slug}#comments`} key={comment.id}>
              <strong>{comment.author}</strong>
              <span className="recent-comment-body">{comment.body}</span>
              <span className="muted recent-comment-post">{comment.post.title}</span>
            </Link>
          ))}
          {!recentComments.length ? <p className="muted">아직 댓글이 없습니다.</p> : null}
        </div>
      </section>
    </aside>
  );
}
