"use client";

import { motion } from "motion/react";
import { ScanFace, Sparkles } from "lucide-react";

const faces = [
  { x: "13%", y: "18%", size: 86, delay: 0.2 },
  { x: "59%", y: "12%", size: 72, delay: 0.45 },
  { x: "38%", y: "57%", size: 92, delay: 0.7 },
];

export function FaceCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, rotate: 1.5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative min-h-[31rem] overflow-hidden rounded-[2.25rem] bg-[#071c15] shadow-[0_45px_100px_-45px_rgba(5,46,37,.75)]"
      aria-label="Animated multi-face detection preview"
    >
      <div className="mesh-grid absolute inset-0 opacity-70" />
      <div className="absolute -right-14 -top-16 size-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-10 left-2 size-72 rounded-full bg-emerald-900/80 blur-3xl" />

      {faces.map((face, index) => (
        <motion.div
          key={`${face.x}-${face.y}`}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: face.delay,
            type: "spring",
            stiffness: 180,
            damping: 18,
          }}
          className="absolute rounded-[2rem] border border-emerald-300/70 bg-emerald-300/8"
          style={{
            left: face.x,
            top: face.y,
            width: face.size,
            height: face.size * 1.18,
          }}
        >
          <span className="absolute -left-px -top-px size-3 border-l-2 border-t-2 border-emerald-300" />
          <span className="absolute -right-px -top-px size-3 border-r-2 border-t-2 border-emerald-300" />
          <span className="absolute -bottom-px -left-px size-3 border-b-2 border-l-2 border-emerald-300" />
          <span className="absolute -bottom-px -right-px size-3 border-b-2 border-r-2 border-emerald-300" />
          <div className="absolute inset-2 rounded-[1.4rem] bg-gradient-to-b from-emerald-100/20 to-emerald-900/30" />
          <span className="absolute -bottom-6 left-0 font-mono text-[9px] font-bold tracking-wider text-emerald-300">
            FACE_0{index + 1}
          </span>
        </motion.div>
      ))}

      <motion.div
        animate={{ y: [50, 375, 50] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_18px_2px_rgba(110,231,183,.65)]"
      />

      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4 text-white backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-emerald-950">
            <ScanFace className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold">3 faces indexed</p>
            <p className="text-[11px] text-white/50">
              512 dimensions · cosine ready
            </p>
          </div>
        </div>
        <Sparkles className="size-5 text-emerald-300" />
      </div>
    </motion.div>
  );
}
