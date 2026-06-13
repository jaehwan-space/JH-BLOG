"use client";

import styled from "@emotion/styled";
import Image from "next/image";

const COVER_LABELS: Record<string, string> = {
  none: "사진 없음",
  admin: "관리자 UX",
  blog: "블로그",
  comment: "댓글",
  dev: "개발",
  markdown: "마크다운",
  retro: "회고",
  search: "검색",
  stats: "통계",
  til: "TIL"
};

export const coverOptions = Object.entries(COVER_LABELS).map(([value, label]) => ({ value, label }));

export function IconCover({
  cover,
  label,
  compact = false
}: {
  cover: string;
  label?: string;
  compact?: boolean;
}) {
  if (cover === "none") return null;

  const safeCover = COVER_LABELS[cover] ? cover : "blog";
  return (
    <CoverFrame className="icon-cover" $compact={compact}>
      <CoverGradient />
      <CoverGlow />
      <CoverContent>
        <StickerFrame className="sticker-frame">
          <Image
            src={`/assets/icon-${safeCover}.svg`}
            alt=""
            width={compact ? 56 : 92}
            height={compact ? 56 : 92}
            aria-hidden="true"
          />
        </StickerFrame>
      </CoverContent>
      <CoverLabel>{label || COVER_LABELS[safeCover]}</CoverLabel>
    </CoverFrame>
  );
}

const CoverFrame = styled.div<{ $compact: boolean }>`
  position: relative;
  overflow: hidden;
  aspect-ratio: ${({ $compact }) => ($compact ? "4 / 3" : "16 / 10")};
  border: 1px solid var(--line);
  border-radius: ${({ $compact }) => ($compact ? "1rem" : "28px")};
`;

const CoverGradient = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 20%, rgba(255, 255, 255, 0.85), transparent 28%),
    linear-gradient(135deg, var(--primary-soft), var(--surface));
`;

const CoverGlow = styled.div`
  position: absolute;
  top: -1.5rem;
  right: -1.5rem;
  width: 7rem;
  height: 7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  filter: blur(28px);
`;

const CoverContent = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const StickerFrame = styled.div`
  display: grid;
  place-items: center;
`;

const CoverLabel = styled.span`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.25rem 0.75rem;
  color: var(--text-3);
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 0 8px 24px -18px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(8px);

  :root[data-theme="dark"] & {
    background: rgba(17, 24, 39, 0.82);
  }
`;
