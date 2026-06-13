"use client";

import styled from "@emotion/styled";
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useState } from "react";

export function ReadingProgressBar() {
  const [percent, setPercent] = useState(0);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.35
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setPercent(Math.round(value * 100));
  });

  return (
    <ProgressTrack
      aria-label="읽기 진행률"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      role="progressbar"
    >
      <ProgressBar data-testid="reading-progress-bar" style={{ scaleX: smoothProgress }} />
    </ProgressTrack>
  );
}

const ProgressTrack = styled.div`
  pointer-events: none;
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 10000;
  height: 3px;
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  transform-origin: left;
  background: var(--primary);
  box-shadow: 0 0 10px rgba(0, 102, 204, 0.35);
`;
