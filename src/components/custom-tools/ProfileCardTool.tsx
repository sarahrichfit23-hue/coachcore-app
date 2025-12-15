/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * ProfileCardTool for EditorJS - creates a coach/profile introduction card
 */
export default class ProfileCardTool {
  static get toolbox() {
    return {
      title: "Profile Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="currentColor" fill="none" stroke-width="2"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
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
      imageUrl: data.imageUrl || "",
      name: data.name || "",
      title: data.title || "",
      heading: data.heading || "",
      content: data.content || "",
      backgroundColor: data.backgroundColor || "#fef3c7",
      textColor: data.textColor || "#1f2937",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("profile-card-tool");

    const card = document.createElement("div");
    card.classList.add("profile-card");
    card.style.backgroundColor = this.data.backgroundColor;
    card.style.color = this.data.textColor;

    // Header with icon
    const header = document.createElement("div");
    header.classList.add("profile-card__header");
    header.innerHTML = '<span class="profile-card__icon">🔴</span>';

    const headerTitle = document.createElement("span");
    headerTitle.classList.add("profile-card__header-title");
    headerTitle.style.color = this.data.textColor;

    if (this.readOnly) {
      headerTitle.textContent = this.data.title || "LET'S GET STARTED";
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.placeholder = "Header title";
      titleInput.value = this.data.title || "LET'S GET STARTED";
      titleInput.style.color = this.data.textColor;
      titleInput.classList.add("profile-card__title-input");
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      headerTitle.appendChild(titleInput);
    }

    header.appendChild(headerTitle);
    card.appendChild(header);

    // Horizontal container for image and name
    const profileContainer = document.createElement("div");
    profileContainer.classList.add("profile-card__profile-container");

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("profile-card__image-container");

    if (!this.readOnly) {
      const imageInput = document.createElement("input");
      imageInput.type = "file";
      imageInput.accept = "image/*";
      imageInput.style.display = "none";
      imageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading state
        const existingImg = imageContainer.querySelector(
          ".profile-card__image",
        );
        if (existingImg) {
          existingImg.style.opacity = "0.5";
        }

        try {
          // Upload to API
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
              "Failed to upload image: " + (result.error || "Unknown error"),
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
      uploadBtn.classList.add("profile-card__upload-btn");
      uploadBtn.textContent = "Change";
      uploadBtn.style.display = this.data.imageUrl ? "block" : "none";
      uploadBtn.addEventListener("click", () => imageInput.click());

      imageContainer.appendChild(imageInput);
      imageContainer.appendChild(uploadBtn);

      // Make entire container clickable when no image
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
    profileContainer.appendChild(imageContainer);

    // Name beside image
    const nameContainer = document.createElement("div");
    nameContainer.classList.add("profile-card__name-container");

    if (this.readOnly) {
      if (this.data.name) {
        const name = document.createElement("div");
        name.classList.add("profile-card__name");
        name.textContent = this.data.name;
        nameContainer.appendChild(name);
      }
    } else {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Coach Name";
      nameInput.value = this.data.name;
      nameInput.classList.add("profile-card__name-input");
      nameInput.addEventListener("input", (e) => {
        this.data.name = e.target.value;
      });
      nameContainer.appendChild(nameInput);
    }

    profileContainer.appendChild(nameContainer);
    card.appendChild(profileContainer);

    // Content sections
    const content = document.createElement("div");
    content.classList.add("profile-card__content");

    // Heading
    const heading = document.createElement("div");
    heading.classList.add("profile-card__heading");
    heading.style.color = this.data.textColor;

    if (this.readOnly) {
      heading.textContent = this.data.heading;
    } else {
      const headingInput = document.createElement("input");
      headingInput.type = "text";
      headingInput.placeholder = "Welcome heading";
      headingInput.value = this.data.heading;
      headingInput.style.color = this.data.textColor;
      headingInput.addEventListener("input", (e) => {
        this.data.heading = e.target.value;
      });
      heading.appendChild(headingInput);
    }
    content.appendChild(heading);

    // Text content
    const textContent = document.createElement("div");
    textContent.classList.add("profile-card__text");
    textContent.style.color = this.data.textColor;

    if (this.readOnly) {
      textContent.textContent = this.data.content;
    } else {
      const contentTextarea = document.createElement("textarea");
      contentTextarea.placeholder = "Welcome message...";
      contentTextarea.value = this.data.content;
      contentTextarea.style.color = this.data.textColor;
      contentTextarea.addEventListener("input", (e) => {
        this.data.content = e.target.value;
      });
      textContent.appendChild(contentTextarea);
    }
    content.appendChild(textContent);

    card.appendChild(content);

    // Color controls (edit mode only)
    if (!this.readOnly) {
      const colorControls = document.createElement("div");
      colorControls.classList.add("profile-card__color-controls");

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
        headerTitle.style.color = e.target.value;
        heading.style.color = e.target.value;
        textContent.style.color = e.target.value;
        if (headerTitle.querySelector("input")) {
          headerTitle.querySelector("input").style.color = e.target.value;
        }
        if (heading.querySelector("input")) {
          heading.querySelector("input").style.color = e.target.value;
        }
        if (textContent.querySelector("textarea")) {
          textContent.querySelector("textarea").style.color = e.target.value;
        }
      });

      colorControls.appendChild(bgLabel);
      colorControls.appendChild(bgInput);
      colorControls.appendChild(textLabel);
      colorControls.appendChild(textInput);
      card.appendChild(colorControls);
    }

    this.wrapper.appendChild(card);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .profile-card-tool {
        margin: 20px 0;
      }
      .profile-card {
        background: #fef3c7;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .profile-card__header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .profile-card__icon {
        font-size: 20px;
      }
      .profile-card__header-title {
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
      }
      .profile-card__title-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 8px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
      }
      .profile-card__profile-container {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
      }
      .profile-card__image-container {
        position: relative;
        flex-shrink: 0;
      }
      .profile-card__image {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .profile-card__placeholder {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 3px dashed #d1d5db;
        background: rgba(255, 255, 255, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
      }
      .profile-card__placeholder:hover {
        background: rgba(255, 255, 255, 0.8);
        border-color: #9ca3af;
      }
      .profile-card__upload-btn {
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
      .profile-card__upload-btn:hover {
        background: #f9fafb;
      }
      .profile-card__name-container {
        flex: 1;
      }
      .profile-card__name {
        font-style: italic;
        font-size: 24px;
        font-weight: 500;
        line-height: 1.3;
      }
      .profile-card__name-input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 24px;
        font-style: italic;
        font-weight: 500;
        outline: none;
      }
      .profile-card__content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .profile-card__heading {
        font-weight: 700;
        font-size: 20px;
        line-height: 1.3;
      }
      .profile-card__heading input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 10px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 20px;
        outline: none;
      }
      .profile-card__text {
        font-size: 15px;
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .profile-card__text textarea {
        width: 100%;
        min-height: 150px;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        padding: 12px 14px;
        border-radius: 6px;
        font-size: 15px;
        line-height: 1.7;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .profile-card__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }
      .profile-card__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .profile-card__color-controls input[type="color"] {
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
    const existingImage = container.querySelector(".profile-card__image");
    const existingPlaceholder = container.querySelector(
      ".profile-card__placeholder",
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
      img.classList.add("profile-card__image");
      img.alt = this.data.name || "Profile";
      container.insertBefore(img, container.firstChild);
    } else if (!this.readOnly) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("profile-card__placeholder");
      placeholder.textContent = "Upload";
      container.insertBefore(placeholder, container.firstChild);
    }
  }

  save() {
    return this.data;
  }
}
