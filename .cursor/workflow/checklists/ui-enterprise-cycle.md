# Checklist — UI Enterprise Sprint (A→P→E→V→PR→M)

Copy checklist ini per sprint. Centang sebelum lanjut ke langkah berikutnya.

**Sprint ID:** `UI-S__` · **Judul:** ******\_\_\_****** · **Tanggal:** ******\_\_\_******

---

## A — Audit

- [ ] Baca `STATUS.md` + sprint aktif di `UI-PLAN.md`
- [ ] Bandingkan dengan pola UI Enterprise di `packages/ui` / shell admin (jika relevan)
- [ ] Inventaris file/komponen terdampak
- [ ] Catat gap vs target Enterprise 2026 (visual, UX, konsistensi)
- [ ] Tentukan **out of scope** sprint ini

**Output:** catatan audit (update section sprint di `UI-PLAN.md` atau `ROADMAP.md`)

---

## P — Plan

- [ ] Acceptance criteria (3–7 bullet, measurable)
- [ ] Daftar file yang akan diubah/dibuat
- [ ] Tier verify: Web only / Full
- [ ] Risiko (RBAC, breaking layout, perf chart)
- [ ] Sprint besar (>8 file): konfirmasi user

**Output:** plan singkat di PR description nanti

---

## E — Eksekusi

- [ ] Branch: `feat/ui-s__-short-name`
- [ ] Minimal diff — tidak campur sprint lain
- [ ] Reuse `@nexsmsid/ui` — hindari duplikasi style
- [ ] Bahasa UI: Indonesia konsisten (admin)
- [ ] Responsive: cek mobile untuk area yang disentuh

---

## V — Validasi

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

- [ ] Format ✅
- [ ] Lint ✅
- [ ] Typecheck ✅
- [ ] Build ✅
- [ ] Smoke manual (login, halaman sprint, mobile lebar sempit)
- [ ] Screenshot mental note / deskripsi untuk PR test plan

---

## PR

- [ ] Commit message conventional
- [ ] Push branch
- [ ] `gh pr create` — Summary + Test plan
- [ ] Link PR di `STATUS.md` backlog

---

## M — Merge (hanya jika CI hijau)

- [ ] `gh pr checks <n> --watch` → semua pass
- [ ] `gh pr merge <n> --merge --delete-branch`
- [ ] `git checkout main && git pull`
- [ ] Update `STATUS.md`: sprint ✅, merged PR #
- [ ] (Opsional) Deploy prod jika user minta

---

## Post-merge

- [ ] Sprint berikutnya dipilih di `UI-PLAN.md`
- [ ] Tidak ada perubahan lokal orphan di branch lama
