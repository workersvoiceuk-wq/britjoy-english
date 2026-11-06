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

The audit reads declared SRT/WebVTT caption files, reports missing files and cue timing issues, and associates references with course and lesson identifiers. Present files are also validated: empty tracks, malformed SRT cues, missing WebVTT headers, invalid cue times, and out-of-order cues are reported as invalid rather than clean. A `present` file status means only that the file exists; check `validationStatus` for whether its contents passed the audit. Duration checks are marked not checked when the file is absent, its timing structure is invalid, or the source media or operator-supplied duration is unavailable. Any finding makes the command exit nonzero, including in JSON mode. If captions are not declared, it reports none without inferring missing files. The tool does not execute media or assess playback, language accuracy, lip sync, permissions, or educational quality.
