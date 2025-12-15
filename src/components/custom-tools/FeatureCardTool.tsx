/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * FeatureCardTool for EditorJS - creates feature cards with numbered icons and images
 */
export default class FeatureCardTool {
  static get toolbox() {
    return {
      title: "Feature Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M2 10h20" stroke="currentColor" stroke-width="2"/></svg>',
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
      number: data.number || "1",
      title: data.title || "",
      content: data.content || "",
      imageUrl: data.imageUrl || "",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("feature-card-tool");

    const card = document.createElement("div");
    card.classList.add("feature-card");

    const badge = document.createElement("div");
    badge.classList.add("feature-card__badge");

    if (this.readOnly) {
      badge.textContent = this.data.number;
    } else {
      const numberInput = document.createElement("input");
      numberInput.type = "text";
      numberInput.value = this.data.number;
      numberInput.maxLength = 2;
      numberInput.addEventListener("input", (e) => {
        this.data.number = e.target.value;
      });
      badge.appendChild(numberInput);
    }
    card.appendChild(badge);

    const content = document.createElement("div");
    content.classList.add("feature-card__content");

    const title = document.createElement("div");
    title.classList.add("feature-card__title");

    if (this.readOnly) {
      title.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.placeholder = "Feature title...";
      titleInput.value = this.data.title;
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      title.appendChild(titleInput);
    }
    content.appendChild(title);

    const text = document.createElement("div");
    text.classList.add("feature-card__text");

    if (this.readOnly) {
      text.textContent = this.data.content;
    } else {
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Feature description...";
      textarea.value = this.data.content;
      textarea.addEventListener("input", (e) => {
        this.data.content = e.target.value;
      });
      text.appendChild(textarea);
    }
    content.appendChild(text);

    card.appendChild(content);

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("feature-card__image-container");

    if (!this.readOnly) {
      const imageInput = document.createElement("input");
      imageInput.type = "file";
      imageInput.accept = "image/*";
      imageInput.style.display = "none";
      imageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file && this.config.uploader?.uploadByFile) {
          const result = await this.config.uploader.uploadByFile(file);
          if (result.success) {
            this.data.imageUrl = result.file.url;
            this.renderImage(imageContainer);
          }
        } else if (file) {
          const url = URL.createObjectURL(file);
          this.data.imageUrl = url;
          this.renderImage(imageContainer);
        }
      });

      const uploadBtn = document.createElement("button");
      uploadBtn.classList.add("feature-card__upload-btn");
      uploadBtn.textContent = this.data.imageUrl ? "Change" : "Add Image";
      uploadBtn.addEventListener("click", () => imageInput.click());

      imageContainer.appendChild(imageInput);
      imageContainer.appendChild(uploadBtn);
    }

    this.renderImage(imageContainer);
    card.appendChild(imageContainer);

    this.wrapper.appendChild(card);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .feature-card-tool {
        margin: 15px 0;
      }
      .feature-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .feature-card__badge {
        width: 40px;
        height: 40px;
        background: #fef3c7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
        color: #92400e;
      }
      .feature-card__badge input {
        width: 30px;
        text-align: center;
        border: none;
        background: transparent;
        font-weight: 600;
        font-size: 18px;
        color: #92400e;
        outline: none;
      }
      .feature-card__content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .feature-card__title {
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .feature-card__title input {
        width: 100%;
        border: none;
        background: #f9fafb;
        padding: 6px 10px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
      }
      .feature-card__text {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
        white-space: pre-wrap;
      }
      .feature-card__text textarea {
        width: 100%;
        min-height: 80px;
        border: none;
        background: #f9fafb;
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .feature-card__image-container {
        position: relative;
      }
      .feature-card__image {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 6px;
      }
      .feature-card__upload-btn {
        background: #f3f4f6;
        border: 1px dashed #d1d5db;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        width: 100%;
      }
      .feature-card__upload-btn:hover {
        background: #e5e7eb;
      }
    `;
    this.wrapper.appendChild(style);

    return this.wrapper;
  }

  renderImage(container) {
    const existingImage = container.querySelector(".feature-card__image");
    if (existingImage) {
      existingImage.remove();
    }

    if (this.data.imageUrl) {
      const img = document.createElement("img");
      img.src = this.data.imageUrl;
      img.classList.add("feature-card__image");
      img.alt = this.data.title || "Feature";
      container.insertBefore(img, container.firstChild);
    }
  }

  save() {
    return this.data;
  }
}
