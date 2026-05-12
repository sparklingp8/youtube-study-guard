# YouTube Study Guard

YouTube Study Guard is a Chrome extension that interrupts random YouTube watching with a focus check.

It shows a large math popup at intervals you choose (30s, 2 min, or 5 min), and you must solve it to continue.

## Why this exists

This extension is for people who want to avoid wasting time on random videos and stay intentional about watching educational content.

## Features

- Large blocking popup on YouTube with a math challenge
- Interval selection inside popup:
  - Every 30 seconds
  - Every 2 minutes
  - Every 5 minutes
- Live countdown badge on page for next popup timing
- Extension toolbar popup showing:
  - Current interval
  - Focus-check status
  - Time left for next popup

## Project files

- manifest.json
- content.js
- popup.html
- popup.js
- icon16.png
- icon32.png
- icon48.png
- icon128.png

## Installation (free, unpacked)

### Google Chrome

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode (top-right).
4. Click Load unpacked.
5. Select this project folder.
6. Open YouTube and test the popup.

### Microsoft Edge

1. Download or clone this repository.
2. Open Edge and go to `edge://extensions`.
3. Enable Developer mode (left sidebar).
4. Click Load unpacked.
5. Select this project folder.
6. Open YouTube and test the popup.

### Mozilla Firefox

Temporary install (good for testing):

1. Download or clone this repository.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Click Load Temporary Add-on.
4. Select `manifest.json` from this project.
5. Open YouTube and test the popup.

Note: Temporary add-ons are removed when Firefox restarts.

### Brave

1. Open `brave://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this folder.

### Opera

1. Open `opera://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this folder.

### Vivaldi

1. Open `vivaldi://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this folder.

### Safari (macOS)

Safari uses a different extension workflow and may require conversion via Xcode.
For now, this repository is primarily targeted at Chrome, Edge, Firefox, and Chromium-based browsers.

## How to use

1. Open a YouTube video page.
2. Solve the first math check popup.
3. Choose your interval using the radio options in the popup.
4. Keep the extension popup open from the toolbar icon to see live next-popup time.


## Notes

- If extension popup cannot read timer, reload the YouTube tab once.
- This extension currently targets: https://www.youtube.com/*


