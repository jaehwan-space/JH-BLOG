"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "복사" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const Icon = copied ? Check : Copy;

  return (
    <CopyControl type="button" whileTap={{ scale: 0.95 }} onClick={copy}>
      <Icon aria-hidden="true" size={17} strokeWidth={2.4} />
      {copied ? "복사됨" : label}
    </CopyControl>
  );
}

const CopyControl = styled(motion.button)`
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
