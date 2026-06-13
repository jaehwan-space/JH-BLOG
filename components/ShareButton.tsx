"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const Icon = copied ? Check : Share2;

  return (
    <ShareControl type="button" aria-label={`${title} 링크 복사`} whileTap={{ scale: 0.95 }} onClick={copyUrl}>
      <Icon aria-hidden="true" size={17} strokeWidth={2.4} />
      {copied ? "복사 완료" : "링크 복사"}
    </ShareControl>
  );
}

const ShareControl = styled(motion.button)`
  display: inline-flex;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  padding: 0 1rem;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 800;

  &:hover {
    border-color: var(--line-strong);
    background: var(--surface-2);
  }
`;
