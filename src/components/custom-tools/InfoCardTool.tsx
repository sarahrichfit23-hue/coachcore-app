/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * InfoCardTool for EditorJS - creates colored info cards with icons
 */
export default class InfoCardTool {
  static get toolbox() {
    return {
      title: "Info Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 9v4m0 2h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      icon: data.icon || "📄",
      title: data.title || "",
      content: data.content || "",
      backgroundColor: data.backgroundColor || "#eff6ff",
      textColor: data.textColor || "#1f2937",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("info-card-tool");

    this.cardContainer = document.createElement("div");
    this.renderCard();
    this.wrapper.appendChild(this.cardContainer);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .info-card-tool {
        margin: 15px 0;
      }
      .info-card {
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #fefefe;
      }
      .info-card__header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .info-card__icon {
        font-size: 18px;
      }
      .info-card__icon-input {
        font-size: 18px;
        width: 40px;
        text-align: center;
        border: 1px dashed #d1d5db;
        background: rgba(255, 255, 255, 0.3);
        padding: 2px;
        border-radius: 4px;
        outline: none;
      }
      .info-card__title {
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-card__title input {
        border: none;
        background: transparent;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
        width: 100%;
      }
      .info-card__content textarea {
        width: 100%;
        min-height: 60px;
        border: none;
        background: transparent;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.6;
        outline: none;
      }
      .info-card__content-text {
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .info-card__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }
      .info-card__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .info-card__color-controls input[type="color"] {
        width: 35px;
        height: 25px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  renderCard() {
    this.cardContainer.innerHTML = "";

    const card = document.createElement("div");
    card.classList.add("info-card");
    card.style.backgroundColor = this.data.backgroundColor;
    card.style.color = this.data.textColor;

    const header = document.createElement("div");
    header.classList.add("info-card__header");

    const iconEl = document.createElement("div");
    iconEl.classList.add("info-card__icon");

    if (this.readOnly) {
      iconEl.textContent = this.data.icon;
    } else {
      const iconInput = document.createElement("input");
      iconInput.type = "text";
      iconInput.value = this.data.icon;
      iconInput.maxLength = 4;
      iconInput.classList.add("info-card__icon-input");
      iconInput.addEventListener("input", (e) => {
        this.data.icon = e.target.value;
      });
      iconEl.appendChild(iconInput);
    }
    header.appendChild(iconEl);

    const titleEl = document.createElement("div");
    titleEl.classList.add("info-card__title");
    titleEl.style.color = this.data.textColor;

    if (this.readOnly) {
      titleEl.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.placeholder = "Card title...";
      titleInput.value = this.data.title;
      titleInput.style.color = this.data.textColor;
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      titleEl.appendChild(titleInput);
    }
    header.appendChild(titleEl);
    card.appendChild(header);

    const content = document.createElement("div");
    content.classList.add("info-card__content");
    content.style.color = this.data.textColor;

    if (this.readOnly) {
      const text = document.createElement("div");
      text.classList.add("info-card__content-text");
      text.textContent = this.data.content;
      content.appendChild(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Card content...";
      textarea.value = this.data.content;
      textarea.style.color = this.data.textColor;
      textarea.addEventListener("input", (e) => {
        this.data.content = e.target.value;
      });
      content.appendChild(textarea);
    }
    card.appendChild(content);

    // Color controls (edit mode only)
    if (!this.readOnly) {
      const colorControls = document.createElement("div");
      colorControls.classList.add("info-card__color-controls");

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "BG:";
      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = this.data.backgroundColor;
      bgInput.addEventListener("input", (e) => {
        this.data.backgroundColor = e.target.value;
        card.style.backgroundColor = e.target.value;
      });

      const textLabel = document.createElement("label");
      textLabel.textContent = "Text:";
      const textInput = document.createElement("input");
      textInput.type = "color";
      textInput.value = this.data.textColor;
      textInput.addEventListener("input", (e) => {
        this.data.textColor = e.target.value;
        card.style.color = e.target.value;
        titleEl.style.color = e.target.value;
        content.style.color = e.target.value;
        if (titleEl.querySelector("input")) {
          titleEl.querySelector("input").style.color = e.target.value;
        }
        if (content.querySelector("textarea")) {
          content.querySelector("textarea").style.color = e.target.value;
        }
      });

      colorControls.appendChild(bgLabel);
      colorControls.appendChild(bgInput);
      colorControls.appendChild(textLabel);
      colorControls.appendChild(textInput);
      card.appendChild(colorControls);
    }

    this.cardContainer.appendChild(card);
  }

  save() {
    return this.data;
  }
}
