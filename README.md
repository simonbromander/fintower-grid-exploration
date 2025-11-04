# Fintower Grid Exploration - AG Grid POC

POC to explore Excel-like interactions using AG Grid Enterprise.

## Goal

Address the problem that our current grid doesn't feel "Excel-like" enough in terms of interactions. This POC demonstrates key Excel-like features:

- **Undo/Redo** - Full undo/redo support with Ctrl+Z / Ctrl+Y (Cmd+Z / Cmd+Shift+Z on Mac)
- **Cell Editing** - Double-click, Enter, or F2 to edit cells
- **Range Selection** - Click and drag to select multiple cells
- **Fill Handle** - Drag from bottom-right corner of selection to fill cells (like Excel)
- **Clipboard Operations** - Ctrl+C / Ctrl+V for Excel-like copy/paste
- **Navigation** - Arrow keys, Tab, Enter to move between cells

## Reference

Based on AG Grid's official undo/redo example:
https://www.ag-grid.com/react-data-grid/undo-redo-edits/#example-undo-redo

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

## Features to Explore

- [ ] Undo/Redo (Ctrl+Z / Ctrl+Y)
- [ ] Fill handle behavior
- [ ] Range selection and copy/paste
- [ ] Keyboard navigation (arrow keys, Enter, Tab)
- [ ] Cell editing UX
- [ ] Excel-like formula support
- [ ] Custom cell editors
- [ ] Row/column operations

## Tech Stack

- React + TypeScript
- Vite
- AG Grid Enterprise
