"use client";

import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, XCircle } from "lucide-react";

export type CommentToastPayload = {
  message: string;
  variant?: "success" | "error";
};

type ToastState = Required<CommentToastPayload> & {
  id: number;
};

const COMMENT_TOAST_EVENT = "jh-blog-comment-toast";

export function showCommentToast(payload: CommentToastPayload) {
  if (typeof window === "undefined" || !payload.message) return;
  window.dispatchEvent(new CustomEvent<CommentToastPayload>(COMMENT_TOAST_EVENT, { detail: payload }));
}

export function CommentToast({ initialToast }: { initialToast?: CommentToastPayload | null }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const initialMessage = initialToast?.message || "";
  const initialVariant = initialToast?.variant || "success";

  useEffect(() => {
    function pushToast(payload: CommentToastPayload) {
      if (!payload.message) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);

      setToast({
        id: Date.now(),
        message: payload.message,
        variant: payload.variant || "success"
      });

      timerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 5000);
    }

    function handleToast(event: Event) {
      pushToast((event as CustomEvent<CommentToastPayload>).detail);
    }

    window.addEventListener(COMMENT_TOAST_EVENT, handleToast);
    if (initialMessage) {
      pushToast({ message: initialMessage, variant: initialVariant });
      const url = new URL(window.location.href);
      url.searchParams.delete("comment");
      url.searchParams.delete("commentError");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }

    return () => {
      window.removeEventListener(COMMENT_TOAST_EVENT, handleToast);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [initialMessage, initialVariant]);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: -12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
        transition: { duration: 0.18 }
      };

  return (
    <ToastRegion aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toast ? (
          <ToastCard
            {...motionProps}
            $variant={toast.variant}
            role={toast.variant === "error" ? "alert" : "status"}
            data-testid="comment-toast"
          >
            <ToastIcon $variant={toast.variant}>
              {toast.variant === "error" ? <XCircle size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
            </ToastIcon>
            <span>{toast.message}</span>
          </ToastCard>
        ) : null}
      </AnimatePresence>
    </ToastRegion>
  );
}

const ToastRegion = styled.div`
  position: fixed;
  top: max(1rem, env(safe-area-inset-top));
  left: 50%;
  z-index: 10020;
  display: grid;
  width: min(24rem, calc(100vw - 2rem));
  transform: translateX(-50%);
  pointer-events: none;

  @media (max-width: 639px) {
    width: calc(100vw - 2rem);
  }
`;

const ToastCard = styled(motion.div)<{ $variant: "success" | "error" }>`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  align-items: center;
  gap: 0.7rem;
  border: 1px solid ${({ $variant }) => ($variant === "error" ? "rgba(248, 113, 113, 0.32)" : "var(--primary-line)")};
  border-radius: 1.1rem;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow-lift);
  padding: 0.75rem 0.85rem;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.45;
  pointer-events: auto;
  backdrop-filter: blur(18px);
`;

const ToastIcon = styled.span<{ $variant: "success" | "error" }>`
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ $variant }) => ($variant === "error" ? "var(--danger-soft)" : "var(--primary-soft)")};
  color: ${({ $variant }) => ($variant === "error" ? "var(--danger)" : "var(--primary-strong)")};
`;
