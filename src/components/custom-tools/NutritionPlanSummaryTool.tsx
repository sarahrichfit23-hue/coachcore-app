/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createIconElement, getIconStyles } from "./icon-renderer";

/**
 * NutritionPlanSummaryTool for EditorJS - creates a nutrition plan summary with monthly cards
 */
export default class NutritionPlanSummaryTool {
  static get toolbox() {
    return {
      title: "Nutrition Plan Summary",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      headerIconName: data.headerIconName || "apple",
      title: data.title || "Monthly Nutrition Plans",
      subtitle:
        data.subtitle || "Fuel your transformation with customized meal plans",
      headerGradientStart: data.headerGradientStart || "#f8a898",
      headerGradientEnd: data.headerGradientEnd || "#fb6f92",
      periodLabel: data.periodLabel || "Month",
      subPeriodLabel: data.subPeriodLabel || "Weeks",
      months: data.months || [
        {
          monthNumber: 1,
          weeks: "1-4",
          status: "Coming soon",
          focus: "Foundation nutrition, establishing habits, balanced macros",
        },
        {
          monthNumber: 2,
          weeks: "5-8",
          status: "Coming soon",
          focus:
            "Optimized performance nutrition, nutrient timing, meal prep mastery",
        },
        {
          monthNumber: 3,
          weeks: "9-12",
          status: "Coming soon",
          focus:
            "Peak performance nutrition, sustainable lifestyle habits, maintenance strategies",
        },
      ],
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("nutrition-plan-summary-tool");

    const container = document.createElement("div");
    container.classList.add("nutrition-plan-container");

    // Header section
    const header = document.createElement("div");
    header.classList.add("nutrition-plan-header");
    header.style.background = `linear-gradient(135deg, ${this.data.headerGradientStart} 0%, ${this.data.headerGradientEnd} 100%)`;

    const headerContent = document.createElement("div");
    headerContent.classList.add("nutrition-plan-header-content");

    // Icon
    const iconEl = createIconElement({
      iconName: this.data.headerIconName,
      color: "#ffffff",
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.headerIconName = newIconName;
      },
    });
    iconEl.classList.add("nutrition-plan-icon");
    headerContent.appendChild(iconEl);

    // Text content
    const textContent = document.createElement("div");
    textContent.classList.add("nutrition-plan-text-content");

    // Title
    const titleEl = document.createElement("h2");
    titleEl.classList.add("nutrition-plan-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.title;
      titleInput.placeholder = "Plan title...";
      titleInput.classList.add("nutrition-plan-title-input");
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      titleEl.appendChild(titleInput);
    }
    textContent.appendChild(titleEl);

    // Subtitle
    const subtitleEl = document.createElement("div");
    subtitleEl.classList.add("nutrition-plan-subtitle");

    if (this.readOnly) {
      subtitleEl.textContent = this.data.subtitle;
    } else {
      const subtitleInput = document.createElement("input");
      subtitleInput.type = "text";
      subtitleInput.value = this.data.subtitle;
      subtitleInput.placeholder = "Subtitle...";
      subtitleInput.classList.add("nutrition-plan-subtitle-input");
      subtitleInput.addEventListener("input", (e) => {
        this.data.subtitle = e.target.value;
      });
      subtitleEl.appendChild(subtitleInput);
    }
    textContent.appendChild(subtitleEl);

    headerContent.appendChild(textContent);
    header.appendChild(headerContent);
    container.appendChild(header);

    // Content section
    const content = document.createElement("div");
    content.classList.add("nutrition-plan-content");

    // Render months
    this.renderMonths(content);

    container.appendChild(content);
    this.wrapper.appendChild(container);

    // Add controls for edit mode
    if (!this.readOnly) {
      const controls = document.createElement("div");
      controls.classList.add("nutrition-plan-controls");

      // Period label input
      const periodLabel = document.createElement("label");
      periodLabel.textContent = "Period Label:";
      periodLabel.style.fontSize = "12px";
      periodLabel.style.fontWeight = "600";

      const periodInput = document.createElement("input");
      periodInput.type = "text";
      periodInput.value = this.data.periodLabel;
      periodInput.placeholder = "e.g., Month, Week";
      periodInput.style.padding = "0.5rem";
      periodInput.style.borderRadius = "6px";
      periodInput.style.border = "1px solid #d1d5db";
      periodInput.style.fontSize = "14px";
      periodInput.addEventListener("input", (e) => {
        this.data.periodLabel = e.target.value;
        this.renderMonths(content);
      });

      controls.appendChild(periodLabel);
      controls.appendChild(periodInput);

      // Sub-period label input
      const subPeriodLabel = document.createElement("label");
      subPeriodLabel.textContent = "Sub-Period Label:";
      subPeriodLabel.style.fontSize = "12px";
      subPeriodLabel.style.fontWeight = "600";

      const subPeriodInput = document.createElement("input");
      subPeriodInput.type = "text";
      subPeriodInput.value = this.data.subPeriodLabel;
      subPeriodInput.placeholder = "e.g., Weeks, Days";
      subPeriodInput.style.padding = "0.5rem";
      subPeriodInput.style.borderRadius = "6px";
      subPeriodInput.style.border = "1px solid #d1d5db";
      subPeriodInput.style.fontSize = "14px";
      subPeriodInput.addEventListener("input", (e) => {
        this.data.subPeriodLabel = e.target.value;
        this.renderMonths(content);
      });

      controls.appendChild(subPeriodLabel);
      controls.appendChild(subPeriodInput);

      // Add period button
      const addBtn = document.createElement("button");
      addBtn.textContent = "+ Add Period";
      addBtn.classList.add("nutrition-plan-add-btn");
      addBtn.addEventListener("click", () => {
        this.data.months.push({
          monthNumber: this.data.months.length + 1,
          weeks: "",
          status: "Coming soon",
          focus: "",
        });
        this.renderMonths(content);
      });
      controls.appendChild(addBtn);

      // Gradient color pickers
      const colorLabel1 = document.createElement("label");
      colorLabel1.textContent = "Gradient Start:";
      colorLabel1.style.fontSize = "12px";
      colorLabel1.style.fontWeight = "600";

      const colorInput1 = document.createElement("input");
      colorInput1.type = "color";
      colorInput1.value = this.data.headerGradientStart;
      colorInput1.addEventListener("input", (e) => {
        this.data.headerGradientStart = e.target.value;
        header.style.background = `linear-gradient(135deg, ${this.data.headerGradientStart} 0%, ${this.data.headerGradientEnd} 100%)`;
      });

      const colorLabel2 = document.createElement("label");
      colorLabel2.textContent = "Gradient End:";
      colorLabel2.style.fontSize = "12px";
      colorLabel2.style.fontWeight = "600";

      const colorInput2 = document.createElement("input");
      colorInput2.type = "color";
      colorInput2.value = this.data.headerGradientEnd;
      colorInput2.addEventListener("input", (e) => {
        this.data.headerGradientEnd = e.target.value;
        header.style.background = `linear-gradient(135deg, ${this.data.headerGradientStart} 0%, ${this.data.headerGradientEnd} 100%)`;
      });

      controls.appendChild(colorLabel1);
      controls.appendChild(colorInput1);
      controls.appendChild(colorLabel2);
      controls.appendChild(colorInput2);

      this.wrapper.appendChild(controls);
    }

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      ${getIconStyles()}
      
      .nutrition-plan-summary-tool {
        margin: 20px 0;
      }
      
      .nutrition-plan-container {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      
      .nutrition-plan-header {
        padding: 2.5rem 2rem;
        color: white;
      }
      
      .nutrition-plan-header-content {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      
      .nutrition-plan-icon .editorjs-icon-container {
        width: 70px;
        height: 70px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .nutrition-plan-icon svg {
        width: 48px !important;
        height: 48px !important;
        color: white !important;
        stroke: white !important;
      }
      
      .nutrition-plan-text-content {
        flex: 1;
      }
      
      .nutrition-plan-title {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.5rem 0;
        line-height: 1.2;
      }
      
      .nutrition-plan-title-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 2rem;
        font-weight: 700;
        color: white;
        outline: none;
      }
      
      .nutrition-plan-title-input::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .nutrition-plan-subtitle {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .nutrition-plan-subtitle-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 1rem;
        color: white;
        outline: none;
      }
      
      .nutrition-plan-subtitle-input::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .nutrition-plan-content {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .nutrition-month-card {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
      }
      
      .nutrition-month-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      
      .nutrition-month-title-section {
        flex: 1;
      }
      
      .nutrition-month-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.25rem 0;
      }
      
      .nutrition-month-title-input {
        width: 200px;
        border: none;
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        outline: none;
        border: 1px solid #e5e7eb;
      }
      
      .nutrition-month-weeks {
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .nutrition-month-weeks-input {
        width: 150px;
        border: none;
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #6b7280;
        outline: none;
        border: 1px solid #e5e7eb;
      }
      
      .nutrition-month-status {
        padding: 0.375rem 0.75rem;
        background: white;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }
      
      .nutrition-month-status-input {
        border: none;
        background: white;
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #6b7280;
        outline: none;
        border: 1px solid #e5e7eb;
      }
      
      .nutrition-month-focus {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      
      .nutrition-focus-icon {
        flex-shrink: 0;
        margin-top: 0.125rem;
      }
      
      .nutrition-focus-icon svg {
        width: 18px !important;
        height: 18px !important;
        color: #f59e0b !important;
        stroke: #f59e0b !important;
      }
      
      .nutrition-focus-text {
        flex: 1;
      }
      
      .nutrition-focus-label {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.875rem;
      }
      
      .nutrition-focus-content {
        color: #4b5563;
        font-size: 0.875rem;
        line-height: 1.5;
        margin-top: 0.25rem;
      }
      
      .nutrition-focus-input {
        width: 100%;
        border: none;
        background: white;
        padding: 0.5rem;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #4b5563;
        outline: none;
        border: 1px solid #e5e7eb;
        resize: vertical;
        min-height: 60px;
        font-family: inherit;
      }
      
      .nutrition-month-delete-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
      }
      
      .nutrition-month-delete-btn:hover {
        background: #dc2626;
      }
      
      .nutrition-month-delete-btn svg {
        width: 16px;
        height: 16px;
      }
      
      .nutrition-plan-controls {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-top: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .nutrition-plan-add-btn {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      
      .nutrition-plan-add-btn:hover {
        background: #2563eb;
      }
      
      .nutrition-plan-controls input[type="color"] {
        width: 50px;
        height: 30px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .nutrition-plan-controls label {
        font-size: 12px;
        font-weight: 600;
        color: #4b5563;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  renderMonths(container) {
    container.innerHTML = "";

    this.data.months.forEach((month, index) => {
      const card = document.createElement("div");
      card.classList.add("nutrition-month-card");

      // Delete button (edit mode only)
      if (!this.readOnly && this.data.months.length > 1) {
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
        deleteBtn.classList.add("nutrition-month-delete-btn");
        deleteBtn.addEventListener("click", () => {
          this.data.months.splice(index, 1);
          // Renumber remaining months
          this.data.months.forEach((m, i) => {
            m.monthNumber = i + 1;
          });
          this.renderMonths(container);
        });
        card.appendChild(deleteBtn);
      }

      // Header
      const header = document.createElement("div");
      header.classList.add("nutrition-month-header");

      const titleSection = document.createElement("div");
      titleSection.classList.add("nutrition-month-title-section");

      // Title
      const titleEl = document.createElement("div");
      titleEl.classList.add("nutrition-month-title");

      if (this.readOnly) {
        titleEl.textContent = `${this.data.periodLabel} ${month.monthNumber}`;
      } else {
        const label = document.createElement("span");
        label.textContent = `${this.data.periodLabel} `;
        titleEl.appendChild(label);

        const titleInput = document.createElement("input");
        titleInput.type = "number";
        titleInput.value = month.monthNumber;
        titleInput.min = "1";
        titleInput.classList.add("nutrition-month-title-input");
        titleInput.addEventListener("input", (e) => {
          this.data.months[index].monthNumber = parseInt(e.target.value) || 1;
        });
        titleEl.appendChild(titleInput);
      }
      titleSection.appendChild(titleEl);

      // Sub-period (e.g., Weeks, Days)
      const weeksEl = document.createElement("div");
      weeksEl.classList.add("nutrition-month-weeks");

      if (this.readOnly) {
        weeksEl.textContent = `${this.data.subPeriodLabel} ${month.weeks}`;
      } else {
        const weeksLabel = document.createElement("span");
        weeksLabel.textContent = `${this.data.subPeriodLabel} `;
        const weeksInput = document.createElement("input");
        weeksInput.type = "text";
        weeksInput.value = month.weeks;
        weeksInput.placeholder = "e.g., 1-4";
        weeksInput.classList.add("nutrition-month-weeks-input");
        weeksInput.addEventListener("input", (e) => {
          this.data.months[index].weeks = e.target.value;
        });
        weeksEl.appendChild(weeksLabel);
        weeksEl.appendChild(weeksInput);
      }
      titleSection.appendChild(weeksEl);

      header.appendChild(titleSection);

      // Status
      const statusEl = document.createElement("div");
      statusEl.classList.add("nutrition-month-status");

      if (this.readOnly) {
        statusEl.textContent = month.status;
      } else {
        const statusInput = document.createElement("input");
        statusInput.type = "text";
        statusInput.value = month.status;
        statusInput.placeholder = "Status";
        statusInput.classList.add("nutrition-month-status-input");
        statusInput.addEventListener("input", (e) => {
          this.data.months[index].status = e.target.value;
        });
        statusEl.appendChild(statusInput);
      }
      header.appendChild(statusEl);

      card.appendChild(header);

      // Focus section
      const focusSection = document.createElement("div");
      focusSection.classList.add("nutrition-month-focus");

      const focusIcon = createIconElement({
        iconName: "target",
        color: "#f59e0b",
        readOnly: true,
      });
      focusIcon.classList.add("nutrition-focus-icon");
      focusSection.appendChild(focusIcon);

      const focusText = document.createElement("div");
      focusText.classList.add("nutrition-focus-text");

      const focusLabel = document.createElement("div");
      focusLabel.classList.add("nutrition-focus-label");
      focusLabel.textContent = "Focus:";
      focusText.appendChild(focusLabel);

      const focusContent = document.createElement("div");
      focusContent.classList.add("nutrition-focus-content");

      if (this.readOnly) {
        focusContent.textContent = month.focus;
      } else {
        const focusInput = document.createElement("textarea");
        focusInput.value = month.focus;
        focusInput.placeholder = "Focus areas for this month...";
        focusInput.classList.add("nutrition-focus-input");
        focusInput.addEventListener("input", (e) => {
          this.data.months[index].focus = e.target.value;
        });
        focusContent.appendChild(focusInput);
      }
      focusText.appendChild(focusContent);

      focusSection.appendChild(focusText);
      card.appendChild(focusSection);

      container.appendChild(card);
    });
  }

  save() {
    return this.data;
  }

  validate(savedData) {
    return true;
  }
}
