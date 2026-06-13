import Image from "next/image";
import { deleteMediaAction, uploadMediaAction } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import { formatBytes, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; uploaded?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const assets = await prisma.mediaAsset.findMany({
    where: query
      ? {
          OR: [
            { originalName: { contains: query, mode: "insensitive" } },
            { filename: { contains: query, mode: "insensitive" } },
            { mimeType: { contains: query, mode: "insensitive" } }
          ]
        }
      : {},
    orderBy: { createdAt: "desc" }
  });
  const usageCounts = await Promise.all(
    assets.map((asset) =>
      prisma.post.count({
        where: {
          content: { contains: asset.url, mode: "insensitive" }
        }
      })
    )
  );
  const message = getMessage(params);

  return (
    <AdminShell title="이미지 관리" subtitle="글 본문에 삽입할 이미지를 업로드하고 Markdown을 복사합니다.">
      <div className="grid gap-5">
        {message ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
            {message}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form action="/admin/media" className="card grid gap-3 p-5">
            <h2 className="font-black">이미지 검색</h2>
            <input className="input" name="q" defaultValue={query} placeholder="파일명, MIME 타입 검색" />
            <button className="button" type="submit">
              검색
            </button>
          </form>

          <form action={uploadMediaAction} className="card grid gap-4 p-5">
            <h2 className="font-black">새 이미지 업로드</h2>
            <label className="label">
              이미지 파일
              <input className="input" name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
            </label>
            <button className="button button-primary" type="submit">
              업로드
            </button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset, index) => {
            const markdown = `![${asset.originalName}](${asset.url})`;
            const usedCount = usageCounts[index] || 0;

            return (
              <article className="card overflow-hidden" key={asset.id}>
                <div className="relative aspect-video bg-slate-100">
                  <Image src={asset.url} alt={asset.originalName} fill className="object-cover" unoptimized />
                </div>
                <div className="grid gap-3 p-4">
                  <div>
                    <strong className="line-clamp-1">{asset.originalName}</strong>
                    <p className="muted">{formatDateTime(asset.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill">{formatBytes(asset.size)}</span>
                    <span className={usedCount ? "pill pill-active" : "pill"}>
                      {usedCount ? `본문 사용 ${usedCount}개` : "미사용"}
                    </span>
                    <span className="pill">{asset.mimeType}</span>
                  </div>
                  <input className="input font-mono text-xs" readOnly value={markdown} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <CopyButton value={markdown} label="Markdown 복사" />
                    <form action={deleteMediaAction}>
                      <input type="hidden" name="id" value={asset.id} />
                      <ConfirmSubmitButton
                        className="button button-danger w-full"
                        message="이 이미지를 삭제할까요? 본문에서 사용 중이면 이미지가 보이지 않을 수 있습니다."
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {!assets.length ? (
          <div className="card p-8 text-center">
            <h2 className="font-black">이미지가 없습니다.</h2>
            <p className="muted mt-2">검색어를 바꾸거나 새 이미지를 업로드해보세요.</p>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

function getMessage(searchParams?: { uploaded?: string; deleted?: string; error?: string }) {
  if (searchParams?.uploaded) return "이미지가 업로드되었습니다.";
  if (searchParams?.deleted) return "이미지가 삭제되었습니다.";
  if (searchParams?.error === "missing") return "업로드할 이미지를 선택해주세요.";
  if (searchParams?.error === "invalid") return "10MB 이하의 PNG, JPG, WebP, GIF 파일만 업로드할 수 있습니다.";
  return "";
}
