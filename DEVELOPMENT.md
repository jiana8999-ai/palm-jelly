# Palm Jellyfish development log

This is an AI-assisted student prototype. Each entry corresponds to a real incremental commit and push; history is not backdated.

## 2026-10-22 — visual and interaction refinement

1. Sixth upload: replaced the old landing panel with bilingual home, camera, palm detection, practice and success screen structures. Applied the selected centered completion composition and smaller cream camera panel.
2. Seventh upload: built a layered 2D ocean renderer, translucent jellyfish with independently moving tentacles, swaying plants, swimming fish and motion-dependent bubble trails. Added sustained hand detection and a practice ring before gameplay.
3. Eighth upload: added original synthesized bubble clicks, water movement, recognition, ring and completion sounds, plus persisted mute control. Reserved an audio-file interface that starts at 3 seconds. No Nintendo recording is bundled; user music selection is pending an appropriate source.

## Animation and sound choices

Movement is smoothed; bubble density follows movement speed with a capped particle count. Lost tracking resets ring dwell progress. Goal circles stay fixed to keep precise palm positioning readable. The entire jellyfish must fit in each circle for 0.65 seconds. Small ambient movements are reduced when the operating system requests reduced motion.

Camera processing runs locally using the existing bundled MediaPipe model. There is no video upload or microphone request. The camera stops on home, completion and page exit.

## Publishing

Continue using the existing GitHub repository and Cloudflare Pages project `palm-jelly`. GitHub updates and Cloudflare Direct Upload are separate operations. Keep the same production URL, https://palm-jelly.pages.dev/ .
4. Ninth upload: fixed a module parsing error caught in browser QA; added an end-to-end state-machine test for palm recognition, required practice, paused movement, lost tracking, three-ring completion and return-home cleanup. Verified five tests and adjusted tablet-size header spacing.
