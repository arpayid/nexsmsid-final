import { type ReactNode } from "react";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "./utils";

export type FormModalProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  hideOverlay?: boolean;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
};

export function FormModal({ children, className, description, hideOverlay, onClose, open, title }: FormModalProps) {
  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-50 grid place-items-center p-4", !hideOverlay && "bg-foreground/40 backdrop-blur-sm")}>
      <div className="absolute inset-0" />
      <Card className={cn("relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border-primary/20 shadow-2xl", className)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
