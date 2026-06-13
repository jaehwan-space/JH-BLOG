import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="page-wrap grid min-h-[70vh] place-items-center py-10 text-center">
        <div className="card max-w-md p-8">
          <p className="eyebrow">404</p>
          <h1 className="mt-2 text-3xl font-black">페이지를 찾을 수 없습니다.</h1>
          <p className="muted mt-3">주소가 바뀌었거나 아직 발행되지 않은 글일 수 있습니다.</p>
          <Link href="/" className="button button-primary mt-6">
            홈으로 이동
          </Link>
        </div>
      </main>
    </>
  );
}
