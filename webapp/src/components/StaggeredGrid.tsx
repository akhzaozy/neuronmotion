'use client';

import React, { useEffect, useRef } from 'react';
import styles from './StaggeredGrid.module.css';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
}

interface StaggeredGridProps {
  className?: string;
  gridSpacing?: number;
  dotSize?: number;
  interactionRadius?: number;
}

export default function StaggeredGrid({
  className = '',
  gridSpacing = 38,
  dotSize = 1.35,
  interactionRadius = 200,
}: StaggeredGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates (global viewport)
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      speed: 0,
      lastX: -1000,
      lastY: -1000,
      lastTime: performance.now(),
    };

    const ripples: Ripple[] = [];

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    };

    // Pointer move listener
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      const now = performance.now();
      const dt = Math.max(now - mouse.lastTime, 1);
      const dist = Math.hypot(e.clientX - mouse.lastX, e.clientY - mouse.lastY);
      mouse.speed = dist / dt;

      // Ripple halus saat pergerakan cepat
      if (mouse.speed > 3.0 && ripples.length < 4) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: 260,
          speed: 4.0,
          intensity: Math.min(mouse.speed * 0.15, 0.6),
        });
      }

      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.lastTime = now;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.65,
        speed: 5.5,
        intensity: 0.7,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    // Grid nodes
    interface GridNode {
      baseX: number;
      baseY: number;
      currentScale: number;
      currentAlpha: number;
      currentGlow: number;
    }

    let gridNodes: GridNode[] = [];

    const initNodes = () => {
      gridNodes = [];
      const cols = Math.ceil(width / gridSpacing) + 2;
      const rows = Math.ceil(height / gridSpacing) + 2;
      const offsetX = (width - (cols - 1) * gridSpacing) / 2;
      const offsetY = (height - (rows - 1) * gridSpacing) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          gridNodes.push({
            baseX: offsetX + c * gridSpacing,
            baseY: offsetY + r * gridSpacing,
            currentScale: 1,
            currentAlpha: 0.08,
            currentGlow: 0,
          });
        }
      }
    };

    handleResize();

    let lastTimestamp = performance.now();

    // Render loop
    const render = (now: number) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      // Mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.16;
        mouse.y += (mouse.targetY - mouse.y) * 0.16;
      } else {
        mouse.x += (-1000 - mouse.x) * 0.05;
        mouse.y += (-1000 - mouse.y) * 0.05;
      }

      // Detect theme
      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      ctx.clearRect(0, 0, width, height);

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += ripple.speed;
        ripple.intensity *= 0.982;
        if (ripple.radius >= ripple.maxRadius || ripple.intensity < 0.01) {
          ripples.splice(i, 1);
        }
      }

      const timeSec = now * 0.0012;

      // Subtle base colors (tidak silau / tidak terlalu terang)
      const baseAlpha = isDark ? 0.08 : 0.06;
      const baseR = isDark ? 148 : 100;
      const baseG = isDark ? 163 : 116;
      const baseB = isDark ? 184 : 139;

      // Subtle accent colors on hover
      const accentR = isDark ? 56 : 2;
      const accentG = isDark ? 189 : 132;
      const accentB = isDark ? 248 : 199;

      const nodeCount = gridNodes.length;
      for (let i = 0; i < nodeCount; i++) {
        const node = gridNodes[i];

        // 1. Physical distance to mouse cursor
        const dx = node.baseX - mouse.x;
        const dy = node.baseY - mouse.y;
        const dist = Math.hypot(dx, dy);

        let targetScale = 1;
        let targetAlpha = baseAlpha;
        let targetGlow = 0;
        let pushX = 0;
        let pushY = 0;

        // Proximity effect halus
        if (dist < interactionRadius) {
          const factor = Math.pow(1 - dist / interactionRadius, 1.8);
          // Scale naik lembut (maks ~1.65x)
          targetScale = 1 + factor * 0.65;
          // Alpha naik halus (maks ~0.38)
          targetAlpha = baseAlpha + factor * (isDark ? 0.32 : 0.26);
          targetGlow = factor;

          // Pergeseran magnetis mikro
          const pushStrength = factor * 3.5;
          const angle = Math.atan2(dy, dx);
          pushX = Math.cos(angle) * pushStrength;
          pushY = Math.sin(angle) * pushStrength;
        }

        // 2. Ripple wave influence
        for (let r = 0; r < ripples.length; r++) {
          const ripple = ripples[r];
          const rdx = node.baseX - ripple.x;
          const rdy = node.baseY - ripple.y;
          const rDist = Math.hypot(rdx, rdy);
          const distToWave = Math.abs(rDist - ripple.radius);

          const waveWidth = 50;
          if (distToWave < waveWidth) {
            const waveFactor =
              Math.cos((distToWave / waveWidth) * (Math.PI / 2)) *
              ripple.intensity;
            targetScale = Math.max(targetScale, 1 + waveFactor * 0.4);
            targetAlpha = Math.max(targetAlpha, baseAlpha + waveFactor * 0.2);
            targetGlow = Math.max(targetGlow, waveFactor * 0.35);
          }
        }

        // 3. Ambient sine wave halus
        const ambientFactor =
          Math.sin(node.baseX * 0.012 + node.baseY * 0.012 + timeSec) *
          Math.cos(node.baseX * 0.008 - node.baseY * 0.008 + timeSec * 0.7);
        const ambientScale = 1 + Math.max(0, ambientFactor) * 0.1;
        const ambientAlphaBoost = Math.max(0, ambientFactor) * 0.02;

        targetScale = Math.max(targetScale, ambientScale);
        targetAlpha += ambientAlphaBoost;

        // Smooth interpolation
        node.currentScale += (targetScale - node.currentScale) * (delta * 12);
        node.currentAlpha += (targetAlpha - node.currentAlpha) * (delta * 10);
        node.currentGlow += (targetGlow - node.currentGlow) * (delta * 12);

        const finalX = node.baseX + pushX;
        const finalY = node.baseY + pushY;
        const currentRadius = dotSize * node.currentScale;

        // Render dot
        ctx.beginPath();
        ctx.arc(finalX, finalY, currentRadius, 0, Math.PI * 2);

        const glow = node.currentGlow;
        const r = Math.round(baseR + (accentR - baseR) * glow);
        const g = Math.round(baseG + (accentG - baseG) * glow);
        const b = Math.round(baseB + (accentB - baseB) * glow);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(node.currentAlpha, 0.45)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [gridSpacing, dotSize, interactionRadius]);

  return (
    <div
      ref={containerRef}
      className={`${styles.gridWrapper} ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
