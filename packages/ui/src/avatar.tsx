import { type HTMLAttributes } from "react";

import { cn } from "./utils";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  alt?: string;
  fallback: string;
  src?: string;
};

export function Avatar({ alt, className, fallback, src, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-card bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary shadow-sm ring-1 ring-primary/20",
        className,
      )}
      {...props}
    >
      {src ? (
        <img alt={alt ?? fallback} className="h-full w-full object-cover" src={src} />
      ) : (
        <span className="grid h-full w-full place-items-center">{fallback}</span>
      )}
    </div>
  );
}
