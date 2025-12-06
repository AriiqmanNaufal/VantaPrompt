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

## Icons

Place your extension icons in the `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use any image editor or online tools to create these icons.

