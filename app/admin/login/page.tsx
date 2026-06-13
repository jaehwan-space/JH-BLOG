import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getSession } from "@/lib/auth";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/admin");
  const resolvedSearchParams = await searchParams;
  const errorMessage = getLoginErrorMessage(resolvedSearchParams?.error);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="card w-full max-w-md p-6">
        <div className="mb-6 grid gap-2">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 font-black text-white">JH</span>
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-black text-slate-950">관리자 로그인</h1>
          <p className="muted">글 작성, 댓글 관리, 통계를 확인하려면 로그인하세요.</p>
        </div>
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <form action={loginAction} className="grid gap-4">
          <label className="label">
            아이디
            <input className="input" name="username" autoComplete="username" required />
          </label>
          <label className="label">
            비밀번호
            <input className="input" name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary" type="submit">
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error?: string) {
  if (error === "rate") return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (error === "invalid") return "아이디 또는 비밀번호가 올바르지 않습니다.";
  return "";
}
