# PDF Editor: Professional Keyboard Shortcuts Reference Manual

This reference guide documents all keyboard shortcuts and accessibility controls supported by the client-side PDF Editor workspace in iLikePDF.

---

## 1. Document & Workflow Operations

| Shortcut | Action | Scope / Context | Description |
| :--- | :--- | :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>S</kbd> | **Save / Export PDF** | Global Document | Opens the Export & Download Modal with deterministic filename and pre-flight validation. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>P</kbd> | **Print Document** | Global Document | Compiles and prints document via hidden print iframe without modifying document geometry. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>F</kbd> | **Find in Document** | Global Document | Toggles the client-side text search bar with real-time match highlighting. |
| <kbd>?</kbd> / <kbd>Shift</kbd> + <kbd>/</kbd> | **Shortcuts Modal** | Global Workspace | Opens the interactive Keyboard Shortcuts cheat sheet modal. |
| <kbd>Escape</kbd> | **Cancel / Deselect** | Global Workspace | Closes open modals, dismisses tool creation, and clears active object selections. |

---

## 2. Edit & History Controls

| Shortcut | Action | Scope / Context | Description |
| :--- | :--- | :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Z</kbd> | **Undo** | Document History | Reverts the last atomic modification (drawing, nudge, style change, page batch action). Restores clean status if history empty. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Y</kbd> | **Redo** | Document History | Re-applies the most recently undone action. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | **Alternative Redo** | Document History | Standard macOS / Linux alternative redo command. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>C</kbd> | **Copy Objects** | Canvas Selection | Copies selected annotations to internal clipboard with page relative offsets. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>X</kbd> | **Cut Objects** | Canvas Selection | Copies selected annotations to clipboard and deletes them from page in one action. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>V</kbd> | **Paste Objects** | Active Page | Pastes clipboard annotations onto the active page with automatic 20pt offset. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>A</kbd> | **Select All Objects** | Active Page | Selects every annotation/object on the current active page. |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Delete Selected** | Canvas Selection | Removes all highlighted objects on the active page. |

---

## 3. Object Precision Nudge Controls (Rotation-Aware)

| Shortcut | Action | Movement Delta | Description |
| :--- | :--- | :--- | :--- |
| <kbd>↑</kbd> | **Nudge Up** | 1 point (screen up) | Accurately shifts selected annotations 1 pt visually upwards, compensating for page rotation. |
| <kbd>↓</kbd> | **Nudge Down** | 1 point (screen down) | Accurately shifts selected annotations 1 pt visually downwards, compensating for page rotation. |
| <kbd>←</kbd> | **Nudge Left** | 1 point (screen left) | Accurately shifts selected annotations 1 pt visually leftwards, compensating for page rotation. |
| <kbd>→</kbd> | **Nudge Right** | 1 point (screen right) | Accurately shifts selected annotations 1 pt visually rightwards, compensating for page rotation. |
| <kbd>Shift</kbd> + <kbd>↑</kbd> | **Fast Nudge Up** | 10 points (screen up) | Rapid precision alignment upwards. |
| <kbd>Shift</kbd> + <kbd>↓</kbd> | **Fast Nudge Down** | 10 points (screen down) | Rapid precision alignment downwards. |
| <kbd>Shift</kbd> + <kbd>←</kbd> | **Fast Nudge Left** | 10 points (screen left) | Rapid precision alignment leftwards. |
| <kbd>Shift</kbd> + <kbd>→</kbd> | **Fast Nudge Right** | 10 points (screen right) | Rapid precision alignment rightwards. |

---

## 4. View & Document Navigation

| Shortcut | Action | Scope / Context | Description |
| :--- | :--- | :--- | :--- |
| <kbd>PageDown</kbd> / <kbd>J</kbd> | **Next Page** | Workspace Viewer | Advances active page view to the next sequential document page. |
| <kbd>PageUp</kbd> / <kbd>K</kbd> | **Previous Page** | Workspace Viewer | Navigates active page view to the preceding document page. |
| <kbd>Home</kbd> | **First Page** | Workspace Viewer | Jumps directly to Page 1 of the document. |
| <kbd>End</kbd> | **Last Page** | Workspace Viewer | Jumps directly to the terminal page of the document. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>+</kbd> | **Zoom In** | Canvas Scale | Increases canvas rendering scale by 15% (max 300%). |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>-</kbd> | **Zoom Out** | Canvas Scale | Decreases canvas rendering scale by 15% (min 25%). |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>0</kbd> | **Reset Zoom** | Canvas Scale | Reverts canvas scale to 100% (natural size). |

---

## 5. Input Field Protection & Accessibility Invariants

1. **Input Isolation**:
   - When focus is within an `<input>`, `<textarea>`, or any `contentEditable` field, all single-key shortcuts (e.g. `?`, `Delete`, `Backspace`, arrow keys) are strictly bypassed to guarantee uninterrupted text input.
2. **Platform Parity**:
   - Dynamic meta-key detection automatically binds <kbd>Cmd</kbd> on Apple macOS and <kbd>Ctrl</kbd> on Windows and Linux systems.
3. **Screen Reader Hints**:
   - Interactive elements and modal dialogues feature corresponding `aria-label`, `aria-modal="true"`, and `role="dialog"` attributes compliant with WCAG 2.1 AA guidelines.
