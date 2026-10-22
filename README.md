# Palm Jellyfish · 掌心水母

A bilingual, palm-controlled underwater browser game for a student interaction design project.

**Live:** https://palm-jelly.pages.dev/  
**Source:** https://github.com/jiana8999-ai/palm-jelly  
**History:** https://github.com/jiana8999-ai/palm-jelly/commits/main/

## Play

Start → enable camera → hold up one palm → complete the practice ring → guide the jellyfish through three glowing rings. Move your palm up/down/left/right. Fit the entire character inside each circle and hold for 0.65 seconds. The circles alternate high/low/high and get smaller. Lost tracking stops progress; use Pause for a break. Home and completion stop the camera.

## Design and audio

Warm, flat 2D ocean drawn with Canvas: translucent jellyfish, animated tentacles, moving fish, gently swaying plants and movement-sensitive bubble trails. English is primary, Chinese secondary. The completion screen uses the selected centered heading, surrounding fish and two actions.

All bundled interaction audio is originally synthesized with Web Audio: bubble clicks, recognition chimes, three rising ring sounds, completion notes and filtered water movement. Sound starts after a user interaction and can be muted. No copyrighted game soundtrack is bundled. The chosen music reference is Cheep Cheep Beach; a cleared audio source is pending. The `audio.loadMusic` interface supports starting from second 3.

## Develop

Use Node.js 20+; no build dependencies are required.

- `npm run dev` — http://127.0.0.1:4173
- `npm test` — game logic, module syntax and guided flow tests
- `npm run build` — copies public assets into dist

MediaPipe and its model are bundled under `public/vendor`; hand tracking runs locally, with no video upload or microphone access.

## Work history

This project is AI-assisted. Commits describe actual development stages and were pushed incrementally; they are not fabricated or backdated. See [DEVELOPMENT.md](DEVELOPMENT.md). Open this folder in VS Code and use Source Control → Graph to see the same commits as GitHub. Save files, stage changes, enter a commit message, and commit; `.vscode/settings.json` requests a push after each commit. Saving a file alone is not a Git commit.

Deployment is a separate Cloudflare Pages Direct Upload to the existing `palm-jelly` project. Updating GitHub does not automatically update this deployment.
