import {
  deleteCategoryAction,
  deleteTagAction,
  saveCategoryAction,
  saveTagAction
} from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomyPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const [categories, tags, params] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } }
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } }
    }),
    searchParams
  ]);
  const message = getTaxonomyMessage(params);

  return (
    <AdminShell title="카테고리/태그" subtitle="글 탐색에 쓰이는 분류 체계를 관리합니다.">
      {message ? (
        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="grid gap-4">
          <form action={saveCategoryAction} className="card grid gap-3 p-5">
            <h2 className="font-black">새 카테고리</h2>
            <input className="input" name="name" placeholder="카테고리 이름" required />
            <input className="input" name="slug" placeholder="slug, 비워두면 자동 생성" />
            <input className="input" name="description" placeholder="설명" />
            <button className="button button-primary" type="submit">
              카테고리 추가
            </button>
          </form>

          <div className="card divide-y divide-slate-100 overflow-hidden">
            {categories.map((category) => (
              <form action={saveCategoryAction} className="grid gap-3 p-4" key={category.id}>
                <input type="hidden" name="id" value={category.id} />
                <div className="grid gap-3 lg:grid-cols-2">
                  <input className="input" name="name" defaultValue={category.name} />
                  <input className="input" name="slug" defaultValue={category.slug} />
                </div>
                <input className="input" name="description" defaultValue={category.description || ""} placeholder="설명" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="muted">연결 글 {category._count.posts}개</span>
                  <div className="flex gap-2">
                    <button className="button" type="submit">
                      저장
                    </button>
                    <ConfirmSubmitButton formId={`delete-category-${category.id}`} message="이 카테고리를 삭제할까요? 연결된 글이 있으면 삭제되지 않습니다.">
                      삭제
                    </ConfirmSubmitButton>
                  </div>
                </div>
              </form>
            ))}
          </div>
          {categories.map((category) => (
            <form action={deleteCategoryAction} id={`delete-category-${category.id}`} key={`delete-${category.id}`}>
              <input type="hidden" name="id" value={category.id} />
            </form>
          ))}
        </div>

        <div className="grid gap-4">
          <form action={saveTagAction} className="card grid gap-3 p-5">
            <h2 className="font-black">새 태그</h2>
            <input className="input" name="name" placeholder="태그 이름" required />
            <input className="input" name="slug" placeholder="slug, 비워두면 자동 생성" />
            <button className="button button-primary" type="submit">
              태그 추가
            </button>
          </form>

          <div className="card divide-y divide-slate-100 overflow-hidden">
            {tags.map((tag) => (
              <form action={saveTagAction} className="grid gap-3 p-4" key={tag.id}>
                <input type="hidden" name="id" value={tag.id} />
                <div className="grid gap-3 lg:grid-cols-2">
                  <input className="input" name="name" defaultValue={tag.name} />
                  <input className="input" name="slug" defaultValue={tag.slug} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="muted">연결 글 {tag._count.posts}개</span>
                  <div className="flex gap-2">
                    <button className="button" type="submit">
                      저장
                    </button>
                    <ConfirmSubmitButton formId={`delete-tag-${tag.id}`} message="이 태그를 삭제할까요? 글은 삭제되지 않습니다.">
                      삭제
                    </ConfirmSubmitButton>
                  </div>
                </div>
              </form>
            ))}
          </div>
          {tags.map((tag) => (
            <form action={deleteTagAction} id={`delete-tag-${tag.id}`} key={`delete-${tag.id}`}>
              <input type="hidden" name="id" value={tag.id} />
            </form>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function getTaxonomyMessage(params?: { error?: string; saved?: string; deleted?: string }) {
  if (params?.saved === "category") return "카테고리가 저장되었습니다.";
  if (params?.saved === "tag") return "태그가 저장되었습니다.";
  if (params?.deleted === "category") return "카테고리가 삭제되었습니다.";
  if (params?.deleted === "tag") return "태그가 삭제되었습니다.";
  if (params?.error === "category-in-use") return "글이 연결된 카테고리는 삭제할 수 없습니다.";
  if (params?.error === "category-slug-exists") return "이미 사용 중인 카테고리 slug입니다.";
  if (params?.error === "tag-slug-exists") return "이미 사용 중인 태그 slug입니다.";
  if (params?.error) return "입력값을 확인해주세요.";
  return "";
}
