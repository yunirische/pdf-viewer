# PDF Spec Web Review

This branch contains the current simplified `pdf_spec` web UI for design review.

The app is copied into:

```bash
pdf-spec-web/
```

Run locally:

```bash
cd pdf-spec-web
npm install
npm run dev
```

Notes:

- This is a review copy from `yunirische/pdf_spec`, branch `codex/preview-selection-workflow`.
- Source commit: `8e0f7dc`.
- Review scope is visual design and layout only. The product/API logic is treated as working for this review pass.
- The UI expects the `pdf_spec` API at `/api/v1` by default.
- For local API override, set `VITE_API_BASE_URL`.
- The original `pdf-viewer` donor files are intentionally left in the repository root for comparison.
