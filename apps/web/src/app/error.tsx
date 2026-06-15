"use client";

import { useEffect } from "react";
import { Button } from "@nexsmsid/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">NexAdmin</p>
      <h1 className="text-2xl font-semibold">Terjadi Kesalahan</h1>
      <p className="text-muted-foreground">Maaf, terjadi kesalahan yang tidak terduga.</p>
      <Button onClick={reset}>Coba Lagi</Button>
    </main>
  );
}
