import { changePasswordAction } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requireAdmin();
  const [user, params] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { username: true, passwordUpdatedAt: true, createdAt: true }
    }),
    searchParams
  ]);
  const message = getSettingsMessage(params);

  return (
    <AdminShell title="설정" subtitle="관리자 계정과 운영 정보를 관리합니다.">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="card grid gap-4 p-5">
          <h2 className="font-black">계정 정보</h2>
          <div className="grid gap-3 text-sm">
            <InfoRow label="아이디" value={user?.username || session.username} />
            <InfoRow label="계정 생성일" value={user ? formatDateTime(user.createdAt) : "-"} />
            <InfoRow label="비밀번호 변경일" value={user ? formatDateTime(user.passwordUpdatedAt) : "-"} />
          </div>
        </div>

        <form action={changePasswordAction} className="card grid gap-4 p-5">
          <div>
            <h2 className="font-black">비밀번호 변경</h2>
            <p className="muted mt-1">새 비밀번호는 8자 이상으로 설정하세요.</p>
          </div>
          {message ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
              {message}
            </div>
          ) : null}
          <label className="label">
            현재 비밀번호
            <input className="input" name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          <label className="label">
            새 비밀번호
            <input className="input" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <label className="label">
            새 비밀번호 확인
            <input className="input" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button className="button button-primary" type="submit">
            비밀번호 변경
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  );
}

function getSettingsMessage(params?: { error?: string; saved?: string }) {
  if (params?.saved === "password") return "비밀번호가 변경되었습니다.";
  if (params?.error === "rate") return "변경 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (params?.error === "current-password") return "현재 비밀번호가 올바르지 않습니다.";
  if (params?.error === "invalid-password") return "새 비밀번호 입력값을 확인해주세요.";
  return "";
}
