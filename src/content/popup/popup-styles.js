// Popup styles, kept as a single exported string so the popup can inject
// them into its Shadow DOM. Shadow DOM isolation means these selectors do
// not leak to the host page, and the host page's styles do not reach in.

export const POPUP_STYLES = `
  :host {
    all: initial;
  }
  .root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    padding: 12px;
    position: fixed;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 480px;
    max-width: 760px;
  }
  .root.wide {
    min-width: 700px;
    max-width: 860px;
  }
  .form-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .form-title {
    font-size: 13px;
    font-weight: 600;
    margin-right: auto;
  }
  /* The area checklist is the one part tall enough to need its own
     scroller — keeping it here rather than on .root means the popup's
     measured height stays stable for viewport-flip positioning. */
  .tour {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 40vh;
    overflow-y: auto;
    padding-right: 2px;
  }
  .tour-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .tour-name {
    flex: 0 0 165px;
    font-size: 12.5px;
    color: #333;
  }
  .tour-row .check {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .tour-status {
    flex: 0 0 155px;
    font-size: 12.5px;
    padding: 4px 6px;
  }
  .tour-issue {
    flex: 1 1 auto;
    min-width: 120px;
  }
  .tour-people {
    flex: 0 0 68px;
    text-align: center;
  }
  .row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .row.checks {
    gap: 12px;
    padding: 2px 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1 1 140px;
    min-width: 140px;
  }
  .field-wide {
    flex: 1 1 100%;
    min-width: 100%;
  }
  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    padding: 4px 2px;
  }
  .label {
    font-size: 10.5px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  select,
  input[type="text"],
  input[type="date"] {
    font: inherit;
    color: inherit;
    padding: 6px 8px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    background: #fff;
    width: 100%;
    box-sizing: border-box;
  }
  select { cursor: pointer; }
  select:focus,
  input[type="text"]:focus,
  input[type="date"]:focus {
    outline: 2px solid #4c8bf5;
    outline-offset: -1px;
  }
  input[type="text"]::placeholder { color: #aaa; }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: #333;
    cursor: pointer;
    user-select: none;
  }
  .check input {
    margin: 0;
  }
  .flags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    padding: 4px 0 2px;
  }
  .flag {
    gap: 5px;
  }
  /* The swatch doubles as the legend — it is the only thing telling the
     user which colour a given flag will tint the sentence. */
  .swatch {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    flex: 0 0 auto;
  }
  .preview-label {
    font-size: 10.5px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    margin-top: 2px;
  }
  .preview {
    padding: 8px 10px;
    border: 1px dashed rgba(0, 0, 0, 0.18);
    border-radius: 6px;
    background: #fafbfc;
    font-size: 12.5px;
    line-height: 1.45;
    color: #1a1a1a;
    white-space: normal;
    overflow-wrap: anywhere;
    max-height: 24vh;
    overflow-y: auto;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    font: inherit;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    background: #f5f7fa;
    color: #1a1a1a;
    cursor: pointer;
  }
  .chip:hover {
    background: #e8eef7;
    border-color: rgba(26, 115, 232, 0.45);
  }
  .chip:focus {
    outline: 2px solid #4c8bf5;
    outline-offset: 1px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .hint {
    font-size: 11px;
    color: #888;
    margin-right: auto;
  }
  button {
    font: inherit;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  button.primary {
    background: #1a73e8;
    color: #fff;
  }
  button.primary:hover { background: #1765cc; }
  button.secondary {
    background: transparent;
    color: #444;
    border-color: rgba(0, 0, 0, 0.15);
  }
  button.secondary:hover { background: rgba(0, 0, 0, 0.04); }
`;
