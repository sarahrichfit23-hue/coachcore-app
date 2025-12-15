/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * ProgramWorksTool for EditorJS - displays 3 feature cards with icons, text, and images
 */
export default class ProgramWorksTool {
  static get toolbox() {
    return {
      title: "Program Works",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="10" y="4" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="18" y="4" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="2" y="14" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="10" y="14" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><rect x="18" y="14" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
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
      mainTitle: data.mainTitle || "How the Program Works",
      cards: data.cards || [
        {
          title: "OVERVIEW",
          description:
            "In this revolutionary program, you'll learn how to tap into your inner strengths, overcome limitations, and create a life of fulfillment and success.",
          imageUrl: "",
        },
        {
          title: "COURSE FORMAT",
          description:
            "You have 1 month to complete each of the 6 Course Modules. Each module will delve into specific topics and provide tools, strategies, and exercises.",
          imageUrl: "",
        },
        {
          title: "COACHING SESSION",
          description:
            "Every month we will have a 1:1 coaching session for personalized guidance, support, and accountability to help you apply the course concepts to your goals.",
          imageUrl: "",
        },
      ],
      backgroundColor: data.backgroundColor || "#d8e4d3",
      cardBackgroundColor: data.cardBackgroundColor || "#ffffff",
      textColor: data.textColor || "#1f2937",
      iconColor: data.iconColor || "#10b981",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("program-works-tool");
    this.wrapper.style.backgroundColor = this.data.backgroundColor;

    const container = document.createElement("div");
    container.classList.add("program-works__container");

    // Main title
    const mainTitleEl = document.createElement("div");
    mainTitleEl.classList.add("program-works__main-title");
    mainTitleEl.style.color = this.data.textColor;

    if (this.readOnly) {
      mainTitleEl.textContent = this.data.mainTitle;
    } else {
      const mainTitleInput = document.createElement("input");
      mainTitleInput.type = "text";
      mainTitleInput.placeholder = "Main title";
      mainTitleInput.value = this.data.mainTitle;
      mainTitleInput.style.color = this.data.textColor;
      mainTitleInput.addEventListener("input", (e) => {
        this.data.mainTitle = e.target.value;
      });
      mainTitleEl.appendChild(mainTitleInput);
    }
    container.appendChild(mainTitleEl);

    // Cards container
    const cardsContainer = document.createElement("div");
    cardsContainer.classList.add("program-works__cards");

    this.data.cards.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.classList.add("program-works__card");
      cardEl.style.backgroundColor = this.data.cardBackgroundColor;

      // Hardcoded icon
      const icon = document.createElement("div");
      icon.classList.add("program-works__icon");
      icon.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="${this.data.iconColor}"/>
          <path d="M28 22 L34 30 L28 38" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      cardEl.appendChild(icon);

      // Card title
      const cardTitle = document.createElement("div");
      cardTitle.classList.add("program-works__card-title");
      cardTitle.style.color = this.data.textColor;

      if (this.readOnly) {
        cardTitle.textContent = card.title;
      } else {
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.placeholder = "Card title";
        titleInput.value = card.title;
        titleInput.style.color = this.data.textColor;
        titleInput.addEventListener("input", (e) => {
          this.data.cards[index].title = e.target.value;
        });
        cardTitle.appendChild(titleInput);
      }
      cardEl.appendChild(cardTitle);

      // Card description
      const cardDesc = document.createElement("div");
      cardDesc.classList.add("program-works__card-desc");
      cardDesc.style.color = this.data.textColor;

      if (this.readOnly) {
        cardDesc.textContent = card.description;
      } else {
        const descTextarea = document.createElement("textarea");
        descTextarea.placeholder = "Card description";
        descTextarea.value = card.description;
        descTextarea.style.color = this.data.textColor;
        descTextarea.addEventListener("input", (e) => {
          this.data.cards[index].description = e.target.value;
        });
        cardDesc.appendChild(descTextarea);
      }
      cardEl.appendChild(cardDesc);

      // Image container
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("program-works__image-container");

      if (!this.readOnly) {
        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.accept = "image/*";
        imageInput.style.display = "none";
        imageInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const existingImg = imageContainer.querySelector(
            ".program-works__image",
          );
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
              this.data.cards[index].imageUrl = result.url;
              this.renderImage(imageContainer, card.imageUrl);
              uploadBtn.style.display = card.imageUrl ? "block" : "none";
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
        uploadBtn.classList.add("program-works__upload-btn");
        uploadBtn.textContent = card.imageUrl ? "Change Image" : "Upload Image";
        uploadBtn.style.display = card.imageUrl ? "block" : "none";
        uploadBtn.addEventListener("click", () => imageInput.click());

        imageContainer.appendChild(imageInput);
        imageContainer.appendChild(uploadBtn);

        // Make container clickable when no image
        if (!card.imageUrl) {
          imageContainer.style.cursor = "pointer";
          imageContainer.addEventListener("click", (e) => {
            if (e.target !== imageInput && e.target !== uploadBtn) {
              imageInput.click();
            }
          });
        }
      }

      this.renderImage(imageContainer, card.imageUrl);
      cardEl.appendChild(imageContainer);

      cardsContainer.appendChild(cardEl);
    });

    container.appendChild(cardsContainer);
    this.wrapper.appendChild(container);

    // Color controls
    if (!this.readOnly) {
      const colorControls = document.createElement("div");
      colorControls.classList.add("program-works__color-controls");

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "BG:";
      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = this.data.backgroundColor;
      bgInput.addEventListener("input", (e) => {
        this.data.backgroundColor = e.target.value;
        this.wrapper.style.backgroundColor = e.target.value;
      });

      const cardBgLabel = document.createElement("label");
      cardBgLabel.textContent = "Card BG:";
      const cardBgInput = document.createElement("input");
      cardBgInput.type = "color";
      cardBgInput.value = this.data.cardBackgroundColor;
      cardBgInput.addEventListener("input", (e) => {
        this.data.cardBackgroundColor = e.target.value;
        const cards = this.wrapper.querySelectorAll(".program-works__card");
        cards.forEach((card) => {
          card.style.backgroundColor = e.target.value;
        });
      });

      const textLabel = document.createElement("label");
      textLabel.textContent = "Text:";
      const textInput = document.createElement("input");
      textInput.type = "color";
      textInput.value = this.data.textColor;
      textInput.addEventListener("input", (e) => {
        this.data.textColor = e.target.value;
        mainTitleEl.style.color = e.target.value;
        if (mainTitleEl.querySelector("input")) {
          mainTitleEl.querySelector("input").style.color = e.target.value;
        }
        const titles = this.wrapper.querySelectorAll(
          ".program-works__card-title",
        );
        const descs = this.wrapper.querySelectorAll(
          ".program-works__card-desc",
        );
        titles.forEach((title) => {
          title.style.color = e.target.value;
          if (title.querySelector("input")) {
            title.querySelector("input").style.color = e.target.value;
          }
        });
        descs.forEach((desc) => {
          desc.style.color = e.target.value;
          if (desc.querySelector("textarea")) {
            desc.querySelector("textarea").style.color = e.target.value;
          }
        });
      });

      const iconLabel = document.createElement("label");
      iconLabel.textContent = "Icon:";
      const iconInput = document.createElement("input");
      iconInput.type = "color";
      iconInput.value = this.data.iconColor;
      iconInput.addEventListener("input", (e) => {
        this.data.iconColor = e.target.value;
        const icons = this.wrapper.querySelectorAll(
          ".program-works__icon circle",
        );
        icons.forEach((circle) => {
          circle.setAttribute("fill", e.target.value);
        });
      });

      colorControls.appendChild(bgLabel);
      colorControls.appendChild(bgInput);
      colorControls.appendChild(cardBgLabel);
      colorControls.appendChild(cardBgInput);
      colorControls.appendChild(textLabel);
      colorControls.appendChild(textInput);
      colorControls.appendChild(iconLabel);
      colorControls.appendChild(iconInput);
      this.wrapper.appendChild(colorControls);
    }

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .program-works-tool {
        margin: 20px 0;
        padding: 48px 32px;
        border-radius: 12px;
      }
      .program-works__container {
        max-width: 1400px;
        margin: 0 auto;
      }
      .program-works__main-title {
        font-weight: 700;
        font-size: 36px;
        line-height: 1.2;
        margin-bottom: 40px;
      }
      .program-works__main-title input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.6);
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 36px;
        outline: none;
      }
      .program-works__cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      @media (max-width: 1024px) {
        .program-works__cards {
          grid-template-columns: 1fr;
        }
      }
      .program-works__card {
        background: white;
        border-radius: 16px;
        padding: 32px 28px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
      }
      .program-works__icon {
        margin-bottom: 20px;
      }
      .program-works__card-title {
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 16px;
      }
      .program-works__card-title input {
        width: 100%;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 8px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
      }
      .program-works__card-desc {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
        flex: 1;
      }
      .program-works__card-desc textarea {
        width: 100%;
        min-height: 120px;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 16px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .program-works__image-container {
        position: relative;
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.02);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .program-works__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
      }
      .program-works__placeholder {
        width: 100%;
        height: 200px;
        border: 2px dashed #d1d5db;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        background: rgba(255, 255, 255, 0.5);
      }
      .program-works__placeholder:hover {
        background: rgba(255, 255, 255, 0.8);
        border-color: #9ca3af;
      }
      .program-works__upload-btn {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: white;
        border: 2px solid #e2e8f0;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
      .program-works__upload-btn:hover {
        background: #f9fafb;
      }
      .program-works__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
      }
      .program-works__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
      }
      .program-works__color-controls input[type="color"] {
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

  renderImage(container, imageUrl) {
    const existingImage = container.querySelector(".program-works__image");
    const existingPlaceholder = container.querySelector(
      ".program-works__placeholder",
    );

    if (existingImage) {
      existingImage.remove();
    }
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }

    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.classList.add("program-works__image");
      img.alt = "Card image";
      container.insertBefore(img, container.firstChild);
    } else if (!this.readOnly) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("program-works__placeholder");
      placeholder.textContent = "Upload Image";
      container.insertBefore(placeholder, container.firstChild);
    }
  }

  save() {
    return this.data;
  }
}
