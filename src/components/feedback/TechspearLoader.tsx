import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import logoIcon from '@/assets/techspear-logo-icon.png';

interface TechspearLoaderProps {
  /** Covers the whole viewport (route switches, auth checks). false = fills its parent
   * container instead, for a loading state scoped to one section of a page. */
  fullScreen?: boolean;
  /** Set to null to show just the mark with no caption. */
  label?: string | null;
  /** Icon width in px; height follows the image's own aspect ratio. */
  size?: number;
}

/**
 * The shared Techspear brand loader - the peacock mark's tail opens and closes on a curve
 * (same reveal as index.html's splash), looping for as long as the loader stays mounted.
 * Used for anything transient (route switches, auth checks, section-level fetches). When
 * `fullScreen`, fades in/out smoothly rather than popping - wrap its usage in an
 * <AnimatePresence> so the fade-out actually plays before it unmounts.
 */
export function TechspearLoader({ fullScreen = true, label = 'Loading', size = 72 }: TechspearLoaderProps) {
  const content = (
    <>
      <style>{`
        .techspear-loader-peacock {
          clip-path: circle(0% at 50% 100%);
          animation: techspear-loader-spread 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        /* Opens, holds briefly fully open, closes back down, repeats - the curve itself
           loops for as long as the loader is up, instead of opening once and idling. */
        @keyframes techspear-loader-spread {
          0% { clip-path: circle(0% at 50% 100%); filter: drop-shadow(0 8px 20px rgba(20, 184, 166, 0.2)); }
          45% { clip-path: circle(150% at 50% 100%); filter: drop-shadow(0 10px 26px rgba(20, 184, 166, 0.4)); }
          55% { clip-path: circle(150% at 50% 100%); filter: drop-shadow(0 10px 26px rgba(20, 184, 166, 0.4)); }
          100% { clip-path: circle(0% at 50% 100%); filter: drop-shadow(0 8px 20px rgba(20, 184, 166, 0.2)); }
        }
        .techspear-loader-label {
          animation: techspear-loader-label-pulse 2s ease-in-out infinite;
        }
        @keyframes techspear-loader-label-pulse {
          0%, 100% { opacity: 0.55; letter-spacing: 0.12em; }
          50% { opacity: 1; letter-spacing: 0.16em; }
        }
      `}</style>
      <img
        src={logoIcon}
        alt="Techspear"
        className="techspear-loader-peacock"
        style={{ width: size, height: 'auto' }}
      />
      {label !== null && (
        <span className="techspear-loader-label text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-600">
          {label}
        </span>
      )}
    </>
  );

  if (!fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center gap-[14px] py-10"
      >
        {content}
      </motion.div>
    );
  }

  // Portal straight to <body> - a parent with an active CSS transform (Framer Motion's page
  // transition, in this app) becomes the containing block for `position: fixed` descendants
  // per spec, which made this render pinned to the content area next to the sidebar instead
  // of the viewport, then "jump" to full-screen once the transition's transform cleared.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center justify-center"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 9999 }}
    >
      {/* Backdrop only - blur/transparency live here, never on the same layer as the logo,
          so the logo's own soft edges don't pick up the blur too. */}
      <div className="absolute inset-0 bg-slate-50/10 dark:bg-slate-900/10" />
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center gap-[14px]"
      >
        {content}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
