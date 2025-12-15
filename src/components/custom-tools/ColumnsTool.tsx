/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * ColumnsTool for EditorJS - allows creating 2 or 3 column layouts
 */
export default class ColumnsTool {
  static get toolbox() {
    return {
      title: "Columns",
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      columns: data.columns || 2,
      items: data.items || [],
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("columns-tool");

    const controls = document.createElement("div");
    controls.classList.add("columns-tool__controls");
    controls.innerHTML = `
      <button class="columns-tool__btn" data-columns="2">2 Columns</button>
      <button class="columns-tool__btn" data-columns="3">3 Columns</button>
    `;

    const container = document.createElement("div");
    container.classList.add("columns-tool__container");
    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${this.data.columns}, 1fr)`;
    container.style.gap = "20px";
    container.style.marginTop = "10px";

    if (!this.readOnly) {
      controls.addEventListener("click", (e) => {
        if (e.target.classList.contains("columns-tool__btn")) {
          const cols = parseInt(e.target.dataset.columns);
          this.data.columns = cols;
          container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

          // Adjust items array
          while (this.data.items.length < cols) {
            this.data.items.push({ content: "" });
          }
          if (this.data.items.length > cols) {
            this.data.items = this.data.items.slice(0, cols);
          }

          this.renderColumns(container);
        }
      });
      this.wrapper.appendChild(controls);
    }

    this.renderColumns(container);
    this.wrapper.appendChild(container);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .columns-tool {
        margin: 20px 0;
      }
      .columns-tool__controls {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }
      .columns-tool__btn {
        padding: 6px 12px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .columns-tool__btn:hover {
        background: #f7fafc;
      }
      .columns-tool__column {
        border: 1px dashed #cbd5e0;
        border-radius: 8px;
        padding: 15px;
        min-height: 100px;
      }
      .columns-tool__column textarea {
        width: 100%;
        min-height: 80px;
        border: none;
        outline: none;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
      }
      .columns-tool__column-content {
        white-space: pre-wrap;
        line-height: 1.6;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  renderColumns(container) {
    container.innerHTML = "";

    // Ensure we have the right number of items
    while (this.data.items.length < this.data.columns) {
      this.data.items.push({ content: "" });
    }

    for (let i = 0; i < this.data.columns; i++) {
      const column = document.createElement("div");
      column.classList.add("columns-tool__column");

      if (this.readOnly) {
        const content = document.createElement("div");
        content.classList.add("columns-tool__column-content");
        content.textContent = this.data.items[i]?.content || "";
        column.appendChild(content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.placeholder = `Column ${i + 1} content...`;
        textarea.value = this.data.items[i]?.content || "";
        textarea.addEventListener("input", (e) => {
          this.data.items[i] = { content: e.target.value };
        });
        column.appendChild(textarea);
      }

      container.appendChild(column);
    }
  }

  save() {
    return this.data;
  }
}
