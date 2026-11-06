"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Smoothstep */
function s(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hash01(x: number, y: number) {
  let r = (Math.imul(x, 0x165667b1) + Math.imul(y, 0x27d4eb2f)) | 0;
  r = Math.imul(r ^ (r >>> 13), 0x4bf19f61);
  return ((r ^ (r >>> 16)) >>> 0) / 0x100000000;
}

/** Multi-octave value noise baked into a 256×256 buffer */
function bakeNoise(seed: number) {
  const out = new Float32Array(256 * 256);
  let amp = 1;
  let norm = 0;
  let freq = 4;
  for (let oct = 0; oct < 5; oct++) {
    const grid = new Float32Array(freq * freq);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = hash01(seed + 1, 131 * freq + 17 * oct + i);
    }
    for (let y = 0; y < 256; y++) {
      const gy = (y / 256) * freq;
      const y0 = gy | 0;
      const y1 = (y0 + 1) % freq;
      const fy = s(gy - y0);
      for (let x = 0; x < 256; x++) {
        const gx = (x / 256) * freq;
        const x0 = gx | 0;
        const x1 = (x0 + 1) % freq;
        const fx = s(gx - x0);
        const v = lerp(
          lerp(grid[y0 * freq + x0], grid[y0 * freq + x1], fx),
          lerp(grid[y1 * freq + x0], grid[y1 * freq + x1], fx),
          fy,
        );
        out[y * 256 + x] += v * amp;
      }
    }
    norm += amp;
    amp *= 0.55;
    freq *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

function sampleNoise(buf: Float32Array, u: number, v: number) {
  u = ((u % 256) + 256) % 256;
  v = ((v % 256) + 256) % 256;
  const x0 = u | 0;
  const y0 = v | 0;
  const x1 = (x0 + 1) & 255;
  const y1 = (y0 + 1) & 255;
  const fx = u - x0;
  const fy = v - y0;
  return lerp(
    lerp(buf[y0 * 256 + x0], buf[y0 * 256 + x1], fx),
    lerp(buf[y1 * 256 + x0], buf[y1 * 256 + x1], fx),
    fy,
  );
}

function packRGBA(r: number, g: number, b: number, a: number) {
  return (
    (r & 255) |
    ((g & 255) << 8) |
    ((b & 255) << 16) |
    ((a & 255) << 24)
  ) >>> 0;
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

/** Mono charcoal / cool-slate tint ladder with alpha (mikaelen-style) */
function buildPalette(tint: [number, number, number]): number[] {
  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];
  const stops: Array<[number, number, number, number]> = [
    [0, 0, 0, 0],
    [...mix(tint, black, 0.86), 40],
    [...mix(tint, black, 0.7), 70],
    [...mix(tint, black, 0.45), 110],
    [...tint, 150],
    [...mix(tint, white, 0.22), 190],
    [...mix(tint, white, 0.5), 230],
  ];
  return stops.map(([r, g, b, a]) => packRGBA(r, g, b, a));
}

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

type Props = {
  className?: string;
  /** Cloud density */
  intensity?: number;
  /** Animation seed */
  seed?: number;
  /** Tint RGB — default cool slate (mono wash) */
  tint?: [number, number, number];
  /** Fade direction like mikaelen cloud-down */
  direction?: "down" | "up" | "fill";
  playing?: boolean;
};

/**
 * Procedural pixel-cloud wash (same idea as mikaelen.site / contextual):
 * low-res noise → quantized palette → image-rendering: pixelated.
 */
export function PixelCloudBg({
  className,
  intensity = 1,
  seed = 0,
  tint = [72, 78, 92],
  direction = "down",
  playing = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const noiseA = bakeNoise(1 + seed);
    const noiseB = bakeNoise(2 + seed);
    const palette = buildPalette(tint);
    const maxIdx = palette.length - 1;

    const ox = 41.3 * seed;
    const oy = 67.9 * seed;
    let time = 3.7 * seed;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    let scale = 2;
    let w = 1;
    let h = 1;
    let image: ImageData | null = null;
    let pixels = new Uint32Array(1);
    let fieldW = 1;
    let fieldH = 1;
    let field = new Float32Array(1);
    let falloff = new Float32Array(1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      scale = Math.max(2, Math.ceil(rect.width / 760));
      w = Math.max(1, Math.ceil(rect.width / scale));
      h = Math.max(1, Math.ceil(rect.height / scale));
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
      pixels = new Uint32Array(image.data.buffer);
      fieldW = Math.floor(w / 4) + 2;
      fieldH = Math.floor(h / 4) + 2;
      field = new Float32Array(fieldW * fieldH);
      falloff = Float32Array.from({ length: h }, (_, row) => {
        const t = direction === "up" ? 1 - row / h : row / h;
        if (direction === "fill") return 0.62 + 0.25 * (1 - t);
        // Softer vertical fade so clouds billow lower (mikaelen-like)
        return 1.08 * Math.pow(1 - t, 1.05);
      });
    };

    const paint = () => {
      if (!image) return;
      const inv = 256 / (1.1 * w);

      for (let fy = 0; fy < fieldH; fy++) {
        const ny = 4 * fy * inv + oy;
        for (let fx = 0; fx < fieldW; fx++) {
          const nx = 4 * fx * inv + ox;
          const warp = sampleNoise(noiseB, 0.7 * nx + 1.1 * time, 0.7 * ny + 1.6 * time);
          const base = sampleNoise(
            noiseA,
            0.85 * nx + (warp - 0.5) * 95 + 0.7 * time,
            0.85 * ny + (warp - 0.5) * 95,
          );
          const detail = sampleNoise(
            noiseA,
            nx + (base - 0.5) * 80,
            ny + (base - 0.5) * 80 + 2.4 * time,
          );
          const ridge = 1 - Math.abs(2 * base - 1);
          const shaped = s(Math.min(1, Math.max(0, (detail - 0.2) / 0.5)));
          field[fy * fieldW + fx] =
            (0.3 + 0.85 * shaped) * (0.5 + 0.6 * (1 - ridge * ridge));
        }
      }

      const gain =
        intensity * (1 + 0.05 * Math.sin(0.6 * time)) * maxIdx;

      for (let y = 0; y < h; y++) {
        const y0 = (y >> 2) * fieldW;
        const y1 = y0 + fieldW;
        const fy = (y & 3) * 0.25;
        const rowGain = falloff[y] * gain;
        const row = y * w;
        for (let x = 0; x < w; x++) {
          const x0 = y0 + (x >> 2);
          const fx = (x & 3) * 0.25;
          const v0 = field[x0] + (field[x0 + 1] - field[x0]) * fx;
          const v1 =
            field[y1 + (x >> 2)] +
            (field[y1 + (x >> 2) + 1] - field[y1 + (x >> 2)]) * fx;
          const dither = (BAYER_4[y & 3][x & 3] / 16 - 0.5) * 0.9;
          let v = (v0 + (v1 - v0) * fy) * rowGain + dither;
          let idx = v | 0;
          if (idx > maxIdx) idx = maxIdx;
          if (idx < 0) idx = 0;
          pixels[row + x] = palette[idx];
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || !pageVisible || !playing || reduceMotion) {
        last = 0;
        return;
      }
      if (last && now - last < 1000 / 24) return;
      if (last) time += Math.min(0.1, (now - last) / 1000);
      last = now;
      paint();
    };

    const onVis = () => {
      pageVisible = !document.hidden;
    };

    resize();
    paint();
    if (playing && !reduceMotion) raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      resize();
      paint();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intensity, seed, tint, direction, playing]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none block h-full w-full cloud-pixel",
        direction === "down" && "cloud-mask-down",
        direction === "up" && "cloud-mask-up",
        className,
      )}
    />
  );
}
