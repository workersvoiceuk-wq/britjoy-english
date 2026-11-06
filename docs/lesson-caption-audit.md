# Offline lesson caption audit

Run the local inventory from the repository root, pointing it at the media directory to inspect:

```sh
node scripts/audit-lesson-captions.mjs --media-root public --json
node scripts/audit-lesson-captions.mjs --media-root public --durations /path/to/durations.json
```

The optional JSON file maps source media paths relative to the media root to operator-supplied durations in seconds:

```json
{
  "videos/example.mp4": 42.5
}
```

The audit reads declared SRT/WebVTT caption files, reports missing files and cue timing issues, and associates references with course and lesson identifiers. If captions are not declared, it reports none without inferring missing files. Duration checks are marked not checked without both an existing source media file and operator-supplied duration. The tool does not execute media or assess playback, language accuracy, lip sync, permissions, or educational quality.
