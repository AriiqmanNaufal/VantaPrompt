# Chrome Extension Boilerplate

A simple Chrome extension boilerplate for VantaPrompt.

## Structure

- `manifest.json` - Extension configuration (Manifest V3)
- `popup.html` - Popup UI
- `popup.js` - Popup logic
- `popup.css` - Popup styles
- `background.js` - Background service worker
- `content.js` - Content script that runs on web pages
- `icons/` - Extension icons

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder

## Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card to reload changes

## Features

- **Popup Interface**: Simple UI with a button and status display
- **Storage**: Uses Chrome storage API to persist data
- **Background Service Worker**: Handles extension lifecycle and messages
- **Content Script**: Runs on web pages (currently just logs and can show indicator)

## Customization

- Modify `popup.html` and `popup.css` for UI changes
- Add functionality in `popup.js` and `background.js`
- Update `content.js` to interact with web pages
- Add permissions in `manifest.json` as needed
- Update `config.js` to point the extension at your local/server API (base URL and API key)

## Backend Connectivity

The extension expects the VantaPrompt backend to expose:

- `GET /extension/status` (public) – handshake + metadata
- `POST /extension/validatePrompt` (requires `x-api-key`) – validates prompts via the backend DLP service

Set the backend base URL and API key inside `extension/config.js` so background/popup scripts can talk to the API. In production, store secrets securely and avoid committing real keys.

## Icons

Place your extension icons in the `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use any image editor or online tools to create these icons.

