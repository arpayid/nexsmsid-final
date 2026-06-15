import { type ReactNode } from "react";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title?: ReactNode;
};

export function ConfirmDialog({
  cancelLabel = "Batal",
  confirmLabel = "Ya, lanjutkan",
  description,
  onCancel,
  onConfirm,
  open,
  title = "Konfirmasi aksi",
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" />
      <Card className="relative w-full max-w-md border-primary/20 shadow-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={onCancel} type="button" variant="outline">
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} type="button">
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
