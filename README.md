# HuffZip — Smart File Compression Utility

<p align="center">
  <b>A premium, modern file-compression workspace powered by classic Huffman coding.</b><br/>
  Compress, extract, encrypt and track everything from one polished dashboard.
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" />
  <img alt="Java" src="https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white" />
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?logo=springboot&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-22C55E" />
</p>

---

## Overview

HuffZip is a WinRAR / 7-Zip inspired compression tool with a **premium, glassmorphic UI**. The frontend is pure **HTML5 + CSS3 + Vanilla JavaScript** and works completely on its own (with a built-in JavaScript Huffman engine + demo workspace). An optional **Java / Spring Boot** backend provides a real Huffman coding engine, AES encryption and checksum verification over a clean REST API.

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

**Backend:** Java 17, Spring Boot 3.2 (Spring Web), Huffman coding, `javax.crypto` (AES-CBC + PBKDF2), File Handling.

**Storage:** Browser `localStorage` (no database required).

## Getting Started

### Frontend only (fastest)

The frontend runs standalone — no backend needed.

```bash
cd frontend
# open index.html directly, or serve it:
python -m http.server 5500
# then visit http://localhost:5500
```

### With the Java backend

Requires **JDK 17+** and **Maven**.

```bash
cd backend
mvn spring-boot:run
# API + UI served at http://localhost:8080
```

To serve the UI through Spring Boot, copy the frontend into the backend's static folder:

```bash
cp -r frontend/* backend/src/main/resources/static/
```

The frontend automatically detects the backend via `GET /api/health` and shows a "Backend connected" toast when it is online. If the backend is offline it falls back to the built-in JavaScript Huffman engine, so the app always works.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Engine status check |
| `POST` | `/api/analyze` | Analyze a file (ratio, symbols, entropy) |
| `POST` | `/api/compress` | Compress and return statistics |
| `POST` | `/api/compress/download` | Compress and download the `.huff` archive |
| `POST` | `/api/extract/download` | Decompress and download the original file |

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
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/huffzip/
│       │   ├── HuffZipApplication.java
│       │   ├── controller/     CompressionController
│       │   ├── service/        CompressionService
│       │   ├── model/          HuffmanNode, CompressionResult
│       │   ├── util/           HuffmanCoder, CryptoUtil
│       │   └── config/         WebConfig
│       └── resources/          application.properties
├── reports/       generated compression reports
├── compressed/    output archives
├── temp/          temporary working files
└── README.md
```

## How Huffman Coding Works Here

1. Count the frequency of every byte in the file.
2. Build a **min-priority queue** of leaf nodes and merge the two smallest repeatedly into a binary **Huffman tree**.
3. Walk the tree to assign a short **prefix-free code** to each byte (frequent bytes get shorter codes).
4. Write a small header (magic number, length, frequency table) and pack the encoded bits into bytes.
5. Decompression rebuilds the identical tree from the header and walks it bit-by-bit to restore the original bytes. A **checksum** confirms integrity.

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
