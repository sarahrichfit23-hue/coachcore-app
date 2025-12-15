/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createIconElement, getIconStyles } from "./icon-renderer";

/**
 * InteractiveHeaderTool for EditorJS - creates a hero header with stats cards
 */
export default class InteractiveHeaderTool {
  static get toolbox() {
    return {
      title: "Interactive Header",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="4" rx="1" fill="currentColor"/><rect x="2" y="10" width="5" height="10" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="9" y="10" width="5" height="10" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="16" y="10" width="5" height="10" rx="1" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      headerIconName: data.headerIconName || "dumbbell",
      title: data.title || "Your Transformation Journey",
      subtitle: data.subtitle || "12 Weeks to Your Best Self",
      backgroundColor: data.backgroundColor || "#f5e3d1",
      cards: data.cards || [
        {
          iconName: "calendar",
          number: "12",
          label: "Weeks",
          iconColor: "#f59e0b",
        },
        {
          iconName: "dumbbell",
          number: "4",
          label: "Training Phases",
          iconColor: "#f59e0b",
        },
        {
          iconName: "apple",
          number: "3",
          label: "Meal Plans",
          iconColor: "#f59e0b",
        },
        {
          iconName: "award",
          number: "100%",
          label: "Commitment",
          iconColor: "#f59e0b",
        },
      ],
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("interactive-header-tool");

    const container = document.createElement("div");
    container.classList.add("interactive-header-container");
    container.style.backgroundColor = this.data.backgroundColor;

    // Logo (hardcoded)
    const logo = document.createElement("img");
    logo.src = "/coach-core-logo-new.png";
    logo.alt = "Coach Core OS";
    logo.classList.add("interactive-header-logo");

    container.appendChild(logo);

    // Main content wrapper
    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("interactive-header-content");

    // Header section with icon and title
    const headerSection = document.createElement("div");
    headerSection.classList.add("interactive-header-section");

    const headerIconEl = createIconElement({
      iconName: this.data.headerIconName,
      color: "#f59e0b",
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.headerIconName = newIconName;
      },
    });
    headerIconEl.classList.add("interactive-header-icon");
    headerSection.appendChild(headerIconEl);

    // Title
    const titleEl = document.createElement("h1");
    titleEl.classList.add("interactive-header-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.title;
      titleInput.placeholder = "Header title...";
      titleInput.classList.add("interactive-header-title-input");
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      titleEl.appendChild(titleInput);
    }
    headerSection.appendChild(titleEl);

    contentWrapper.appendChild(headerSection);

    // Subtitle
    const subtitleEl = document.createElement("div");
    subtitleEl.classList.add("interactive-header-subtitle");

    if (this.readOnly) {
      subtitleEl.textContent = this.data.subtitle;
    } else {
      const subtitleInput = document.createElement("input");
      subtitleInput.type = "text";
      subtitleInput.value = this.data.subtitle;
      subtitleInput.placeholder = "Subtitle...";
      subtitleInput.classList.add("interactive-header-subtitle-input");
      subtitleInput.addEventListener("input", (e) => {
        this.data.subtitle = e.target.value;
      });
      subtitleEl.appendChild(subtitleInput);
    }
    contentWrapper.appendChild(subtitleEl);

    // Cards container
    const cardsContainer = document.createElement("div");
    cardsContainer.classList.add("interactive-header-cards");

    this.data.cards.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.classList.add("interactive-header-card");

      // Card icon
      const cardIconEl = createIconElement({
        iconName: card.iconName || "star",
        color: card.iconColor || "#f59e0b",
        readOnly: this.readOnly,
        onChange: (newIconName) => {
          this.data.cards[index].iconName = newIconName;
        },
      });
      cardIconEl.classList.add("interactive-header-card-icon");
      cardEl.appendChild(cardIconEl);

      // Card number
      const numberEl = document.createElement("div");
      numberEl.classList.add("interactive-header-card-number");

      if (this.readOnly) {
        numberEl.textContent = card.number;
      } else {
        const numberInput = document.createElement("input");
        numberInput.type = "text";
        numberInput.value = card.number;
        numberInput.placeholder = "Number";
        numberInput.classList.add("interactive-header-card-number-input");
        numberInput.addEventListener("input", (e) => {
          this.data.cards[index].number = e.target.value;
        });
        numberEl.appendChild(numberInput);
      }
      cardEl.appendChild(numberEl);

      // Card label
      const labelEl = document.createElement("div");
      labelEl.classList.add("interactive-header-card-label");

      if (this.readOnly) {
        labelEl.textContent = card.label;
      } else {
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = card.label;
        labelInput.placeholder = "Label";
        labelInput.classList.add("interactive-header-card-label-input");
        labelInput.addEventListener("input", (e) => {
          this.data.cards[index].label = e.target.value;
        });
        labelEl.appendChild(labelInput);
      }
      cardEl.appendChild(labelEl);

      cardsContainer.appendChild(cardEl);
    });

    contentWrapper.appendChild(cardsContainer);
    container.appendChild(contentWrapper);
    this.wrapper.appendChild(container);

    // Add controls for edit mode
    if (!this.readOnly) {
      const controls = document.createElement("div");
      controls.classList.add("interactive-header-controls");

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "Background:";
      bgLabel.style.fontSize = "12px";
      bgLabel.style.fontWeight = "600";

      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = this.data.backgroundColor;
      bgInput.addEventListener("input", (e) => {
        this.data.backgroundColor = e.target.value;
        container.style.backgroundColor = e.target.value;
      });

      controls.appendChild(bgLabel);
      controls.appendChild(bgInput);
      this.wrapper.appendChild(controls);
    }

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      ${getIconStyles()}
      
      .interactive-header-tool {
        margin: 20px 0;
      }
      
      .interactive-header-container {
        padding: 3rem 2rem;
        border-radius: 0;
        position: relative;
        border-bottom: 3px solid #f59e0b;
      }
      
      .interactive-header-logo {
        width: 120px;
        height: 120px;
        margin-bottom: 2rem;
        border-radius: 9999px;
        background: white;
        border: 4px solid #f59e0b;
        padding: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      
      .interactive-header-content {
        max-width: 100%;
      }
      
      .interactive-header-section {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      
      .interactive-header-icon {
        flex-shrink: 0;
      }
      
      .interactive-header-icon .editorjs-icon-container {
        width: 50px;
        height: 50px;
      }
      
      .interactive-header-icon svg {
        width: 48px !important;
        height: 48px !important;
        color: #f59e0b !important;
        stroke: #f59e0b !important;
      }
      
      .interactive-header-title {
        font-size: 2.25rem;
        font-weight: 900;
        color: #1f2937;
        margin: 0;
        line-height: 1.2;
      }
      
      .interactive-header-title-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 2.25rem;
        font-weight: 900;
        color: #1f2937;
        outline: none;
      }
      
      .interactive-header-subtitle {
        font-size: 1.125rem;
        color: #4b5563;
        margin-bottom: 3rem;
        text-align: right;
      }
      
      .interactive-header-subtitle-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 1.125rem;
        color: #4b5563;
        outline: none;
        text-align: right;
      }
      
      .interactive-header-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-top: 2rem;
      }
      
      @media (max-width: 1024px) {
        .interactive-header-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 640px) {
        .interactive-header-cards {
          grid-template-columns: 1fr;
        }
      }
      
      .interactive-header-card {
        background: white;
        border: 2px solid #f59e0b;
        border-radius: 16px;
        padding: 2rem 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      
      .interactive-header-card-icon .editorjs-icon-container {
        width: 60px;
        height: 60px;
      }
      
      .interactive-header-card-icon svg {
        width: 48px !important;
        height: 48px !important;
        color: #f59e0b !important;
        stroke: #f59e0b !important;
      }
      
      .interactive-header-card-number {
        font-size: 2.5rem;
        font-weight: 600;
        color: #1f2937;
        line-height: 1;
      }
      
      .interactive-header-card-number-input {
        width: 100%;
        border: none;
        background: #f9fafb;
        padding: 0.5rem;
        border-radius: 6px;
        font-size: 2.5rem;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
        outline: none;
      }
      
      .interactive-header-card-label {
        font-size: 1rem;
        color: #6b7280;
        font-weight: 500;
      }
      
      .interactive-header-card-label-input {
        width: 100%;
        border: none;
        background: #f9fafb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 1rem;
        color: #6b7280;
        text-align: center;
        outline: none;
      }
      
      .interactive-header-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .interactive-header-controls input[type="color"] {
        width: 50px;
        height: 30px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  save() {
    return this.data;
  }

  validate(savedData) {
    return true;
  }
}
