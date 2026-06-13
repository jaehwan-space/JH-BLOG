"use client";

import styled from "@emotion/styled";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useEffect, useState } from "react";
import { IconCover } from "@/components/IconCover";

export type FeaturedHeroSlide = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  categoryName: string;
  dateLabel: string;
  readingMinutes: number;
  comments: number;
};

const AUTO_ADVANCE_MS = 5_000;

export function FeaturedHeroCarousel({ slides }: { slides: FeaturedHeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeSlide = slides[activeIndex] || slides[0];
  const canRotate = slides.length > 1;

  useEffect(() => {
    if (!canRotate || isPaused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [canRotate, isPaused, reduceMotion, slides.length]);

  if (!activeSlide) return null;

  function goToPrevious() {
    setDirection(-1);
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goToNext() {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false);
    }
  }

  const hasCover = activeSlide.cover !== "none";
  const slideMotion = {
    initial: (slideDirection: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: slideDirection > 0 ? 18 : -18 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 },
    exit: (slideDirection: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: slideDirection > 0 ? -18 : 18 }
  };

  return (
    <FeaturedSection
      aria-label="대표 글"
      aria-roledescription="carousel"
      data-active-index={activeIndex}
      data-testid="featured-carousel"
      onBlurCapture={handleBlur}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <ScreenReaderStatus aria-live="polite">
        대표 글 {activeIndex + 1} / {slides.length}
      </ScreenReaderStatus>
      <SlideViewport>
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <SlideLayout
            $hasCover={hasCover}
            animate="animate"
            custom={direction}
            exit="exit"
            initial="initial"
            key={activeSlide.id}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            variants={slideMotion}
          >
            <HeroText>
              <TextStack>
                <HeroTitle>
                  <TitleLink href={`/posts/${activeSlide.slug}`}>{activeSlide.title}</TitleLink>
                </HeroTitle>
                <HeroExcerpt>{activeSlide.excerpt}</HeroExcerpt>
              </TextStack>
            </HeroText>
            {hasCover ? (
              <MediaSlot>
                <HeroCoverLink aria-label={`${activeSlide.title} 썸네일`} href={`/posts/${activeSlide.slug}`}>
                  <IconCover cover={activeSlide.cover} label={activeSlide.categoryName} />
                </HeroCoverLink>
              </MediaSlot>
            ) : null}
          </SlideLayout>
        </AnimatePresence>
      </SlideViewport>
      {canRotate ? (
        <CarouselControls aria-label="대표 글 이동">
          <CarouselButton
            aria-label="이전 대표 글"
            data-testid="featured-prev"
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={goToPrevious}
          >
            <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.4} />
          </CarouselButton>
          <CarouselButton
            aria-label="다음 대표 글"
            data-testid="featured-next"
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={goToNext}
          >
            <ChevronRight aria-hidden="true" size={22} strokeWidth={2.4} />
          </CarouselButton>
        </CarouselControls>
      ) : null}
    </FeaturedSection>
  );
}

const FeaturedSection = styled.section`
  --hero-viewport-height: clamp(16.5rem, 25vw, 19rem);
  --hero-media-height: clamp(13.75rem, 22vw, 17.25rem);
  position: relative;
  display: grid;
  gap: 1.25rem;
  min-height: clamp(20rem, 32vw, 22rem);

  @media (max-width: 767px) {
    --hero-viewport-height: auto;
    --hero-media-height: clamp(12.5rem, 54vw, 15rem);
    min-height: auto;
  }
`;

const ScreenReaderStatus = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const SlideViewport = styled.div`
  position: relative;
  display: grid;
  min-height: var(--hero-viewport-height);
  overflow: hidden;
`;

const SlideLayout = styled(motion.article)<{ $hasCover: boolean }>`
  grid-area: 1 / 1;
  display: grid;
  min-height: var(--hero-viewport-height);
  align-items: center;
  gap: clamp(1.5rem, 5vw, 4rem);
  will-change: opacity, transform;

  @media (min-width: 1024px) {
    grid-template-columns: ${({ $hasCover }) =>
      $hasCover ? "minmax(0, 0.96fr) minmax(340px, 1.04fr)" : "minmax(0, 1fr)"};
  }

  @media (max-width: 767px) {
    min-height: auto;
  }
`;

const HeroText = styled.div`
  display: grid;
  gap: 1.75rem;
  align-content: center;

  @media (min-width: 768px) {
    padding-bottom: 4.2rem;
  }
`;

const TextStack = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const HeroTitle = styled.h1`
  max-width: 42rem;
  margin: 0;
  color: var(--text);
  font-size: clamp(2.25rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.12;
`;

const TitleLink = styled(Link)`
  transition: color 160ms ease;

  &:hover {
    color: var(--primary-strong);
  }
`;

const HeroExcerpt = styled.p`
  max-width: 42rem;
  margin: 0;
  color: var(--text-3);
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.85;
`;

const CarouselControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  width: max-content;
  z-index: 3;

  @media (min-width: 768px) {
    position: absolute;
    bottom: clamp(0.15rem, 1.5vw, 0.75rem);
    left: 0;
  }

  @media (max-width: 767px) {
    margin-top: 0.25rem;
  }
`;

const CarouselButton = styled(motion.button)`
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-2) 92%, #ffffff);
  color: var(--text-2);
  box-shadow:
    0 12px 26px -18px rgba(15, 23, 42, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    border-color: var(--primary-line);
    background: var(--primary-soft);
    color: var(--primary-strong);
    box-shadow:
      0 16px 32px -20px rgba(0, 102, 204, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  :root[data-theme="dark"] & {
    background: color-mix(in srgb, var(--surface-2) 88%, #ffffff 4%);
    box-shadow:
      0 14px 28px -22px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
`;

const MediaSlot = styled.div`
  display: flex;
  min-width: 0;
  height: var(--hero-media-height);
  align-items: center;
`;

const HeroCoverLink = styled(motion(Link))`
  display: block;
  width: 100%;
  height: var(--hero-media-height);
  overflow: hidden;
  border-radius: 24px;
  contain: layout paint;
  transform: translateZ(0);

  .icon-cover {
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    border-radius: inherit;
    box-shadow: var(--shadow-lift);
  }

  .sticker-frame {
    transform: translateZ(0);
  }
`;
