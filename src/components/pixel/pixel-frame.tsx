import { cn } from "@/lib/utils";

export function PixelFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative border-2 border-foreground bg-card shadow-pixel",
        className,
      )}
    >
      <span className="pointer-events-none absolute -left-[3px] -top-[3px] size-2 bg-foreground" />
      <span className="pointer-events-none absolute -right-[3px] -top-[3px] size-2 bg-foreground" />
      <span className="pointer-events-none absolute -bottom-[3px] -left-[3px] size-2 bg-foreground" />
      <span className="pointer-events-none absolute -bottom-[3px] -right-[3px] size-2 bg-foreground" />
      {children}
    </div>
  );
}

export function PixelBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-foreground bg-secondary px-2 py-0.5 font-pixel text-[9px] uppercase leading-none shadow-pixel",
        className,
      )}
    >
      {children}
    </span>
  );
}
