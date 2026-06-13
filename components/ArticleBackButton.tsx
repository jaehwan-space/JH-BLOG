"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ArticleBackButton() {
  const router = useRouter();

  function goBack() {
    const hasSameOriginReferrer = document.referrer.startsWith(window.location.origin);

    if (hasSameOriginReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/#articles");
  }

  return (
    <button
      type="button"
      className="article-back-button"
      aria-label="이전 화면으로 돌아가기"
      onClick={goBack}
    >
      <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.2} />
      <span>이전 화면</span>
    </button>
  );
}
