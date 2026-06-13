"use client";

import { useActionState, useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ellipsis, Pencil, Trash2, X } from "lucide-react";
import { deleteOwnCommentAction, updateCommentAction } from "@/app/actions";
import { showCommentToast } from "@/components/CommentToast";

type ActionMode = "menu" | "edit" | "delete";

type CommentActionsProps = {
  commentId: string;
  slug: string;
  body: string;
  author: string;
};

type CommentActionState = {
  ok: boolean;
  message: string;
  code?: "idle" | "rate" | "missing" | "password" | "updated" | "deleted";
};

const initialActionState: CommentActionState = {
  ok: false,
  message: "",
  code: "idle"
};

function getActionMessage(state: CommentActionState, fallback: string) {
  if (state.ok) return state.message || fallback;
  if (state.code === "rate") return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (state.code === "missing") return "필수 정보를 모두 입력해주세요.";
  if (state.code === "password") return "댓글 비밀번호가 올바르지 않습니다.";
  return state.message || fallback;
}

export function CommentActions({ commentId, slug, body, author }: CommentActionsProps) {
  const [mode, setMode] = useState<ActionMode | null>(null);
  const titleId = useId();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMode(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode]);

  const handleSuccess = useCallback((message: string) => {
    setMode(null);
    router.refresh();
    window.setTimeout(() => {
      showCommentToast({ message, variant: "success" });
    }, 120);
  }, [router]);

  const dialogTitle = mode === "edit" ? "댓글 수정" : mode === "delete" ? "댓글 삭제" : "댓글 관리";

  const overlayMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };

  const dialogMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 14, scale: 0.98 },
        transition: { duration: 0.18 }
      };

  return (
    <>
      <MoreButton
        type="button"
        aria-label={`${author} 수정 삭제 메뉴`}
        data-testid={`comment-actions-${commentId}`}
        whileTap={{ scale: 0.94 }}
        onClick={() => setMode("menu")}
      >
        <Ellipsis size={18} aria-hidden="true" />
      </MoreButton>

      <AnimatePresence>
        {mode ? (
          <Overlay
            {...overlayMotion}
            role="presentation"
            data-testid="comment-action-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setMode(null);
              }
            }}
          >
            <Dialog
              {...dialogMotion}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="comment-action-dialog"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <DialogHeader>
                <div>
                  <DialogEyebrow>Comment</DialogEyebrow>
                  <DialogTitle id={titleId}>{dialogTitle}</DialogTitle>
                </div>
                <IconButton type="button" aria-label="닫기" whileTap={{ scale: 0.94 }} onClick={() => setMode(null)}>
                  <X size={18} aria-hidden="true" />
                </IconButton>
              </DialogHeader>

              {mode === "menu" ? (
                <ActionMenu>
                  <PreviewText>{body}</PreviewText>
                  <ActionChoice type="button" data-testid="comment-edit-open" onClick={() => setMode("edit")}>
                    <Pencil size={17} aria-hidden="true" />
                    <span>
                      <strong>수정하기</strong>
                      <small>댓글 비밀번호를 확인한 뒤 내용을 바꿉니다.</small>
                    </span>
                  </ActionChoice>
                  <ActionChoice type="button" className="danger" data-testid="comment-delete-open" onClick={() => setMode("delete")}>
                    <Trash2 size={17} aria-hidden="true" />
                    <span>
                      <strong>삭제하기</strong>
                      <small>작성할 때 입력한 댓글 비밀번호가 필요합니다.</small>
                    </span>
                  </ActionChoice>
                </ActionMenu>
              ) : null}

              {mode === "edit" ? (
                <EditCommentForm
                  commentId={commentId}
                  slug={slug}
                  body={body}
                  onBack={() => setMode("menu")}
                  onSuccess={handleSuccess}
                />
              ) : null}

              {mode === "delete" ? (
                <DeleteCommentForm commentId={commentId} slug={slug} onBack={() => setMode("menu")} onSuccess={handleSuccess} />
              ) : null}
            </Dialog>
          </Overlay>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function EditCommentForm({
  commentId,
  slug,
  body,
  onBack,
  onSuccess
}: {
  commentId: string;
  slug: string;
  body: string;
  onBack: () => void;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction, pending] = useActionState(updateCommentAction, initialActionState);

  useEffect(() => {
    if (!state.message && state.code === "idle") return;
    if (state.ok) {
      onSuccess(getActionMessage(state, "댓글이 수정되었습니다."));
      return;
    }
    showCommentToast({ message: getActionMessage(state, "댓글을 수정하지 못했습니다."), variant: "error" });
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="comment-modal-form">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="label">
        댓글 내용
        <textarea className="input comment-modal-textarea" name="body" defaultValue={body} required />
      </label>
      <label className="label">
        댓글 비밀번호
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      <DialogActions>
        <button className="button" type="button" onClick={onBack}>
          뒤로
        </button>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "저장 중..." : "수정 저장"}
        </button>
      </DialogActions>
    </form>
  );
}

function DeleteCommentForm({
  commentId,
  slug,
  onBack,
  onSuccess
}: {
  commentId: string;
  slug: string;
  onBack: () => void;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction, pending] = useActionState(deleteOwnCommentAction, initialActionState);

  useEffect(() => {
    if (!state.message && state.code === "idle") return;
    if (state.ok) {
      onSuccess(getActionMessage(state, "댓글이 삭제되었습니다."));
      return;
    }
    showCommentToast({ message: getActionMessage(state, "댓글을 삭제하지 못했습니다."), variant: "error" });
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="comment-modal-form">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="slug" value={slug} />
      <DeleteNotice>삭제한 댓글은 되돌릴 수 없습니다. 작성 시 입력한 비밀번호를 확인합니다.</DeleteNotice>
      <label className="label">
        댓글 비밀번호
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      <DialogActions>
        <button className="button" type="button" onClick={onBack}>
          뒤로
        </button>
        <button className="button button-danger" type="submit" disabled={pending}>
          {pending ? "삭제 중..." : "댓글 삭제"}
        </button>
      </DialogActions>
    </form>
  );
}

const MoreButton = styled(motion.button)`
  display: inline-flex;
  width: 2.1rem;
  height: 2.1rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-3);
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;

  &:hover {
    border-color: var(--primary-line);
    background: var(--primary-soft);
    color: var(--primary-strong);
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.36);
  padding: 1.25rem;
  backdrop-filter: blur(12px);

  @media (max-width: 639px) {
    align-items: end;
    padding: 0.75rem;
  }
`;

const Dialog = styled(motion.section)`
  width: min(100%, 30rem);
  max-height: min(680px, calc(100vh - 2rem));
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 1.35rem;
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  padding: 1rem;

  @media (max-width: 639px) {
    width: 100%;
    max-height: calc(100vh - 1.5rem);
    border-radius: 1.35rem 1.35rem 1rem 1rem;
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DialogEyebrow = styled.p`
  margin: 0 0 0.25rem;
  color: var(--primary-strong);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const DialogTitle = styled.h3`
  margin: 0;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.2;
`;

const IconButton = styled(motion.button)`
  display: inline-flex;
  width: 2.15rem;
  height: 2.15rem;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-3);

  &:hover {
    border-color: var(--line-strong);
    color: var(--text);
  }
`;

const ActionMenu = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const PreviewText = styled.p`
  display: -webkit-box;
  margin: 0 0 0.25rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface-2);
  padding: 0.85rem;
  color: var(--text-2);
  font-size: 0.92rem;
  line-height: 1.65;
  white-space: pre-wrap;
`;

const ActionChoice = styled.button`
  display: grid;
  grid-template-columns: 2.15rem minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface);
  padding: 0.8rem;
  color: var(--text);
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;

  svg {
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 999px;
    background: var(--primary-soft);
    padding: 0.5rem;
    color: var(--primary-strong);
  }

  strong,
  small {
    display: block;
  }

  strong {
    font-size: 0.95rem;
    font-weight: 900;
  }

  small {
    margin-top: 0.16rem;
    color: var(--text-3);
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.45;
  }

  &:hover {
    border-color: var(--primary-line);
    background: var(--primary-soft);
    transform: translateY(-1px);
  }

  &.danger svg {
    background: var(--danger-soft);
    color: var(--danger);
  }

  &.danger:hover {
    border-color: rgba(248, 113, 113, 0.34);
    background: var(--danger-soft);
  }
`;

const DialogActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const DeleteNotice = styled.p`
  margin: 0;
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 1rem;
  background: var(--danger-soft);
  padding: 0.8rem;
  color: var(--danger);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.6;
`;
