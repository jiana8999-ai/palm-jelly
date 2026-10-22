# Palm Jelly
A webcam-controlled underwater mini-game. Move your palm to guide a jellyfish through three glowing rings.

## Project direction
- Soft illustrated ocean, little fish, bubbles and sea plants.
- Three rings at different heights and sizes, increasing precision gradually.
- English primary UI with short Chinese guidance.

## Development history
This repository is committed and uploaded incrementally as features are built.

1. Initial upload: project structure, launch page and local preview.

2. Second upload: canvas ocean, animated jellyfish, staggered ring sizes and keyboard gameplay.
3. Third upload: local webcam palm tracking, lost-hand pause and camera error recovery.

4. Fourth upload: ring collision tests, deployment configuration and final usability fixes.

## Run locally
Requires Node.js 18+. Run `npm run dev` then open http://127.0.0.1:4173.
Run `npm test` for ring geometry and hand mapping checks. `npm run build` creates `dist/`.

## Play
Allow the camera, hold one open palm in view and move it up/down/left/right. The preview is mirrored. Fit the whole jellyfish in the active ring and hold for 0.65 seconds. Rings alternate vertically and gradually shrink. Complete all three without a time limit. Use arrow keys or WASD in keyboard mode.

## Deployment
Cloudflare Pages: framework None; build command `npm run build`; output directory `dist`. Direct upload can also use the built dist directory.

## Current scope
Working first prototype: animated canvas scene, local hand tracking, camera retry, pause, keyboard fallback and win/replay. Sound intentionally deferred. Webcam accuracy depends on light and device; keep the palm visible. Real-user webcam accuracy still needs classroom testing.

## Credits
Original canvas illustration and interface developed with AI assistance. MediaPipe Tasks Vision 0.10.22-rc.20250304 and Google Hand Landmarker model are used for on-device tracking; see https://github.com/google-ai-edge/mediapipe and https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker. Camera video is never uploaded by this application.
