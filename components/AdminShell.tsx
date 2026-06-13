import Link from "next/link";
import { logoutAction } from "@/app/actions";

const navItems = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글 작성" },
  { href: "/admin/comments", label: "댓글" },
  { href: "/admin/media", label: "이미지" },
  { href: "/admin/taxonomy", label: "카테고리/태그" },
  { href: "/admin/stats", label: "통계" },
  { href: "/admin/settings", label: "설정" }
];

export function AdminShell({
  title,
  subtitle,
  children,
  action
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-grid grid min-h-screen bg-slate-50">
      <aside className="border-b border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <Link href="/admin" className="mb-6 flex items-center gap-3 font-black">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">JH</span>
          <span>JH_BLOG</span>
        </Link>
        <nav className="grid gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-primary-strong">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-6">
          <button className="button w-full" type="submit">
            로그아웃
          </button>
        </form>
      </aside>
      <main className="min-w-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <h1 className="text-2xl font-black text-slate-950">{title}</h1>
              <p className="muted mt-1">{subtitle}</p>
            </div>
            {action}
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
