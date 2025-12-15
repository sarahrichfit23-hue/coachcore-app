/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * GetStartedTool for EditorJS - combines profile intro and checklist side-by-side
 */
export default class GetStartedTool {
  static get toolbox() {
    return {
      title: "Get Started",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" fill="none" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly, config }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};
    this.data = {
      profileTitle: data.profileTitle || "LET'S GET STARTED",
      imageUrl: data.imageUrl || "",
      coachName: data.coachName || "",
      heading: data.heading || "",
      content: data.content || "",
      checklistTitle: data.checklistTitle || "ONBOARDING CHECKLIST",
      items: data.items || [],
      profileBgColor: data.profileBgColor || "#ffffff",
      checklistBgColor: data.checklistBgColor || "#ffffff",
      textColor: data.textColor || "#1f2937",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("get-started-tool");

    const container = document.createElement("div");
    container.classList.add("get-started-container");

    // LEFT SIDE - Profile Card
    const profileCard = document.createElement("div");
    profileCard.classList.add("get-started__profile");
    profileCard.style.backgroundColor = this.data.profileBgColor;
    profileCard.style.color = this.data.textColor;

    // Profile header
    const profileHeader = document.createElement("div");
    profileHeader.classList.add("get-started__header");
    profileHeader.innerHTML = '<span class="get-started__bullet">●</span>';

    const profileHeaderText = document.createElement("span");
    profileHeaderText.classList.add("get-started__header-text");
    profileHeaderText.style.color = this.data.textColor;

    if (this.readOnly) {
      profileHeaderText.textContent = this.data.profileTitle;
    } else {
      const profileTitleInput = document.createElement("input");
      profileTitleInput.type = "text";
      profileTitleInput.placeholder = "Profile title";
      profileTitleInput.value = this.data.profileTitle;
      profileTitleInput.style.color = this.data.textColor;
      profileTitleInput.addEventListener("input", (e) => {
        this.data.profileTitle = e.target.value;
      });
      profileHeaderText.appendChild(profileTitleInput);
    }
    profileHeader.appendChild(profileHeaderText);
    profileCard.appendChild(profileHeader);

    // Image and name section
    const profileSection = document.createElement("div");
    profileSection.classList.add("get-started__profile-section");

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("get-started__image-container");

    if (!this.readOnly) {
      const imageInput = document.createElement("input");
      imageInput.type = "file";
      imageInput.accept = "image/*";
      imageInput.style.display = "none";
      imageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const existingImg = imageContainer.querySelector(".get-started__image");
        if (existingImg) {
          existingImg.style.opacity = "0.5";
        }

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/file/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (result.success && result.url) {
            this.data.imageUrl = result.url;
            this.renderImage(imageContainer);
            uploadBtn.style.display = "block";
            imageContainer.style.cursor = "default";
          } else {
            console.error("Upload failed:", result.error);
            alert(
              "Failed to upload image: " + (result.error || "Unknown error")
            );
            if (existingImg) {
              existingImg.style.opacity = "1";
            }
          }
        } catch (error) {
          console.error("Upload error:", error);
          alert("Failed to upload image. Please try again.");
          if (existingImg) {
            existingImg.style.opacity = "1";
          }
        }
      });

      const uploadBtn = document.createElement("button");
      uploadBtn.classList.add("get-started__upload-btn");
      uploadBtn.textContent = "Change";
      uploadBtn.style.display = this.data.imageUrl ? "block" : "none";
      uploadBtn.addEventListener("click", () => imageInput.click());

      imageContainer.appendChild(imageInput);
      imageContainer.appendChild(uploadBtn);

      if (!this.data.imageUrl) {
        imageContainer.style.cursor = "pointer";
        imageContainer.addEventListener("click", (e) => {
          if (e.target !== imageInput) {
            imageInput.click();
          }
        });
      }
    }

    this.renderImage(imageContainer);
    profileSection.appendChild(imageContainer);

    // Coach name
    const nameContainer = document.createElement("div");
    nameContainer.classList.add("get-started__name-container");

    if (this.readOnly) {
      if (this.data.coachName) {
        const name = document.createElement("div");
        name.classList.add("get-started__name");
        name.textContent = this.data.coachName;
        nameContainer.appendChild(name);
      }
    } else {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Coach Name";
      nameInput.value = this.data.coachName;
      nameInput.classList.add("get-started__name-input");
      nameInput.style.color = this.data.textColor;
      nameInput.addEventListener("input", (e) => {
        this.data.coachName = e.target.value;
      });
      nameContainer.appendChild(nameInput);
    }

    profileSection.appendChild(nameContainer);
    profileCard.appendChild(profileSection);

    // Welcome heading
    const headingEl = document.createElement("div");
    headingEl.classList.add("get-started__heading");
    headingEl.style.color = this.data.textColor;

    if (this.readOnly) {
      headingEl.textContent = this.data.heading;
    } else {
      const headingInput = document.createElement("input");
      headingInput.type = "text";
      headingInput.placeholder = "Welcome heading";
      headingInput.value = this.data.heading;
      headingInput.style.color = this.data.textColor;
      headingInput.addEventListener("input", (e) => {
        this.data.heading = e.target.value;
      });
      headingEl.appendChild(headingInput);
    }
    profileCard.appendChild(headingEl);

    // Content
    const contentEl = document.createElement("div");
    contentEl.classList.add("get-started__content");
    contentEl.style.color = this.data.textColor;

    if (this.readOnly) {
      contentEl.textContent = this.data.content;
    } else {
      const contentTextarea = document.createElement("textarea");
      contentTextarea.placeholder = "Welcome message...";
      contentTextarea.value = this.data.content;
      contentTextarea.style.color = this.data.textColor;
      contentTextarea.addEventListener("input", (e) => {
        this.data.content = e.target.value;
      });
      contentEl.appendChild(contentTextarea);
    }
    profileCard.appendChild(contentEl);

    container.appendChild(profileCard);

    // RIGHT SIDE - Checklist Card
    const checklistCard = document.createElement("div");
    checklistCard.classList.add("get-started__checklist");
    checklistCard.style.backgroundColor = this.data.checklistBgColor;
    checklistCard.style.color = this.data.textColor;

    // Checklist header
    const checklistHeader = document.createElement("div");
    checklistHeader.classList.add("get-started__header");
    checklistHeader.innerHTML = '<span class="get-started__bullet">●</span>';

    const checklistHeaderText = document.createElement("span");
    checklistHeaderText.classList.add("get-started__header-text");
    checklistHeaderText.style.color = this.data.textColor;

    if (this.readOnly) {
      checklistHeaderText.textContent = this.data.checklistTitle;
    } else {
      const checklistTitleInput = document.createElement("input");
      checklistTitleInput.type = "text";
      checklistTitleInput.placeholder = "Checklist title";
      checklistTitleInput.value = this.data.checklistTitle;
      checklistTitleInput.style.color = this.data.textColor;
      checklistTitleInput.addEventListener("input", (e) => {
        this.data.checklistTitle = e.target.value;
      });
      checklistHeaderText.appendChild(checklistTitleInput);
    }
    checklistHeader.appendChild(checklistHeaderText);
    checklistCard.appendChild(checklistHeader);

    // Checklist items
    const itemsContainer = document.createElement("div");
    itemsContainer.classList.add("get-started__items");
    this.renderItems(itemsContainer);
    checklistCard.appendChild(itemsContainer);

    if (!this.readOnly) {
      const addBtn = document.createElement("button");
      addBtn.classList.add("get-started__add-btn");
      addBtn.textContent = "+ Add Item";
      addBtn.addEventListener("click", () => {
        this.data.items.push({
          text: "",
          checked: false,
          date: "",
        });
        this.renderItems(itemsContainer);
      });
      checklistCard.appendChild(addBtn);
    }

    container.appendChild(checklistCard);
    this.wrapper.appendChild(container);

    // Color controls
    if (!this.readOnly) {
      const colorControls = document.createElement("div");
      colorControls.classList.add("get-started__color-controls");

      const profileBgLabel = document.createElement("label");
      profileBgLabel.textContent = "Profile BG:";
      const profileBgInput = document.createElement("input");
      profileBgInput.type = "color";
      profileBgInput.value = this.data.profileBgColor;
      profileBgInput.addEventListener("input", (e) => {
        this.data.profileBgColor = e.target.value;
        profileCard.style.backgroundColor = e.target.value;
      });

      const checklistBgLabel = document.createElement("label");
      checklistBgLabel.textContent = "Checklist BG:";
      const checklistBgInput = document.createElement("input");
      checklistBgInput.type = "color";
      checklistBgInput.value = this.data.checklistBgColor;
      checklistBgInput.addEventListener("input", (e) => {
        this.data.checklistBgColor = e.target.value;
        checklistCard.style.backgroundColor = e.target.value;
      });

      const textLabel = document.createElement("label");
      textLabel.textContent = "Text:";
      const textInput = document.createElement("input");
      textInput.type = "color";
      textInput.value = this.data.textColor;
      textInput.addEventListener("input", (e) => {
        this.data.textColor = e.target.value;
        profileCard.style.color = e.target.value;
        checklistCard.style.color = e.target.value;
        profileHeaderText.style.color = e.target.value;
        checklistHeaderText.style.color = e.target.value;
        headingEl.style.color = e.target.value;
        contentEl.style.color = e.target.value;
        if (profileHeaderText.querySelector("input")) {
          profileHeaderText.querySelector("input").style.color = e.target.value;
        }
        if (checklistHeaderText.querySelector("input")) {
          checklistHeaderText.querySelector("input").style.color =
            e.target.value;
        }
        if (headingEl.querySelector("input")) {
          headingEl.querySelector("input").style.color = e.target.value;
        }
        if (contentEl.querySelector("textarea")) {
          contentEl.querySelector("textarea").style.color = e.target.value;
        }
        if (nameInput) {
          nameInput.style.color = e.target.value;
        }
      });

      colorControls.appendChild(profileBgLabel);
      colorControls.appendChild(profileBgInput);
      colorControls.appendChild(checklistBgLabel);
      colorControls.appendChild(checklistBgInput);
      colorControls.appendChild(textLabel);
      colorControls.appendChild(textInput);
      this.wrapper.appendChild(colorControls);
    }

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .get-started-tool {
        margin: 20px 0;
      }
      .get-started-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 768px) {
        .get-started-container {
          grid-template-columns: 1fr;
        }
      }
      .get-started__profile,
      .get-started__checklist {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .get-started__header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 28px;
      }
      .get-started__bullet {
        color: #10b981;
        font-size: 16px;
        line-height: 1;
      }
      .get-started__header-text {
        font-weight: 700;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex: 1;
      }
      .get-started__header-text input {
        width: 100%;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 6px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
        outline: none;
      }
      .get-started__profile-section {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 28px;
      }
      .get-started__image-container {
        position: relative;
        flex-shrink: 0;
      }
      .get-started__image {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #f3f4f6;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .get-started__placeholder {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 3px dashed #d1d5db;
        background: rgba(0, 0, 0, 0.02);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
      }
      .get-started__placeholder:hover {
        background: rgba(0, 0, 0, 0.04);
        border-color: #9ca3af;
      }
      .get-started__upload-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        background: white;
        border: 2px solid #e2e8f0;
        padding: 4px 10px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .get-started__upload-btn:hover {
        background: #f9fafb;
      }
      .get-started__name-container {
        flex: 1;
      }
      .get-started__name {
        font-style: italic;
        font-size: 26px;
        font-weight: 500;
        line-height: 1.2;
      }
      .get-started__name-input {
        width: 100%;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 26px;
        font-style: italic;
        font-weight: 500;
        outline: none;
      }
      .get-started__heading {
        font-weight: 700;
        font-size: 22px;
        line-height: 1.3;
        margin-bottom: 20px;
      }
      .get-started__heading input {
        width: 100%;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 10px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 22px;
        outline: none;
      }
      .get-started__content {
        font-size: 15px;
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .get-started__content textarea {
        width: 100%;
        min-height: 200px;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 12px 14px;
        border-radius: 6px;
        font-size: 15px;
        line-height: 1.7;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .get-started__items {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .get-started__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      .get-started__item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .get-started__item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        margin-top: 2px;
        flex-shrink: 0;
        accent-color: #10b981;
      }
      .get-started__item-content {
        flex: 1;
        display: flex;
        flex-direction: row;
        gap: 6px;
      }
      .get-started__item input[type="text"] {
        width: 100%;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 15px;
        outline: none;
      }
      .get-started__item input[type="text"].readonly {
        background: transparent;
        padding: 0;
      }
      .get-started__item-date {
        font-size: 13px;
        color: #9ca3af;
        text-align: right;
        width: -webkit-fill-available;
      }
      .get-started__item input[type="date"] {
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 13px;
        outline: none;
      }
      .get-started__item-delete {
        background: #fee2e2;
        border: none;
        color: #dc2626;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .get-started__item-delete:hover {
        background: #fecaca;
      }
      .get-started__add-btn {
        margin-top: 16px;
        background: rgba(0, 0, 0, 0.03);
        border: 1px dashed #d1d5db;
        color: #6b7280;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        width: 100%;
      }
      .get-started__add-btn:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .get-started__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
      }
      .get-started__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
      }
      .get-started__color-controls input[type="color"] {
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

  renderImage(container) {
    const existingImage = container.querySelector(".get-started__image");
    const existingPlaceholder = container.querySelector(
      ".get-started__placeholder"
    );

    if (existingImage) {
      existingImage.remove();
    }
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }

    if (this.data.imageUrl) {
      const img = document.createElement("img");
      img.src = this.data.imageUrl;
      img.classList.add("get-started__image");
      img.alt = this.data.coachName || "Profile";
      container.insertBefore(img, container.firstChild);
    } else if (!this.readOnly) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("get-started__placeholder");
      placeholder.textContent = "Upload";
      container.insertBefore(placeholder, container.firstChild);
    }
  }

  renderItems(container) {
    container.innerHTML = "";

    this.data.items.forEach((item, index) => {
      const itemEl = document.createElement("div");
      itemEl.classList.add("get-started__item");

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

      const itemContent = document.createElement("div");
      itemContent.classList.add("get-started__item-content");

      if (this.readOnly) {
        const text = document.createElement("input");
        text.type = "text";
        text.value = item.text;
        text.classList.add("readonly");
        text.readOnly = true;
        itemContent.appendChild(text);

        const date = document.createElement("div");
        date.classList.add("get-started__item-date");
        date.textContent = item.date || "";
        itemContent.appendChild(date);
      } else {
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = item.text;
        textInput.placeholder = "Item description...";
        textInput.addEventListener("input", (e) => {
          this.data.items[index].text = e.target.value;
        });
        itemContent.appendChild(textInput);

        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.value = item.date || "";
        dateInput.addEventListener("input", (e) => {
          this.data.items[index].date = e.target.value;
        });
        itemContent.appendChild(dateInput);
      }

      itemEl.appendChild(itemContent);

      if (!this.readOnly) {
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("get-started__item-delete");
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
