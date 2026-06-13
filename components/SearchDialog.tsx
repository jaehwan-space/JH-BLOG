"use client";

import styled from "@emotion/styled";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SearchFilterOption = {
  name: string;
  slug: string;
  count: number;
};

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  category: {
    name: string;
    slug: string;
  };
  tags: Array<{
    name: string;
    slug: string;
  }>;
  readingMinutes: number;
  views: number;
  comments: number;
};

type SearchResponse = {
  query: string;
  category: string | null;
  tag: string | null;
  results: SearchResult[];
};

export function SearchDialog({
  categories,
  tags
}: {
  categories: SearchFilterOption[];
  tags: SearchFilterOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const params = new URLSearchParams();
        const trimmedQuery = query.trim();
        if (trimmedQuery) params.set("q", trimmedQuery);
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedTag) params.set("tag", selectedTag);

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = (await response.json()) as SearchResponse;
        setResults(data.results);
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, query.trim() ? 160 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, query, selectedCategory, selectedTag]);

  function closeDialog() {
    setIsOpen(false);
  }

  function resetFilters() {
    setQuery("");
    setSelectedCategory("");
    setSelectedTag("");
  }

  const trimmedQuery = query.trim();
  const hasActiveFilter = Boolean(trimmedQuery || selectedCategory || selectedTag);
  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };

  const dialog = (
    <AnimatePresence>
      {isOpen ? (
        <Overlay
          {...motionProps}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <DialogPanel
            aria-labelledby="search-dialog-title"
            aria-modal="true"
            role="dialog"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <DialogHeader>
              <div>
                <Eyebrow>Search</Eyebrow>
                <DialogTitle id="search-dialog-title">글 검색</DialogTitle>
              </div>
              <IconButton aria-label="닫기" type="button" whileTap={{ scale: 0.95 }} onClick={closeDialog}>
                <X aria-hidden="true" size={18} strokeWidth={2.4} />
                <span>닫기</span>
              </IconButton>
            </DialogHeader>

            <SearchControls>
              <SearchLabel>
                <span>검색어</span>
                <SearchInputWrap>
                  <SearchIconSlot>
                    <Search aria-hidden="true" size={18} strokeWidth={2.4} />
                  </SearchIconSlot>
                  <SearchInput
                    ref={inputRef}
                    aria-label="검색어"
                    autoComplete="off"
                    placeholder="제목, 태그, 본문 검색"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </SearchInputWrap>
              </SearchLabel>

              <FilterGroup
                label="카테고리"
                options={categories}
                selectedSlug={selectedCategory}
                testPrefix="search-category"
                onSelect={setSelectedCategory}
              />
              <FilterGroup
                label="태그"
                options={tags}
                selectedSlug={selectedTag}
                testPrefix="search-tag"
                onSelect={setSelectedTag}
              />
            </SearchControls>

            <ResultsArea>
              <ResultsMeta>
                <ResultsTitle>{hasActiveFilter ? "검색 결과" : "최근 글"}</ResultsTitle>
                <MetaActions>
                  {hasActiveFilter ? (
                    <ResetButton type="button" onClick={resetFilters}>
                      초기화
                    </ResetButton>
                  ) : null}
                  <MutedText aria-live="polite">{isLoading ? "검색 중" : `${results.length}개`}</MutedText>
                </MetaActions>
              </ResultsMeta>

              {hasError ? <Notice>검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</Notice> : null}

              {!hasError && !isLoading && !results.length ? <Notice>검색 결과가 없습니다.</Notice> : null}

              <ResultList>
                <AnimatePresence initial={false}>
                  {results.map((post) => (
                    <ResultLink
                      href={`/posts/${post.slug}`}
                      key={post.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: reduceMotion ? 0 : 0.16 }}
                      onClick={closeDialog}
                    >
                      <PillRow>
                        <Pill $active>{post.category.name}</Pill>
                        {post.tags.slice(0, 2).map((tag) => (
                          <Pill key={tag.slug}>#{tag.name}</Pill>
                        ))}
                      </PillRow>
                      <ResultHeading>{post.title}</ResultHeading>
                      <ResultExcerpt>{post.excerpt}</ResultExcerpt>
                      <MutedText>
                        {post.readingMinutes}분 읽기 · 조회 {post.views.toLocaleString()} · 댓글 {post.comments}
                      </MutedText>
                    </ResultLink>
                  ))}
                </AnimatePresence>
              </ResultList>
            </ResultsArea>
          </DialogPanel>
        </Overlay>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <OpenButton aria-label="검색 열기" type="button" whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(true)}>
        <Search aria-hidden="true" size={18} strokeWidth={2.4} />
        <OpenButtonLabel>검색</OpenButtonLabel>
      </OpenButton>
      {typeof document !== "undefined" ? createPortal(dialog, document.body) : null}
    </>
  );
}

function FilterGroup({
  label,
  options,
  selectedSlug,
  testPrefix,
  onSelect
}: {
  label: string;
  options: SearchFilterOption[];
  selectedSlug: string;
  testPrefix: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <FilterWrap>
      <FilterHeader>
        <FilterLabel>{label}</FilterLabel>
        {selectedSlug ? (
          <ResetButton type="button" onClick={() => onSelect("")}>
            선택 해제
          </ResetButton>
        ) : null}
      </FilterHeader>
      <ChipScroller>
        <PillButton
          $active={!selectedSlug}
          aria-pressed={!selectedSlug}
          className={!selectedSlug ? "pill-active" : undefined}
          data-testid={`${testPrefix}-all`}
          type="button"
          onClick={() => onSelect("")}
        >
          전체
        </PillButton>
        {options.map((option) => (
          <PillButton
            $active={selectedSlug === option.slug}
            aria-pressed={selectedSlug === option.slug}
            className={selectedSlug === option.slug ? "pill-active" : undefined}
            data-testid={`${testPrefix}-${option.slug}`}
            key={option.slug}
            type="button"
            onClick={() => onSelect(option.slug)}
          >
            {label === "태그" ? "#" : ""}
            {option.name} {option.count}
          </PillButton>
        ))}
      </ChipScroller>
    </FilterWrap>
  );
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(12px);

  @media (min-width: 640px) {
    padding-block: 2.5rem;
  }
`;

const DialogPanel = styled(motion.section)`
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: 100%;
  max-width: 48rem;
  max-height: calc(100vh - 2rem);
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: var(--shadow-lift);

  @media (min-width: 640px) {
    max-height: calc(100vh - 5rem);
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
  padding: 0.85rem 1rem;

  @media (min-width: 640px) {
    padding-inline: 1.25rem;
  }
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--primary-strong);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const DialogTitle = styled.h2`
  margin: 0.15rem 0 0;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 700;
`;

const IconButton = styled(motion.button)`
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  padding: 0 0.75rem;
  color: var(--text-2);
  font-size: 0.875rem;
  font-weight: 800;

  &:hover {
    background: var(--surface-2);
  }
`;

const SearchControls = styled.div`
  display: grid;
  gap: 1rem;
  border-bottom: 1px solid var(--line);
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 1.25rem;
  }
`;

const SearchLabel = styled.label`
  display: grid;
  gap: 0.5rem;
`;

const SearchInputWrap = styled.span`
  position: relative;
  display: block;
`;

const SearchIconSlot = styled.span`
  pointer-events: none;
  position: absolute;
  left: 1rem;
  top: 50%;
  color: var(--text-3);
  transform: translateY(-50%);
`;

const SearchInput = styled.input`
  width: 100%;
  height: 3rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface);
  padding: 0 1rem 0 2.75rem;
  color: var(--text);
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px var(--primary-soft);
  }
`;

const ResultsArea = styled.div`
  overflow-y: auto;
  padding: 0.75rem;

  @media (min-width: 640px) {
    padding: 1rem;
  }
`;

const ResultsMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-inline: 0.25rem;
`;

const ResultsTitle = styled.p`
  margin: 0;
  color: var(--text-2);
  font-size: 0.875rem;
  font-weight: 800;
`;

const MetaActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const ResetButton = styled.button`
  border: 0;
  background: transparent;
  color: var(--text-3);
  font-size: 0.75rem;
  font-weight: 800;

  &:hover {
    color: var(--primary-strong);
  }
`;

const MutedText = styled.p`
  margin: 0;
  color: var(--text-3);
  font-size: 0.875rem;
`;

const Notice = styled.div`
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface-2);
  padding: 1.25rem;
  color: var(--text-3);
  font-size: 0.875rem;
`;

const ResultList = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const ResultLink = styled(motion(Link))`
  display: block;
  border: 1px solid transparent;
  border-radius: 1rem;
  padding: 1rem;

  &:hover {
    border-color: var(--primary-line);
    background: var(--primary-soft);
  }
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Pill = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ $active }) => ($active ? "var(--primary-line)" : "var(--line)")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "var(--primary-soft)" : "var(--surface)")};
  padding: 0.25rem 0.75rem;
  color: ${({ $active }) => ($active ? "var(--primary-strong)" : "var(--text-2)")};
  font-size: 0.75rem;
  font-weight: 800;
`;

const ResultHeading = styled.h3`
  margin: 0;
  color: var(--text);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
`;

const ResultExcerpt = styled.p`
  display: -webkit-box;
  margin: 0.25rem 0 0.5rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--text-3);
  font-size: 0.875rem;
  line-height: 1.6;
`;

const OpenButton = styled(motion.button)`
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.875rem;
  font-weight: 800;

  &:hover {
    background: var(--surface-2);
  }

  @media (min-width: 640px) {
    width: auto;
    padding-inline: 0.75rem;
  }
`;

const OpenButtonLabel = styled.span`
  display: none;

  @media (min-width: 640px) {
    display: inline;
  }
`;

const FilterWrap = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const FilterLabel = styled.p`
  margin: 0;
  color: var(--text-2);
  font-size: 0.75rem;
  font-weight: 900;
`;

const ChipScroller = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
`;

const PillButton = styled.button<{ $active?: boolean }>`
  flex-shrink: 0;
  border: 1px solid ${({ $active }) => ($active ? "var(--primary-line)" : "var(--line)")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "var(--primary-soft)" : "var(--surface)")};
  padding: 0.25rem 0.75rem;
  color: ${({ $active }) => ($active ? "var(--primary-strong)" : "var(--text-2)")};
  font-size: 0.75rem;
  font-weight: 800;
`;
