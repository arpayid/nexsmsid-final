import Link from "next/link";
import { Button } from "@nexsmsid/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">NexAdmin</p>
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">Halaman tidak ditemukan.</p>
      <Button asChild>
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </main>
  );
}
