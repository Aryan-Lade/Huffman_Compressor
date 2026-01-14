# HuffZip — Smart File Compression Utility

<p align="center">
  <b>A premium, modern file-compression workspace powered by classic Huffman coding.</b><br/>
  Compress, extract, encrypt and track everything from one polished dashboard.
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-22C55E" />
</p>

---

## Overview

HuffZip is a WinRAR / 7-Zip inspired compression tool with a **premium, glassmorphic UI**. It is built entirely with **HTML5 + CSS3 + Vanilla JavaScript** — no server, no build step, no database. A built-in JavaScript Huffman engine powers the live compression estimates, and everything you do is saved locally in your browser.

## Features

- **Compress** single files, multiple files and batches with Fast / Balanced / Maximum levels
- **Extract** archives with checksum verification and wrong-password detection
- **Password protection** with AES-256 (PBKDF2 key derivation) on the backend
- **Drag & drop anywhere** — drop files on any screen to jump straight into compression
- **Live estimates** — original size, compressed size, ratio and space saved before you commit
- **Reports** — a detailed report after every compression, exportable as `.txt`
- **History** — searchable, filterable archive history stored locally
- **Analytics** — compression ratio ring, 7-day performance chart, animated stat cards
- **Settings** — default level, output folder, theme, auto-overwrite, auto-clean temp
- **Premium UX** — toasts, modals, context menus, tooltips, keyboard shortcuts, skeletons, success animations
- **Fully responsive** — mobile-first layout with a collapsible hamburger sidebar
- **Light & dark themes** with smooth transitions

## Screenshots

> _Add screenshots here_

| Dashboard | Compress | Reports |
|-----------|----------|---------|
| `assets/screenshot-dashboard.png` | `assets/screenshot-compress.png` | `assets/screenshot-reports.png` |

## Tech Stack

**Frontend:** HTML5, CSS3 (modular: variables, base, layout, components, buttons, cards, animations, utilities, responsive, themes), Vanilla JavaScript, Bootstrap Icons.

**Engine:** A Huffman coding implementation written in plain JavaScript (`js/huffman.js`).

**Storage:** Browser `localStorage` (no server, no database required).

## Getting Started

There is **no build step and no server** — just open the site in a browser.

**Option 1 — open directly:** double-click `frontend/index.html`.

**Option 2 — run a tiny local server** (recommended, avoids browser file restrictions):

```bash
cd frontend
python -m http.server 5500
# then visit http://localhost:5500
```

That's it. Everything (compress, extract, reports, history, settings) works entirely in the browser and your data is saved locally.

## Folder Structure

```
Huffman_Compressor/
├── frontend/
│   ├── index.html
│   ├── css/            variables, base, layout, components, buttons,
│   │                   cards, animations, utilities, responsive, themes
│   ├── js/             utils, store, huffman, api, components, views, app
│   ├── assets/
│   └── icons/
├── reports/       generated compression reports
├── compressed/    output archives
├── temp/          temporary working files
└── README.md
```

## How Huffman Coding Works Here

1. Count the frequency of every byte in the file.
2. Build a **min-priority queue** of leaf nodes and merge the two smallest repeatedly into a binary **Huffman tree**.
3. Walk the tree to assign a short **prefix-free code** to each byte (frequent bytes get shorter codes).
4. Shorter codes for frequent bytes mean fewer total bits, which is where the space saving comes from.
5. A **checksum** is generated so archive integrity can be confirmed.

## Future Improvements

- Real streaming compression for very large files
- Adaptive / canonical Huffman for smaller headers
- Folder tree preview inside archives
- Cloud sync for history and reports
- Additional algorithms (LZ77, DEFLATE) for comparison

## License

Released under the **MIT License**. See `LICENSE` for details.

## Author

**Aryan Lade** — Computer Science Student & Developer
_Built as a showcase project demonstrating clean architecture, premium UI/UX and classic algorithms._
