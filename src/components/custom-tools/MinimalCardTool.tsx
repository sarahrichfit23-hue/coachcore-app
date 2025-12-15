/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createIconElement, getIconStyles } from "./icon-renderer";

/**
 * MinimalCardTool for EditorJS - creates a simple centered card with icon, heading, and description
 */
export default class MinimalCardTool {
  static get toolbox() {
    return {
      title: "Minimal Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      iconName: data.iconName || "award",
      iconColor: data.iconColor || "#ffffff",
      bgColor: data.bgColor || "#f4a89d",
      heading: data.heading || "You're Capable of Amazing Things",
      description:
        data.description ||
        "This program isn't just about physical transformation—it's about proving to yourself that when you commit, show up consistently, and push through challenges, you can achieve anything you set your mind to. Let's make these 12 weeks count!",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("minimal-card-tool");

    const container = document.createElement("div");
    container.classList.add("minimal-card-container");
    container.style.backgroundColor = this.data.bgColor;

    // Icon
    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("minimal-card-icon-wrapper");

    const iconEl = createIconElement({
      iconName: this.data.iconName,
      color: this.data.iconColor,
      readOnly: this.readOnly,
      size: 30,
      onChange: (newIconName) => {
        this.data.iconName = newIconName;
      },
    });
    iconEl.classList.add("minimal-card-icon");
    iconWrapper.appendChild(iconEl);
    container.appendChild(iconWrapper);

    // Heading
    const heading = document.createElement("h2");
    heading.classList.add("minimal-card-heading");

    if (this.readOnly) {
      heading.textContent = this.data.heading;
    } else {
      const headingInput = document.createElement("input");
      headingInput.type = "text";
      headingInput.value = this.data.heading;
      headingInput.placeholder = "Heading...";
      headingInput.classList.add("minimal-card-heading-input");
      headingInput.addEventListener("input", (e) => {
        this.data.heading = e.target.value;
      });
      heading.appendChild(headingInput);
    }
    container.appendChild(heading);

    // Description
    const description = document.createElement("p");
    description.classList.add("minimal-card-description");

    if (this.readOnly) {
      description.textContent = this.data.description;
    } else {
      const descriptionTextarea = document.createElement("textarea");
      descriptionTextarea.value = this.data.description;
      descriptionTextarea.placeholder = "Description...";
      descriptionTextarea.classList.add("minimal-card-description-input");
      descriptionTextarea.addEventListener("input", (e) => {
        this.data.description = e.target.value;
      });
      description.appendChild(descriptionTextarea);
    }
    container.appendChild(description);

    this.wrapper.appendChild(container);

    // Controls
    if (!this.readOnly) {
      this.renderControls();
    }

    // Styles
    this.addStyles();

    return this.wrapper;
  }

  renderControls() {
    const controls = document.createElement("div");
    controls.classList.add("minimal-card-controls");

    // Background Color
    const bgLabel = document.createElement("label");
    bgLabel.textContent = "Background:";
    bgLabel.style.fontSize = "11px";
    bgLabel.style.fontWeight = "600";

    const bgInput = document.createElement("input");
    bgInput.type = "color";
    bgInput.value = this.data.bgColor;
    bgInput.addEventListener("input", (e) => {
      this.data.bgColor = e.target.value;
      const container = this.wrapper.querySelector(".minimal-card-container");
      if (container) {
        container.style.backgroundColor = e.target.value;
      }
    });

    // Icon Color
    const iconColorLabel = document.createElement("label");
    iconColorLabel.textContent = "Icon Color:";
    iconColorLabel.style.fontSize = "11px";
    iconColorLabel.style.fontWeight = "600";

    const iconColorInput = document.createElement("input");
    iconColorInput.type = "color";
    iconColorInput.value = this.data.iconColor;
    iconColorInput.addEventListener("input", (e) => {
      this.data.iconColor = e.target.value;
      //   const iconEl = this.wrapper.querySelector(".minimal-card-icon");
      //   if (iconEl) {
      //     const svg = iconEl.querySelector("svg");
      //     if (svg) {
      //       svg.style.color = e.target.value;
      //       const allPaths = svg.querySelectorAll("*");
      //       allPaths.forEach((el) => {
      //         el.style.fill = e.target.value;
      //         el.style.stroke = e.target.value;
      //       });
      //     }
      //   }
    });

    controls.appendChild(bgLabel);
    controls.appendChild(bgInput);
    controls.appendChild(iconColorLabel);
    controls.appendChild(iconColorInput);

    this.wrapper.appendChild(controls);
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      ${getIconStyles()}
      
      .minimal-card-tool {
        margin: 20px 0;
      }
      
      .minimal-card-container {
        padding: 4rem 3rem;
        border-radius: 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15);
      }
      
      .minimal-card-icon-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 0.5rem;
      }
      
      .minimal-card-icon .editorjs-icon-container {
        background: transparent !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .minimal-card-icon svg {
        width: 120px !important;
        height: 120px !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }
      
      .minimal-card-icon svg * {
        stroke: #fff !important;
      }
      
      .minimal-card-heading {
        font-size: 2.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1.3;
        max-width: 1000px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .minimal-card-heading-input {
        width: 100%;
        max-width: 1000px;
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.25);
        color: white;
        font-size: 2.25rem;
        font-weight: 700;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        outline: none;
        text-align: center;
        transition: all 0.2s;
      }
      
      .minimal-card-heading-input:focus {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
      }
      
      .minimal-card-heading-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .minimal-card-description {
        font-size: 1.25rem;
        line-height: 1.8;
        color: white;
        margin: 0;
        max-width: 1000px;
        opacity: 0.95;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .minimal-card-description-input {
        width: 100%;
        max-width: 1000px;
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.25);
        color: white;
        font-size: 1.25rem;
        line-height: 1.8;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        outline: none;
        font-family: inherit;
        resize: vertical;
        min-height: 140px;
        text-align: center;
        transition: all 0.2s;
      }
      
      .minimal-card-description-input:focus {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
      }
      
      .minimal-card-description-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .minimal-card-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .minimal-card-controls label {
        font-size: 11px;
        font-weight: 600;
        color: #4b5563;
      }
      
      .minimal-card-controls input[type="color"] {
        width: 40px;
        height: 25px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.wrapper.appendChild(style);
  }

  save() {
    return this.data;
  }

  validate(savedData) {
    return true;
  }
}
