"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "jh_blog_theme";
type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const nextTheme = getPreferredTheme();
    applyTheme(nextTheme);
    const frame = window.requestAnimationFrame(() => setTheme(nextTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <ToggleButton
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2.4} />
      <ToggleLabel>{isDark ? "Light" : "Dark"}</ToggleLabel>
    </ToggleButton>
  );
}

const ToggleButton = styled(motion.button)`
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  padding: 0 0.75rem;
  color: var(--text-2);
  font-size: 0.8rem;
  font-weight: 800;

  &:hover {
    border-color: var(--primary-line);
    background: var(--primary-soft);
    color: var(--primary-strong);
  }
`;

const ToggleLabel = styled.span`
  display: none;

  @media (min-width: 640px) {
    display: inline;
  }
`;
