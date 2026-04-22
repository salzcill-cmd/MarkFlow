<p align="center">
  <img src="https://img.shields.io/badge/MarkFlow-Advanced%20Markdown%20Editor-blue?style=for-the-badge&logo=markdown&logoColor=white" alt="MarkFlow">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Version-2.1.0-orange?style=for-the-badge" alt="Version">
</p>

<p align="center">
  <strong>MarkFlow</strong> — A professional, modern, and interactive Markdown editor built with Tailwind CSS. Combines the best of Notion and VS Code in a lightweight browser-based application.
</p>

---

## Overview

MarkFlow is an advanced Markdown editor with real-time preview, syntax highlighting, and powerful editing features — all running entirely in the browser with no backend required.

### Features

- **Dual Panel Layout** — Split-screen editor with live preview & resizable panels
- **Real-time Parsing** — Instant markdown rendering using marked.js
- **Syntax Highlighting** — Beautiful code blocks with highlight.js
- **Auto-save** — Automatically saves to localStorage
- **Export Options** — Download as .md or .html (fully rendered)
- **Theme System** — Light/Dark mode with 3 color themes
- **Keyboard Shortcuts** — Ctrl+B, Ctrl+I, Ctrl+K, etc.
- **Drag & Drop** — Drop images directly into editor
- **Responsive** — Desktop and mobile support with tab switching
- **File Status** — Shows editing state (Empty, Ready, Editing)
- **Toast Notifications** — Modern notifications
- **Undo/Redo** — Full history support

---

## Tech Stack

- **HTML5** — Semantic markup
- **Tailwind CSS** — Utility-first CSS framework
- **JavaScript (ES6+)** — Vanilla JavaScript
- **Marked.js** — Markdown parser
- **Highlight.js** — Code syntax highlighting
- **Bootstrap Icons** — Icon library

---

## Getting Started

### Installation

1. Clone or download the files:
   ```bash
   git clone https://github.com/yourusername/markflow.git
   cd markflow
   ```

2. Open `index.html` in your browser:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or simply open index.html directly
   ```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + K` | Insert Link |
| `Ctrl + S` | Manual Save |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + Shift + Z` | Redo |

---

## Project Structure

```
markflow/
├── index.html    # Main HTML with Tailwind CSS
├── style.css   # Custom styles
├── script.js   # JavaScript functionality
└── README.md  # Documentation
```

---

## Themes

### Light / Dark Mode
Toggle between light and dark themes for comfortable editing in any environment.

### Color Themes
- **Ocean Blue** (default)
- **Forest Green**
- **Lavender Purple**

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Future Improvements

- [ ] PDF export
- [ ] Multiple tabs
- [ ] Cloud sync
- [ ] Plugin system
- [ ] Collaborative editing

---

## License

MIT License — see LICENSE file for details.

---

## Acknowledgments

- [Marked.js](https://marked.js.org/)
- [Highlight.js](https://highlightjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

---

<p align="center">Made with ❤️</p>