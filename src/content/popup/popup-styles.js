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
