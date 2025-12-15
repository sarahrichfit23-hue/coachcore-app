/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * ChecklistCardTool for EditorJS - creates a checklist with due dates
 */
export default class ChecklistCardTool {
  static get toolbox() {
    return {
      title: "Checklist Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      title: data.title || "Checklist",
      items: data.items || [],
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("checklist-card-tool");

    const card = document.createElement("div");
    card.classList.add("checklist-card");

    const header = document.createElement("div");
    header.classList.add("checklist-card__header");

    const icon = document.createElement("span");
    icon.textContent = "📋";
    icon.style.marginRight = "8px";
    header.appendChild(icon);

    if (this.readOnly) {
      const title = document.createElement("span");
      title.textContent = this.data.title;
      header.appendChild(title);
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.title;
      titleInput.placeholder = "Checklist title...";
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      header.appendChild(titleInput);
    }

    card.appendChild(header);

    const itemsContainer = document.createElement("div");
    itemsContainer.classList.add("checklist-card__items");
    this.renderItems(itemsContainer);
    card.appendChild(itemsContainer);

    if (!this.readOnly) {
      const addBtn = document.createElement("button");
      addBtn.classList.add("checklist-card__add-btn");
      addBtn.textContent = "+ Add Item";
      addBtn.addEventListener("click", () => {
        this.data.items.push({
          text: "",
          checked: false,
          date: "",
        });
        this.renderItems(itemsContainer);
      });
      card.appendChild(addBtn);
    }

    this.wrapper.appendChild(card);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .checklist-card-tool {
        margin: 20px 0;
      }
      .checklist-card {
        background: #fef9f3;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        padding: 20px;
      }
      .checklist-card__header {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 15px;
      }
      .checklist-card__header input {
        border: none;
        background: transparent;
        font-weight: 600;
        font-size: 16px;
        outline: none;
        flex: 1;
      }
      .checklist-card__items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .checklist-card__item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .checklist-card__item input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      .checklist-card__item input[type="text"] {
        flex: 1;
        border: none;
        background: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 14px;
        outline: none;
      }
      .checklist-card__item input[type="text"].readonly {
        background: transparent;
      }
      .checklist-card__item-date {
        font-size: 12px;
        color: #9ca3af;
        min-width: 100px;
        text-align: right;
      }
      .checklist-card__item input[type="date"] {
        border: none;
        background: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        outline: none;
      }
      .checklist-card__item-delete {
        background: #fee2e2;
        border: none;
        color: #dc2626;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .checklist-card__item-delete:hover {
        background: #fecaca;
      }
      .checklist-card__add-btn {
        margin-top: 12px;
        background: white;
        border: 1px dashed #d1d5db;
        color: #6b7280;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
      }
      .checklist-card__add-btn:hover {
        background: #f9fafb;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  renderItems(container) {
    container.innerHTML = "";

    this.data.items.forEach((item, index) => {
      const itemEl = document.createElement("div");
      itemEl.classList.add("checklist-card__item");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.checked;
      if (!this.readOnly) {
        checkbox.addEventListener("change", (e) => {
          this.data.items[index].checked = e.target.checked;
        });
      } else {
        checkbox.disabled = true;
      }
      itemEl.appendChild(checkbox);

      if (this.readOnly) {
        const text = document.createElement("input");
        text.type = "text";
        text.value = item.text;
        text.classList.add("readonly");
        text.readOnly = true;
        itemEl.appendChild(text);

        const date = document.createElement("span");
        date.classList.add("checklist-card__item-date");
        date.textContent = item.date || "";
        itemEl.appendChild(date);
      } else {
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = item.text;
        textInput.placeholder = "Item description...";
        textInput.addEventListener("input", (e) => {
          this.data.items[index].text = e.target.value;
        });
        itemEl.appendChild(textInput);

        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.value = item.date || "";
        dateInput.addEventListener("input", (e) => {
          this.data.items[index].date = e.target.value;
        });
        itemEl.appendChild(dateInput);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("checklist-card__item-delete");
        deleteBtn.textContent = "×";
        deleteBtn.addEventListener("click", () => {
          this.data.items.splice(index, 1);
          this.renderItems(container);
        });
        itemEl.appendChild(deleteBtn);
      }

      container.appendChild(itemEl);
    });
  }

  save() {
    return this.data;
  }
}
