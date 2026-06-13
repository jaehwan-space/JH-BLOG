"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { savePostAction } from "@/app/actions";
import { coverOptions } from "@/components/IconCover";
import { extractMarkdownImages } from "@/lib/markdown-images";
import { markdownSanitizeSchema } from "@/lib/markdown-schema";

export type EditorInitialPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  cover: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  status: "DRAFT" | "PUBLISHED";
};

type EditorMediaAsset = {
  id: string;
  originalName: string;
  url: string;
};

type EditorPanel = "write" | "preview";

type ToolbarAction =
  | {
      kind: "snippet";
      label: string;
      title: string;
      prefix: string;
      suffix?: string;
      placeholder: string;
      block?: boolean;
    }
  | {
      kind: "raw";
      label: string;
      title: string;
      value: string;
    };

const toolbarActions: ToolbarAction[] = [
  { kind: "snippet", label: "H2", title: "H2 삽입", prefix: "## ", placeholder: "소제목", block: true },
  { kind: "snippet", label: "B", title: "굵게", prefix: "**", suffix: "**", placeholder: "굵은 텍스트" },
  { kind: "snippet", label: "I", title: "기울임", prefix: "*", suffix: "*", placeholder: "기울임 텍스트" },
  { kind: "snippet", label: "Link", title: "링크", prefix: "[", suffix: "](https://example.com)", placeholder: "링크 텍스트" },
  { kind: "snippet", label: "Quote", title: "인용문", prefix: "> ", placeholder: "인용문", block: true },
  { kind: "snippet", label: "Code", title: "코드블록", prefix: "```\n", suffix: "\n```", placeholder: "code", block: true },
  { kind: "snippet", label: "List", title: "목록", prefix: "- ", placeholder: "목록 항목", block: true },
  { kind: "raw", label: "Line", title: "구분선", value: "\n\n---\n\n" }
];

export function PostEditor({
  initialPost,
  mediaAssets = []
}: {
  initialPost: EditorInitialPost;
  mediaAssets?: EditorMediaAsset[];
}) {
  const [content, setContent] = useState(initialPost.content);
  const [title, setTitle] = useState(initialPost.title);
  const [selectedHeroImageUrl, setSelectedHeroImageUrl] = useState(initialPost.heroImageUrl || "");
  const [assets, setAssets] = useState(mediaAssets);
  const [activePanel, setActivePanel] = useState<EditorPanel>("write");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const markdownImages = useMemo(() => extractMarkdownImages(content), [content]);
  const validSelectedHeroImageUrl = markdownImages.some((image) => image.url === selectedHeroImageUrl) ? selectedHeroImageUrl : "";
  const selectedHeroImageMissing = Boolean(selectedHeroImageUrl && !validSelectedHeroImageUrl);

  function insertTextAtCursor(value: string, selectStartOffset?: number, selectEndOffset?: number) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent((current) => `${current}${value}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = textarea.value;
    const nextContent = `${currentContent.slice(0, start)}${value}${currentContent.slice(end)}`;
    textarea.value = nextContent;
    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + (selectStartOffset ?? value.length);
      const cursorEnd = start + (selectEndOffset ?? selectStartOffset ?? value.length);
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function insertSnippet(action: Extract<ToolbarAction, { kind: "snippet" }>) {
    const textarea = textareaRef.current;
    const currentContent = textarea?.value ?? content;
    const start = textarea?.selectionStart ?? currentContent.length;
    const end = textarea?.selectionEnd ?? currentContent.length;
    const selected = currentContent.slice(start, end);
    const body = selected || action.placeholder;
    const needsLeadingLine = action.block && start > 0 && currentContent[start - 1] !== "\n";
    const prefix = `${needsLeadingLine ? "\n" : ""}${action.prefix}`;
    const value = `${prefix}${body}${action.suffix || ""}`;
    const bodyStart = prefix.length;
    insertTextAtCursor(value, bodyStart, bodyStart + body.length);
  }

  function insertMarkdownImage(asset: EditorMediaAsset) {
    insertTextAtCursor(`\n![${asset.originalName}](${asset.url})\n`);
  }

  async function uploadInlineImage(file: File) {
    setIsUploading(true);
    setUploadStatus("이미지를 업로드하는 중입니다.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as Partial<EditorMediaAsset> & { markdown?: string; error?: string };

      if (!response.ok || !result.id || !result.originalName || !result.url) {
        setUploadStatus(result.error || "이미지 업로드에 실패했습니다.");
        return;
      }

      const nextAsset = {
        id: result.id,
        originalName: result.originalName,
        url: result.url
      };
      setAssets((current) => [nextAsset, ...current.filter((asset) => asset.id !== nextAsset.id)].slice(0, 20));
      insertTextAtCursor(`\n${result.markdown || `![${nextAsset.originalName}](${nextAsset.url})`}\n`);
      setUploadStatus("이미지를 본문에 삽입했습니다.");
    } catch {
      setUploadStatus("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  }

  return (
    <form action={savePostAction} className="grid gap-5">
      <input type="hidden" name="id" value={initialPost.id || ""} />
      <input type="hidden" name="heroImageUrl" value={validSelectedHeroImageUrl} />
      <section className="card grid gap-4 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="label">
            제목
            <input
              className="input"
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="글 제목을 입력하세요"
            />
          </label>
          <label className="label">
            Slug
            <input className="input" name="slug" defaultValue={initialPost.slug} placeholder="비워두면 제목으로 생성됩니다" />
          </label>
        </div>
        <label className="label">
          요약
          <textarea
            className="input min-h-24 resize-y rounded-2xl"
            name="excerpt"
            required
            defaultValue={initialPost.excerpt}
            placeholder="피드에 노출할 짧은 설명"
          />
        </label>
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="label">
            카테고리
            <input className="input" name="category" defaultValue={initialPost.category} placeholder="개발" />
          </label>
          <label className="label lg:col-span-2">
            태그
            <input className="input" name="tags" defaultValue={initialPost.tags} placeholder="Next.js, Markdown, 회고" />
          </label>
          <label className="label">
            커버
            <select className="input" name="cover" defaultValue={initialPost.cover}>
              {coverOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card grid gap-4 p-5" data-testid="hero-image-picker">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-black">대표이미지 선택</h2>
            <p className="muted mt-1">본문에 삽입한 이미지 중 글 상세 상단에 보여줄 이미지를 고릅니다.</p>
          </div>
          <span className="pill">{markdownImages.length.toLocaleString()}개 후보</span>
        </div>

        <label
          className={`grid cursor-pointer gap-2 rounded-2xl border p-4 transition ${
            !validSelectedHeroImageUrl ? "border-primary-line bg-primary-soft" : "border-slate-200 bg-white"
          }`}
        >
          <span className="flex items-center gap-2 font-bold">
            <input
              name="heroImageChoice"
              type="radio"
              checked={!validSelectedHeroImageUrl}
              onChange={() => setSelectedHeroImageUrl("")}
            />
            대표이미지 없음
          </span>
          <span className="muted">이미지 영역 없이 제목과 본문이 바로 이어집니다.</span>
        </label>

        {markdownImages.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {markdownImages.map((image, index) => {
              const isSelected = validSelectedHeroImageUrl === image.url;
              return (
                <label
                  className={`grid cursor-pointer gap-3 rounded-2xl border p-3 transition ${
                    isSelected ? "border-primary-line bg-primary-soft" : "border-slate-200 bg-white hover:border-primary-line"
                  }`}
                  key={`${image.url}-${index}`}
                  data-testid={`hero-image-option-${index + 1}`}
                >
                  <span className="relative block aspect-video overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={image.url}
                      alt={image.alt || "본문 이미지"}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <input
                      name="heroImageChoice"
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedHeroImageUrl(image.url)}
                    />
                    {image.alt || `본문 이미지 ${index + 1}`}
                  </span>
                  <span className="muted line-clamp-1 font-mono text-xs">{image.url}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="font-bold">본문에 이미지를 삽입하면 대표이미지로 선택할 수 있습니다.</p>
            <p className="muted mt-1">아래 에디터의 이미지 업로드 또는 최근 이미지 버튼을 사용해 Markdown 이미지를 추가하세요.</p>
          </div>
        )}

        {selectedHeroImageMissing ? (
          <p className="rounded-2xl border border-primary-line bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-strong">
            저장된 대표이미지가 현재 본문에서 제거되어 저장 시 자동으로 해제됩니다.
          </p>
        ) : null}
      </section>

      <div className="flex rounded-lg border border-slate-200 bg-white p-1 xl:hidden">
        {(["write", "preview"] as const).map((panel) => (
          <button
            className={`h-9 flex-1 rounded-md text-sm font-bold transition ${
              activePanel === panel ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
            key={panel}
            type="button"
            onClick={() => setActivePanel(panel)}
          >
            {panel === "write" ? "작성" : "미리보기"}
          </button>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className={`card overflow-hidden ${activePanel === "write" ? "block" : "hidden xl:block"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <h2 className="font-black">마크다운 작성</h2>
            <span className="muted">{wordCount.toLocaleString()} words</span>
          </div>

          <div className="grid gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {toolbarActions.map((action) => (
                <button
                  aria-label={action.title}
                  className="button h-8 px-3 text-xs"
                  key={action.title}
                  title={action.title}
                  type="button"
                  onClick={() => {
                    if (action.kind === "raw") {
                      insertTextAtCursor(action.value);
                    } else {
                      insertSnippet(action);
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
              <label className="button h-8 px-3 text-xs">
                이미지 업로드
                <input
                  ref={uploadInputRef}
                  aria-label="본문 이미지 업로드"
                  className="sr-only"
                  type="file"
                  accept="image/gif,image/jpeg,image/png,image/webp"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void uploadInlineImage(file);
                  }}
                />
              </label>
            </div>

            {assets.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <span className="shrink-0 self-center text-xs font-bold text-slate-500">최근 이미지</span>
                {assets.map((asset) => (
                  <button
                    className="button h-8 shrink-0 px-3 text-xs"
                    key={asset.id}
                    type="button"
                    onClick={() => insertMarkdownImage(asset)}
                  >
                    {asset.originalName}
                  </button>
                ))}
              </div>
            ) : null}

            {uploadStatus ? <p className="text-xs font-semibold text-slate-500">{uploadStatus}</p> : null}
          </div>

          <textarea
            ref={textareaRef}
            className="min-h-[560px] w-full resize-y border-0 bg-white p-5 font-mono text-sm leading-7 outline-none"
            name="content"
            required
            defaultValue={content}
            onInput={(event) => setContent(event.currentTarget.value)}
          />
        </div>
        <div className={`card overflow-hidden ${activePanel === "preview" ? "block" : "hidden xl:block"}`}>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-black">미리보기</h2>
          </div>
          <article className="markdown-body min-h-[560px] p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, [rehypeSanitize, markdownSanitizeSchema]]}>
              {content || "# 미리보기"}
            </ReactMarkdown>
          </article>
        </div>
      </section>

      <section className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="muted">초안 저장과 발행을 같은 편집기에서 처리합니다.</p>
        <div className="flex flex-wrap gap-2">
          <button className="button" type="submit" name="status" value="DRAFT">
            임시저장
          </button>
          <button className="button button-primary" type="submit" name="status" value="PUBLISHED">
            발행하기
          </button>
        </div>
      </section>
    </form>
  );
}
