# Offline lesson video audit

Run the inventory from the repository root:

```sh
node scripts/audit-lesson-videos.mjs
node scripts/audit-lesson-videos.mjs --json
```

The audit loads the registered lesson data and its course metadata, then checks each declared video and optional poster against files under `public/`. It reports whether the media root is present, lists missing paths explicitly, and lists unreferenced media files under `public/videos/`. If `public/` is absent, every declared media path is reported as missing. The JSON mode includes each media declaration with its course, lesson, media kind, path, and `present` or `missing` status.

This is a local file inventory only. It does not create placeholders, download media, or assess playback or production quality.
