'use client';

import React, { useMemo } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface SplitTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Tipe pemisahan teks: 'chars' (per karakter) atau 'words' (per kata)
   * Default: 'chars'
   */
  splitBy?: 'chars' | 'words';
  /** Delay awal sebelum animasi dimulai (detik) */
  delay?: number;
  /** Interval delay antar elemen (detik) */
  stagger?: number;
  /** Durasi animasi per elemen (detik) */
  duration?: number;
  /** Pergeseran vertikal awal (px atau %) */
  yOffset?: number | string;
  /** Efek blur saat masuk */
  filterBlur?: boolean;
  /** Animasikan saat elemen masuk viewport */
  inView?: boolean;
  /** Pengaturan viewport untuk scroll reveal */
  viewport?: { once?: boolean; margin?: string; amount?: number | 'some' | 'all' };
  /** Elemen HTML dasar */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** Kata atau teks yang diberi kelas aksen khusus */
  accentText?: string;
  accentClassName?: string;
  /** Callback saat animasi selesai */
  onAnimationComplete?: () => void;
}

export default function SplitText({
  text,
  className = '',
  style,
  splitBy = 'chars',
  delay = 0,
  stagger = 0.025,
  duration = 0.65,
  yOffset = '100%',
  filterBlur = true,
  inView = false,
  viewport = { once: true, amount: 0.2 },
  as = 'div',
  accentText,
  accentClassName = '',
  onAnimationComplete,
}: SplitTextProps) {
  // Parsing kata dan karakter
  const words = useMemo(() => {
    return text.split(' ').map((word) => {
      const isAccent =
        accentText &&
        (word === accentText ||
          word.includes(accentText) ||
          accentText.includes(word));
      return {
        word,
        isAccent: Boolean(isAccent),
        chars: Array.from(word),
      };
    });
  }, [text, accentText]);

  // Hitung total indeks karakter agar stagger berjalan berurutan di seluruh kalimat
  let charCounter = 0;

  const Tag = motion[as] as React.ComponentType<HTMLMotionProps<any>>;

  return (
    <Tag
      className={className}
      style={{
        ...style,
        display: 'inline-block',
      }}
      aria-label={text}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport }
        : { animate: 'visible' })}
      onAnimationComplete={onAnimationComplete}
    >
      {words.map((item, wordIdx) => {
        const isAccentWord = item.isAccent;
        const currentAccentClass = isAccentWord ? accentClassName : '';

        if (splitBy === 'words') {
          const wordDelay = delay + wordIdx * (stagger * 2.5);
          return (
            <span
              key={`word-${wordIdx}`}
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'top',
                marginRight: wordIdx < words.length - 1 ? '0.28em' : undefined,
              }}
              aria-hidden="true"
            >
              <motion.span
                style={{
                  display: 'inline-block',
                  willChange: 'transform, opacity, filter',
                }}
                className={currentAccentClass}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: yOffset,
                    filter: filterBlur ? 'blur(8px)' : 'none',
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: {
                      duration,
                      delay: wordDelay,
                      ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
                    },
                  },
                }}
              >
                {item.word}
              </motion.span>
            </span>
          );
        }

        // splitBy === 'chars'
        return (
          <span
            key={`word-${wordIdx}`}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              verticalAlign: 'top',
              marginRight: wordIdx < words.length - 1 ? '0.28em' : undefined,
            }}
            aria-hidden="true"
          >
            {item.chars.map((char, charIdx) => {
              const globalCharIdx = charCounter++;
              const charDelay = delay + globalCharIdx * stagger;

              return (
                <motion.span
                  key={`char-${wordIdx}-${charIdx}`}
                  style={{
                    display: 'inline-block',
                    willChange: 'transform, opacity, filter',
                  }}
                  className={currentAccentClass}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: yOffset,
                      scale: 0.95,
                      filter: filterBlur ? 'blur(6px)' : 'none',
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                      transition: {
                        duration,
                        delay: charDelay,
                        ease: [0.215, 0.61, 0.355, 1],
                      },
                    },
                  }}
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
