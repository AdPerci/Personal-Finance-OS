import type { Variants } from "framer-motion";

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: reducedMotion ? 0 : 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reducedMotion ? 0 : 0.15, ease: "easeOut" },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reducedMotion ? 0 : 0.05,
    },
  },
};
