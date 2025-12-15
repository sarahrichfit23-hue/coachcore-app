/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * FAQTool for EditorJS - creates an FAQ accordion section
 */
export default class FAQTool {
  static get toolbox() {
    return {
      title: "FAQ",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      title: data.title || "FAQs",
      items: data.items || [],
      backgroundColor: data.backgroundColor || "#ffffff",
      questionBackgroundColor: data.questionBackgroundColor || "#f9fafb",
      textColor: data.textColor || "#1f2937",
      accentColor: data.accentColor || "#3b82f6",
      answerBackgroundColor: data.answerBackgroundColor || "#ffffff",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("faq-tool");

    const container = document.createElement("div");
    container.classList.add("faq-container");
    container.style.backgroundColor = this.data.backgroundColor;
    container.style.borderColor = this.data.accentColor;

    const header = document.createElement("div");
    header.classList.add("faq-header");
    header.style.color = this.data.textColor;

    if (this.readOnly) {
      header.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.title;
      titleInput.placeholder = "FAQ Section Title...";
      titleInput.style.color = this.data.textColor;
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      header.appendChild(titleInput);
    }

    container.appendChild(header);

    const itemsContainer = document.createElement("div");
    itemsContainer.classList.add("faq-items");
    this.renderItems(itemsContainer);
    container.appendChild(itemsContainer);

    if (!this.readOnly) {
      const addBtn = document.createElement("button");
      addBtn.classList.add("faq-add-btn");
      addBtn.textContent = "+ Add Question";
      addBtn.addEventListener("click", () => {
        this.data.items.push({
          question: "",
          answer: "",
          isOpen: false,
        });
        this.renderItems(itemsContainer);
      });
      container.appendChild(addBtn);
    }

    this.wrapper.appendChild(container);

    // Color controls
    if (!this.readOnly) {
      const colorControls = document.createElement("div");
      colorControls.classList.add("faq-color-controls");

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "BG:";
      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = this.data.backgroundColor;
      bgInput.addEventListener("input", (e) => {
        this.data.backgroundColor = e.target.value;
        container.style.backgroundColor = e.target.value;
      });

      const questionBgLabel = document.createElement("label");
      questionBgLabel.textContent = "Question BG:";
      const questionBgInput = document.createElement("input");
      questionBgInput.type = "color";
      questionBgInput.value = this.data.questionBackgroundColor;
      questionBgInput.addEventListener("input", (e) => {
        this.data.questionBackgroundColor = e.target.value;
        const questions = this.wrapper.querySelectorAll(".faq-item__question");
        questions.forEach((q) => {
          q.style.backgroundColor = e.target.value;
        });
      });

      const textLabel = document.createElement("label");
      textLabel.textContent = "Text:";
      const textInput = document.createElement("input");
      textInput.type = "color";
      textInput.value = this.data.textColor;
      textInput.addEventListener("input", (e) => {
        this.data.textColor = e.target.value;
        header.style.color = e.target.value;
        if (header.querySelector("input")) {
          header.querySelector("input").style.color = e.target.value;
        }
        const questionTexts = this.wrapper.querySelectorAll(
          ".faq-item__question-text, .faq-item__question input",
        );
        questionTexts.forEach((t) => {
          t.style.color = e.target.value;
        });
        const answerTexts = this.wrapper.querySelectorAll(
          ".faq-item__answer-text, .faq-item__answer textarea",
        );
        answerTexts.forEach((t) => {
          t.style.color = e.target.value;
        });
      });

      const accentLabel = document.createElement("label");
      accentLabel.textContent = "Accent:";
      const accentInput = document.createElement("input");
      accentInput.type = "color";
      accentInput.value = this.data.accentColor;
      accentInput.addEventListener("input", (e) => {
        this.data.accentColor = e.target.value;
        container.style.borderColor = e.target.value;
        const items = this.wrapper.querySelectorAll(".faq-item");
        items.forEach((item) => {
          item.style.borderColor = e.target.value;
        });
      });

      const answerBgLabel = document.createElement("label");
      answerBgLabel.textContent = "Answer BG:";
      const answerBgInput = document.createElement("input");
      answerBgInput.type = "color";
      answerBgInput.value = this.data.answerBackgroundColor;
      answerBgInput.addEventListener("input", (e) => {
        this.data.answerBackgroundColor = e.target.value;
        const answers = this.wrapper.querySelectorAll(".faq-item__answer");
        answers.forEach((a) => {
          a.style.backgroundColor = e.target.value;
        });
      });

      colorControls.appendChild(bgLabel);
      colorControls.appendChild(bgInput);
      colorControls.appendChild(questionBgLabel);
      colorControls.appendChild(questionBgInput);
      colorControls.appendChild(textLabel);
      colorControls.appendChild(textInput);
      colorControls.appendChild(accentLabel);
      colorControls.appendChild(accentInput);
      colorControls.appendChild(answerBgLabel);
      colorControls.appendChild(answerBgInput);
      this.wrapper.appendChild(colorControls);
    }

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .faq-tool {
        margin: 30px 0;
      }
      .faq-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
      }
      .faq-header {
        font-weight: 600;
        font-size: 20px;
        margin-bottom: 20px;
      }
      .faq-header input {
        width: 100%;
        border: none;
        background: #f9fafb;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 20px;
        outline: none;
      }
      .faq-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .faq-item {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }
      .faq-item__question {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 15px;
        background: #f9fafb;
        cursor: pointer;
        user-select: none;
      }
      .faq-item__question:hover {
        background: #f3f4f6;
      }
      .faq-item__icon {
        font-size: 12px;
        color: #9ca3af;
        transition: transform 0.2s;
      }
      .faq-item__icon.open {
        transform: rotate(90deg);
      }
      .faq-item__question-text {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
      }
      .faq-item__question input {
        flex: 1;
        border: none;
        background: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        outline: none;
      }
      .faq-item__delete {
        background: #fee2e2;
        border: none;
        color: #dc2626;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .faq-item__delete:hover {
        background: #fecaca;
      }
      .faq-item__answer {
        padding: 15px;
        border-top: 1px solid #e2e8f0;
        display: none;
        background: white;
      }
      .faq-item__answer.open {
        display: block;
      }
      .faq-item__answer textarea {
        width: 100%;
        min-height: 80px;
        border: none;
        background: #f9fafb;
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .faq-item__answer-text {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
        white-space: pre-wrap;
      }
      .faq-add-btn {
        margin-top: 15px;
        background: white;
        border: 1px dashed #d1d5db;
        color: #6b7280;
        padding: 10px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
      }
      .faq-add-btn:hover {
        background: #f9fafb;
      }
      .faq-color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
      }
      .faq-color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
      }
      .faq-color-controls input[type="color"] {
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

  renderItems(container) {
    container.innerHTML = "";

    this.data.items.forEach((item, index) => {
      const itemEl = document.createElement("div");
      itemEl.classList.add("faq-item");
      itemEl.style.borderColor = this.data.accentColor;

      const questionEl = document.createElement("div");
      questionEl.classList.add("faq-item__question");
      questionEl.style.backgroundColor = this.data.questionBackgroundColor;

      const icon = document.createElement("span");
      icon.classList.add("faq-item__icon");
      icon.textContent = "▶";
      if (item.isOpen) {
        icon.classList.add("open");
      }
      questionEl.appendChild(icon);

      if (this.readOnly) {
        const questionText = document.createElement("span");
        questionText.classList.add("faq-item__question-text");
        questionText.textContent = item.question;
        questionText.style.color = this.data.textColor;
        questionEl.appendChild(questionText);

        questionEl.addEventListener("click", () => {
          this.data.items[index].isOpen = !this.data.items[index].isOpen;
          this.renderItems(container);
        });
      } else {
        const questionInput = document.createElement("input");
        questionInput.type = "text";
        questionInput.value = item.question;
        questionInput.placeholder = "Your question here...";
        questionInput.style.color = this.data.textColor;
        questionInput.addEventListener("input", (e) => {
          this.data.items[index].question = e.target.value;
        });
        questionEl.appendChild(questionInput);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("faq-item__delete");
        deleteBtn.textContent = "×";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.data.items.splice(index, 1);
          this.renderItems(container);
        });
        questionEl.appendChild(deleteBtn);

        icon.addEventListener("click", (e) => {
          e.stopPropagation();
          this.data.items[index].isOpen = !this.data.items[index].isOpen;
          this.renderItems(container);
        });
      }

      itemEl.appendChild(questionEl);

      const answerEl = document.createElement("div");
      answerEl.classList.add("faq-item__answer");
      answerEl.style.backgroundColor = this.data.answerBackgroundColor;
      if (item.isOpen) {
        answerEl.classList.add("open");
      }

      if (this.readOnly) {
        const answerText = document.createElement("div");
        answerText.classList.add("faq-item__answer-text");
        answerText.textContent = item.answer;
        answerText.style.color = this.data.textColor;
        answerEl.appendChild(answerText);
      } else {
        const answerTextarea = document.createElement("textarea");
        answerTextarea.placeholder = "Your answer here...";
        answerTextarea.value = item.answer;
        answerTextarea.style.color = this.data.textColor;
        answerTextarea.addEventListener("input", (e) => {
          this.data.items[index].answer = e.target.value;
        });
        answerEl.appendChild(answerTextarea);
      }

      itemEl.appendChild(answerEl);
      container.appendChild(itemEl);
    });
  }

  save() {
    return this.data;
  }
}
