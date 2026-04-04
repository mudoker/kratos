"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TextGenerate({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");

  return (
    <span className={cn("inline", className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.35 }}
          className="mr-[0.35em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
