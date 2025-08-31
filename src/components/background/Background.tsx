// Fondo exportado multi-capa (canvas)
// No requiere librerías externas.
// Añade "use client" si usas Next.js (App Router).
// IMPORTANTE: El fondo tiene z-index: -9999 para estar siempre debajo del contenido
/* eslint-disable */

import React, { useEffect, useRef } from 'react';

interface LayerProps {
  color: string;
  speed: 'slow' | 'normal' | 'fast';
  intensity: number;
  theme?: 'light' | 'dark';
  particleCount?: number;
  speedMultiplier?: number;
}
function speedMul(s: 'slow' | 'normal' | 'fast') {
  if (s === 'slow') return 0.5;
  if (s === 'fast') return 2;
  return 1;
}
const StarsLayer: React.FC<LayerProps> = ({ color, speed, intensity }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      c.width = innerWidth;
      c.height = innerHeight;
    };
    resize();
    addEventListener('resize', resize);
    const mul = speedMul(speed);
    const count = Math.floor(200 * intensity);
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      size: Math.random() * 3 + 0.5,
      o: Math.random() * 0.8 + 0.2,
      phase: Math.random() * Math.PI * 2,
      tw: Math.random() * 0.05 + 0.02,
    }));
    let f: number;
    const loop = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const g = ctx.createRadialGradient(
        c.width / 2,
        c.height / 2,
        0,
        c.width / 2,
        c.height / 2,
        Math.max(c.width, c.height) / 2
      );
      g.addColorStop(0, color + '05');
      g.addColorStop(1, color + '02');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      stars.forEach((s) => {
        s.phase += s.tw * mul;
        const twinkle = (Math.sin(s.phase) + 1) * 0.5;
        const op = s.o * (0.3 + twinkle * 0.7);
        ctx.save();
        ctx.globalAlpha = op;
        ctx.translate(s.x, s.y);
        const rayCount = 4;
        const inner = s.size * 0.3;
        const outer = s.size * (1 + twinkle * 0.5);
        ctx.beginPath();
        for (let i = 0; i < rayCount * 2; i++) {
          const ang = (i * Math.PI) / rayCount;
          const r = i % 2 === 0 ? outer : inner;
          const x = Math.cos(ang) * r;
          const y = Math.sin(ang) * r;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        if (twinkle > 0.7) {
          const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, outer * 2);
          hg.addColorStop(0, color + '40');
          hg.addColorStop(1, color + '00');
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(0, 0, outer * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        s.x += Math.sin(s.phase * 0.1) * 0.2 * mul;
        s.y += Math.cos(s.phase * 0.1) * 0.2 * mul;
        if (s.x < -s.size) s.x = c.width + s.size;
        if (s.x > c.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = c.height + s.size;
        if (s.y > c.height + s.size) s.y = -s.size;
      });
      f = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      removeEventListener('resize', resize);
      cancelAnimationFrame(f);
    };
  }, [color, speed, intensity]);
  return (
    <canvas
      ref={ref}
      className="layer"
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'screen',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  );
};

const ConnectionsLayer: React.FC<LayerProps> = ({
  color,
  speed,
  intensity,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      c.width = innerWidth;
      c.height = innerHeight;
    };
    resize();
    addEventListener('resize', resize);
    const speedMultiplier = speedMul(speed);
    const nodes = Array.from({ length: Math.floor(15 * intensity) }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * speedMultiplier * 40,
      vy: (Math.random() - 0.5) * speedMultiplier * 40,
      r: Math.random() * 4 + 2,
    }));
    let f: number;
    const loop = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      nodes.forEach((n) => {
        n.x += n.vx * 0.016;
        n.y += n.vy * 0.016;
        if (n.x <= 0 || n.x >= c.width) n.vx *= -1;
        if (n.y <= 0 || n.y >= c.height) n.vy *= -1;
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3 * intensity;
      nodes.forEach((n1, i) => {
        nodes.slice(i + 1).forEach((n2) => {
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        });
      });
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6 * intensity;
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
      f = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      removeEventListener('resize', resize);
      cancelAnimationFrame(f);
    };
  }, [color, speed, intensity]);
  return (
    <canvas
      ref={ref}
      className="layer"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        pointerEvents: 'none',
      }}
    />
  );
};

interface NebulaParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  saturation: number;
  brightness: number;
  phase: number;
  energy: number;
  trail: { x: number; y: number; alpha: number }[];
}
interface NebulaCloud {
  x: number;
  y: number;
  size: number;
  density: number;
  rotation: number;
  rotationSpeed: number;
  hue: number;
  pulsPhase: number;
  layers: number;
}
const NebulaLayer: React.FC<LayerProps> = ({
  color,
  speed,
  intensity,
  theme,
  particleCount,
  speedMultiplier,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<NebulaParticle[]>([]);
  const cloudsRef = useRef<NebulaCloud[]>([]);
  const timeRef = useRef(0);
  const noiseFieldRef = useRef<number[][]>([]);
  function hexToHSL(hex: string) {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }
  const mainHSL = hexToHSL(color);
  const getSpeedValue = () => {
    if (typeof speed === 'number') return speed;
    if (speed === 'slow') return 0.2;
    if (speed === 'fast') return 1.5;
    return 0.6;
  };
  const noise = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  const generateNoiseField = (w: number, h: number, cell = 25) => {
    const f: number[][] = [];
    const scale = 0.008;
    for (let x = 0; x < Math.ceil(w / cell); x++) {
      f[x] = [];
      for (let y = 0; y < Math.ceil(h / cell); y++) {
        f[x][y] = noise(x * scale, y * scale) * Math.PI * 2;
      }
    }
    return f;
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const speedValue = getSpeedValue();
    const sMult = typeof speedMultiplier === 'number' ? speedMultiplier : 0.8;
    let zoomBase = 1,
      zoomPhase = 0;
    const lastFrame = { current: 0 as number };
    const uaMobile =
      /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );
    const coarse = (() => {
      try {
        return (
          window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        );
      } catch {
        return false;
      }
    })();
    const touch =
      (navigator as any).maxTouchPoints > 0 || 'ontouchstart' in window;
    const isMobile = uaMobile || coarse || touch || innerWidth <= 768;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const cores = (navigator as any).hardwareConcurrency || 4;
    const isLowEndMobile =
      isMobile && (deviceMemory <= 3 || cores <= 4 || innerWidth <= 480);
    const targetFPS = isLowEndMobile ? 40 : 60;
    const noiseCellRef = { current: isLowEndMobile ? 38 : 25 };
    const enableConnections = false;
    const mobileNoShadow = isMobile;
    const mobileSimple = isMobile;
    const effectiveTheme =
      theme === 'light' || theme === 'dark'
        ? theme
        : window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth || innerWidth;
      const h = parent.offsetHeight || innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1 : 1.5);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      (ctx as any).imageSmoothingEnabled = true;
      try {
        (ctx as any).imageSmoothingQuality = 'high';
      } catch {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        noiseFieldRef.current = generateNoiseField(w, h, noiseCellRef.current);
      }
    };
    const initParticles = () => {
      particlesRef.current = [];
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth || innerWidth;
      const h = parent.offsetHeight || innerHeight;
      const baseCount = typeof particleCount === 'number' ? particleCount : 180;
      const effCount = isLowEndMobile
        ? Math.max(70, Math.floor(baseCount * 0.5))
        : baseCount;
      for (let i = 0; i < effCount; i++) {
        const life = 200 + Math.random() * 400;
        const baseHue = mainHSL.h;
        const hue = baseHue - 30 + Math.random() * 60;
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 1500 + 500,
          vx: (Math.random() - 0.5) * speedValue * sMult * 0.2,
          vy: (Math.random() - 0.5) * speedValue * sMult * 0.2,
          vz: (Math.random() - 0.5) * speedValue * sMult * 0.4,
          size: isLowEndMobile
            ? Math.random() * 2.5 + 0.4
            : Math.random() * 3 + 0.5,
          life,
          maxLife: life,
          hue,
          saturation: 60 + Math.random() * 40,
          brightness: 50 + Math.random() * 50,
          phase: Math.random() * Math.PI * 2,
          energy: isLowEndMobile
            ? 0.4 + Math.random() * 1
            : 0.5 + Math.random() * 1.5,
          trail: [],
        });
      }
    };
    const initClouds = () => {
      cloudsRef.current = [];
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth || innerWidth;
      const h = parent.offsetHeight || innerHeight;
      const baseHue = mainHSL.h;
      const cfg = [
        {
          count: 2,
          size: [600, 1000],
          density: [0.3, 0.5],
          hue: [baseHue - 10, baseHue + 10],
        },
        {
          count: 3,
          size: [400, 700],
          density: [0.25, 0.4],
          hue: [baseHue + 10, baseHue + 30],
        },
        {
          count: 4,
          size: [200, 400],
          density: [0.2, 0.35],
          hue: [baseHue - 40, baseHue - 20],
        },
        {
          count: 5,
          size: [100, 250],
          density: [0.15, 0.3],
          hue: [baseHue + 30, baseHue + 60],
        },
      ];
      cfg.forEach((cg) => {
        const eff = isLowEndMobile
          ? Math.max(1, Math.ceil(cg.count * 0.6))
          : cg.count;
        for (let i = 0; i < cg.count; i++) {
          if (isLowEndMobile && i >= eff) break;
          cloudsRef.current.push({
            x: Math.random() * w * 1.2 - w * 0.1,
            y: Math.random() * h * 1.2 - h * 0.1,
            size:
              (isLowEndMobile ? cg.size[0] * 0.85 : cg.size[0]) +
              Math.random() *
                ((isLowEndMobile ? cg.size[1] * 0.85 : cg.size[1]) -
                  (isLowEndMobile ? cg.size[0] * 0.85 : cg.size[0])),
            density:
              cg.density[0] + Math.random() * (cg.density[1] - cg.density[0]),
            rotation: 0,
            rotationSpeed:
              (Math.random() - 0.5) * (isLowEndMobile ? 0.0007 : 0.001),
            hue: cg.hue[0] + Math.random() * (cg.hue[1] - cg.hue[0]),
            pulsPhase: Math.random() * Math.PI * 2,
            layers: isLowEndMobile
              ? 2 + Math.floor(Math.random() * 2)
              : 3 + Math.floor(Math.random() * 3),
          });
        }
      });
    };
    resize();
    initParticles();
    initClouds();
    const staticStars: {
      x: number;
      y: number;
      size: number;
      color: string;
      twinkle: number;
    }[] = [];
    const shootingStars: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      trail: { x: number; y: number }[];
    }[] = [];
    let starsInit = false;
    const initStars = (w: number, h: number) => {
      staticStars.length = 0;
      for (let i = 0; i < 80; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 1.5) * Math.max(w, h) * 0.55;
        const x = w / 2 + Math.cos(ang) * rad + (Math.random() - 0.5) * 40;
        const y = h / 2 + Math.sin(ang) * rad + (Math.random() - 0.5) * 40;
        const size = Math.random() * 1.2 + 0.3;
        const twinkle = Math.random() * 0.5 + 0.75;
        const color =
          Math.random() < 0.7
            ? 'rgba(255,255,255,' + (0.7 + Math.random() * 0.3) + ')'
            : Math.random() < 0.5
              ? 'rgba(' +
                (180 + Math.random() * 60) +
                ',' +
                (180 + Math.random() * 60) +
                ',255,' +
                (0.6 + Math.random() * 0.3) +
                ')'
              : 'rgba(255,' +
                (180 + Math.random() * 60) +
                ',' +
                (220 + Math.random() * 35) +
                ',' +
                (0.6 + Math.random() * 0.3) +
                ')';
        staticStars.push({ x, y, size, color, twinkle });
      }
      starsInit = true;
    };
    const maybeSpawnShootingStar = (w: number, h: number) => {
      if (isMobile) return;
      const prob = isLowEndMobile ? 0.006 : 0.012;
      if (Math.random() < prob) {
        const side = Math.random() < 0.5 ? 'left' : 'top';
        let x, y, vx, vy;
        if (side === 'left') {
          x = -40;
          y = Math.random() * h * 0.7 + h * 0.15;
          vx = 4 + Math.random() * 2;
          vy = (Math.random() - 0.5) * 1.2;
        } else {
          x = Math.random() * w * 0.7 + w * 0.15;
          y = -40;
          vx = (Math.random() - 0.5) * 1.2;
          vy = 4 + Math.random() * 2;
        }
        shootingStars.push({
          x,
          y,
          vx,
          vy,
          life: 0,
          maxLife: 110 + Math.random() * 40,
          trail: [],
        });
      }
    };
    const animate = () => {
      const now = performance.now();
      if (now - lastFrame.current < 1000 / targetFPS) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame.current = now;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth || innerWidth;
      const h = parent.offsetHeight || innerHeight;
      if (!isMobile) {
        zoomPhase += 0.008 * speedValue * sMult;
        zoomBase = 1 + zoomPhase * 0.07;
        if (zoomBase > 2.5) {
          zoomPhase = 0;
          zoomBase = 1;
          cloudsRef.current.forEach((cl) => {
            cl.x = Math.random() * w * 1.2 - w * 0.1;
            cl.y = Math.random() * h * 1.2 - h * 0.1;
          });
          particlesRef.current.forEach((p) => {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
            p.z = Math.random() * 1500 + 500;
          });
        }
      } else zoomBase = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoomBase, zoomBase);
      ctx.translate(-w / 2, -h / 2);
      timeRef.current += 0.006 * speedValue * sMult;
      const baseOpacity = effectiveTheme === 'light' ? 0.15 : intensity * 0.8;
      ctx.globalCompositeOperation = 'source-over';
      const grad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      if (effectiveTheme === 'light') {
        grad.addColorStop(0, 'hsla(' + mainHSL.h + ',80%,95%,0.55)');
        grad.addColorStop(0.3, 'hsla(' + mainHSL.h + ',90%,85%,0.22)');
        grad.addColorStop(0.7, 'hsla(' + mainHSL.h + ',80%,80%,0.10)');
        grad.addColorStop(1, 'rgba(255,255,255,0.01)');
      } else {
        grad.addColorStop(0, 'hsla(' + mainHSL.h + ',80%,38%,0.38)');
        grad.addColorStop(0.3, 'hsla(' + mainHSL.h + ',90%,22%,0.18)');
        grad.addColorStop(0.7, 'hsla(' + mainHSL.h + ',80%,12%,0.08)');
        grad.addColorStop(1, 'rgba(8,10,25,0.01)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      if (!starsInit || staticStars.length === 0) initStars(w, h);
      ctx.save();
      ctx.globalCompositeOperation =
        effectiveTheme === 'light' ? 'multiply' : 'screen';
      for (let i = 0; i < staticStars.length; i++) {
        const s = staticStars[i];
        const tw =
          0.6 + Math.sin(timeRef.current * (0.8 + s.twinkle) + i * 0.35) * 0.4;
        ctx.globalAlpha = tw;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      }
      ctx.restore();
      if (!isMobile) {
        maybeSpawnShootingStar(w, h);
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i];
          s.x += s.vx;
          s.y += s.vy;
          s.life++;
          s.trail.unshift({ x: s.x, y: s.y });
          const maxTrail = isLowEndMobile ? 10 : 16;
          if (s.trail.length > maxTrail) s.trail.pop();
          ctx.save();
          const fade =
            s.life > s.maxLife - 30 ? 1 - (s.life - (s.maxLife - 30)) / 30 : 1;
          for (let t = 1; t < s.trail.length; t++) {
            const p1 = s.trail[t - 1];
            const p2 = s.trail[t];
            const alpha = 0.22 * (1 - t / s.trail.length) * fade;
            ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.lineWidth = 2.2 * (1 - t / s.trail.length) + 0.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
          if (s.life > s.maxLife || s.x > w + 60 || s.y > h + 60)
            shootingStars.splice(i, 1);
        }
      }
      ctx.globalCompositeOperation =
        effectiveTheme === 'light' ? 'multiply' : 'screen';
      cloudsRef.current.forEach((cloud, idx) => {
        if (!mobileSimple) {
          cloud.rotation += cloud.rotationSpeed;
          cloud.pulsPhase += 0.008 * sMult;
        }
        const pulseFactor = mobileSimple
          ? 1
          : 1 + Math.sin(cloud.pulsPhase) * 0.2;
        const cloudSize = cloud.size * pulseFactor;
        const driftX =
          Math.sin(timeRef.current * 0.02 + idx * 0.3) *
          (mobileSimple ? 8 : 20);
        const driftY =
          Math.cos(timeRef.current * 0.015 + idx * 0.5) *
          (mobileSimple ? 6 : 15);
        const finalX = cloud.x + driftX;
        const finalY = cloud.y + driftY;
        const layersToDraw = mobileSimple ? 1 : cloud.layers;
        for (let L = 0; L < layersToDraw; L++) {
          const layerSize = cloudSize * (mobileSimple ? 1 : 0.6 + L * 0.2);
          const layerOpacity =
            baseOpacity *
            cloud.density *
            (mobileSimple ? 0.12 : (1 - L * 0.2) * 0.18);
          const layerOffset = mobileSimple ? 0 : L * 8;
          const rotX =
            finalX + Math.cos(cloud.rotation + L * 0.2) * layerOffset;
          const rotY =
            finalY + Math.sin(cloud.rotation + L * 0.2) * layerOffset;
          const g2 = ctx.createRadialGradient(
            rotX,
            rotY,
            0,
            rotX,
            rotY,
            layerSize
          );
          if (effectiveTheme === 'light') {
            g2.addColorStop(
              0,
              'hsla(' + cloud.hue + ',55%,26%,' + layerOpacity + ')'
            );
            g2.addColorStop(
              0.6,
              'hsla(' +
                (cloud.hue - 5) +
                ',40%,38%,' +
                layerOpacity * 0.12 +
                ')'
            );
            g2.addColorStop(1, 'hsla(' + cloud.hue + ',38%,50%,0)');
          } else {
            g2.addColorStop(
              0,
              'hsla(' + cloud.hue + ',60%,44%,' + layerOpacity + ')'
            );
            g2.addColorStop(
              0.5,
              'hsla(' +
                (cloud.hue - 10) +
                ',38%,32%,' +
                layerOpacity * 0.11 +
                ')'
            );
            g2.addColorStop(1, 'hsla(' + cloud.hue + ',28%,24%,0)');
          }
          ctx.fillStyle = g2;
          if (mobileSimple) {
            ctx.beginPath();
            ctx.arc(rotX, rotY, layerSize, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.save();
            ctx.translate(rotX, rotY);
            ctx.scale(
              1 + Math.sin(timeRef.current * 0.5 + L) * 0.02,
              1 + Math.cos(timeRef.current * 0.5 + L) * 0.02
            );
            ctx.beginPath();
            ctx.arc(0, 0, layerSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      });
      ctx.globalCompositeOperation =
        effectiveTheme === 'light' ? 'multiply' : 'screen';
      particlesRef.current.forEach((p, idx) => {
        const noiseX = Math.floor(p.x / noiseCellRef.current);
        const noiseY = Math.floor(p.y / noiseCellRef.current);
        if (noiseFieldRef.current[noiseX]?.[noiseY] !== undefined) {
          const ang =
            noiseFieldRef.current[noiseX][noiseY] + timeRef.current * 0.5;
          p.vx += Math.cos(ang) * 0.005;
          p.vy += Math.sin(ang) * 0.005;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.phase += 0.03;
        p.life--;
        const scale = Math.max(0.1, 800 / (800 + p.z));
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        if (p.y < -30) p.y = h + 30;
        if (p.y > h + 30) p.y = -30;
        if (p.life <= 0) {
          p.life = p.maxLife;
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.z = Math.random() * 1500 + 500;
        }
        if (!mobileSimple) {
          p.trail.push({ x: p.x, y: p.y, alpha: 1 });
          const maxTrail = isLowEndMobile ? 3 : 5;
          if (p.trail.length > maxTrail) p.trail.shift();
        }
        p.trail.forEach((pt, i) => {
          const trailAlpha = pt.alpha * (i / p.trail.length) * 0.3;
          const trailSize = p.size * scale * (i / p.trail.length) * 0.4;
          if (!mobileSimple && trailAlpha > 0.01) {
            ctx.fillStyle =
              effectiveTheme === 'light'
                ? 'hsla(' +
                  p.hue +
                  ',' +
                  p.saturation * 0.7 +
                  '%,40%,' +
                  trailAlpha * baseOpacity +
                  ')'
                : 'hsla(' +
                  p.hue +
                  ',' +
                  p.saturation +
                  '%,' +
                  p.brightness +
                  '%,' +
                  trailAlpha * baseOpacity +
                  ')';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
          if (!mobileSimple) pt.alpha *= 0.92;
        });
        const lifeFactor = p.life / p.maxLife;
        const energyPulse = mobileSimple
          ? 1
          : 1 + Math.sin(p.phase * p.energy) * 0.3;
        const finalSize = p.size * scale * energyPulse * lifeFactor;
        const finalAlpha = lifeFactor * baseOpacity * 0.8;
        const drawStar = (
          cx: number,
          cy: number,
          spikes: number,
          outer: number,
          inner: number,
          col: string,
          a: number
        ) => {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy - outer);
          for (let i = 0; i < spikes * 2; i++) {
            const ang = (Math.PI / spikes) * i;
            const rad = i % 2 === 0 ? outer : inner;
            ctx.lineTo(cx + Math.sin(ang) * rad, cy - Math.cos(ang) * rad);
          }
          ctx.closePath();
          ctx.globalAlpha = a;
          ctx.fillStyle = col;
          if (!mobileNoShadow) {
            ctx.shadowColor = col;
            ctx.shadowBlur = outer * 1.2;
          }
          ctx.fill();
          if (!mobileNoShadow) ctx.shadowBlur = 0;
          ctx.restore();
        };
        if (mobileSimple) {
          ctx.save();
          ctx.globalAlpha =
            finalAlpha * (effectiveTheme === 'light' ? 0.2 : 0.25);
          ctx.fillStyle =
            effectiveTheme === 'light'
              ? 'hsla(' + p.hue + ',' + p.saturation * 0.32 + '%,54%,1)'
              : 'hsla(' +
                p.hue +
                ',' +
                p.saturation * 0.7 +
                '%,' +
                (p.brightness + 10) +
                '%,1)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, finalSize * 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          drawStar(
            p.x,
            p.y,
            5,
            finalSize * 2.1,
            finalSize * 1.1,
            effectiveTheme === 'light'
              ? 'hsla(' +
                  p.hue +
                  ',' +
                  p.saturation * 0.32 +
                  '%,54%,' +
                  finalAlpha * 0.018 +
                  ')'
              : 'hsla(' +
                  p.hue +
                  ',' +
                  p.saturation * 0.7 +
                  '%,' +
                  (p.brightness + 10) +
                  '%,' +
                  finalAlpha * 0.025 +
                  ')',
            1
          );
        }
        if (mobileSimple) {
          ctx.save();
          ctx.globalAlpha = finalAlpha * 0.9;
          ctx.fillStyle =
            effectiveTheme === 'light'
              ? 'hsla(' +
                p.hue +
                ',' +
                p.saturation * 0.7 +
                '%,32%,' +
                finalAlpha * 0.85 +
                ')'
              : 'hsla(' +
                p.hue +
                ',' +
                p.saturation * 0.85 +
                '%,' +
                p.brightness * 0.92 +
                '%,' +
                finalAlpha * 0.85 +
                ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, finalSize * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          drawStar(
            p.x,
            p.y,
            5,
            finalSize,
            finalSize * 0.45,
            'hsla(' +
              p.hue +
              ',' +
              p.saturation * 0.85 +
              '%,' +
              p.brightness * 0.92 +
              '%,' +
              finalAlpha * 0.85 +
              ')',
            1
          );
        }
        if (enableConnections && Math.random() > 0.95) {
          for (
            let j = idx + 1;
            j < Math.min(idx + 5, particlesRef.current.length);
            j++
          ) {
            const o = particlesRef.current[j];
            const dx = p.x - o.x;
            const dy = p.y - o.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              const a = (1 - dist / 80) * finalAlpha * 0.2;
              ctx.strokeStyle =
                'hsla(' + (p.hue + o.hue) / 2 + ',70%,65%,' + a + ')';
              ctx.lineWidth = 0.3;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(o.x, o.y);
              ctx.stroke();
            }
          }
        }
      });
      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };
    const onResize = () => {
      resize();
      initParticles();
      initClouds();
    };
    window.addEventListener('resize', onResize);
    animate();
    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, speed, intensity]);
  return (
    <canvas
      ref={canvasRef}
      className="layer"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
};
interface BackgroundExportProps {
  animationColor?: string;
  intensity?: number;
  speed?: 'slow' | 'normal' | 'fast';
  theme?: 'light' | 'dark';
  particleCount?: number;
  speedMultiplier?: number;
}
export default function BackgroundExport(props: BackgroundExportProps) {
  const {
    animationColor,
    intensity,
    speed,
    theme,
    particleCount,
    speedMultiplier,
  } = props || {};
  // Valor base exportado (capturado al momento de exportar): 55
  const rawIntensity = typeof intensity === 'number' ? intensity : 55;
  const intensityNorm =
    rawIntensity > 1
      ? Math.min(Math.max(rawIntensity, 0), 100) / 100
      : Math.max(rawIntensity, 0);
  const color = animationColor || '#00e1ff';
  const speedSafe: 'slow' | 'normal' | 'fast' =
    speed === 'slow' || speed === 'fast' || speed === 'normal' ? speed : 'slow';
  const themeSafe: 'light' | 'dark' =
    theme === 'light' || theme === 'dark'
      ? theme
      : window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
  const particleCountSafe =
    typeof particleCount === 'number' ? particleCount : 180;
  const speedMultiplierSafe =
    typeof speedMultiplier === 'number' ? speedMultiplier : 0.8;
  return (
    <div
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: -9999 }}
      className="export-background-root"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at top left, #00e1ff20, transparent 60%), radial-gradient(ellipse at bottom right, #00e1ff15, transparent 60%), linear-gradient(135deg,#0F0F23 0%,#1a1a2e 50%,#16213e 100%)',
        }}
      />
      <StarsLayer
        color={color}
        speed={speedSafe}
        intensity={intensityNorm}
        theme={themeSafe}
        particleCount={particleCountSafe}
        speedMultiplier={speedMultiplierSafe}
      />
      <ConnectionsLayer
        color={color}
        speed={speedSafe}
        intensity={intensityNorm}
        theme={themeSafe}
        particleCount={particleCountSafe}
        speedMultiplier={speedMultiplierSafe}
      />
      <NebulaLayer
        color={color}
        speed={speedSafe}
        intensity={intensityNorm}
        theme={themeSafe}
        particleCount={particleCountSafe}
        speedMultiplier={speedMultiplierSafe}
      />
    </div>
  );
}
