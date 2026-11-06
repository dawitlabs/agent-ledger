/**
 * Static pixelated mono gradient — SSR-safe, no hydration delay.
 * Upscales a tiny dithered PNG with image-rendering: pixelated.
 * Background only; does not affect fonts.
 */
export function PixelGradientBg({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/hero-pixel-gradient.png"
      alt=""
      aria-hidden
      draggable={false}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "40% 20%",
        imageRendering: "pixelated",
      }}
    />
  );
}
