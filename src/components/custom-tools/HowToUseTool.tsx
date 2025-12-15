/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * HowToUseTool for EditorJS - creates a video tutorial section with info cards
 */
export default class HowToUseTool {
  static get toolbox() {
    return {
      title: "How To Use",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><path d="M11 10h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly, config }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};

    // Lucide icon SVG paths
    this.iconSvgs = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', // Lock
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', // MessageSquare
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>', // Bell
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>', // RefreshCw
    ];

    this.data = {
      videoTitle: data.videoTitle || "VIDEO TUTORIAL",
      videoDescription:
        data.videoDescription ||
        "Take some time to explore and familiarize yourself with the layout and features of the client portal.",
      videoUrl: data.videoUrl || "",
      userGuideText: data.userGuideText || "User Guide",
      videoBackgroundColor: data.videoBackgroundColor || "#ffffff",
      videoTextColor: data.videoTextColor || "#1f2937",
      cards: data.cards || [
        {
          icon: "🔒",
          title: "PRIVACY",
          description:
            "Your client portal in Notion is private and secure. Only you and I have access to the information within your workspace.",
          backgroundColor: "#fef2f2",
          textColor: "#1f2937",
        },
        {
          icon: "💬",
          title: "COMMUNICATION",
          description:
            "We will communicate in Notion. You can leave comments, ask questions, or share updates in the Message Center. This ensures clear and efficient communication throughout our coaching journey.",
          backgroundColor: "#fdf2f8",
          textColor: "#1f2937",
        },
        {
          icon: "🔔",
          title: "SET UP NOTIFICATIONS",
          description:
            "Enable notifications or reminders within Notion to stay updated on any new messages, upcoming sessions, or important announcements.",
          backgroundColor: "#fff7ed",
          textColor: "#1f2937",
        },
        {
          icon: "🔄",
          title: "REGULAR CHECK-INS",
          description:
            "Make it a habit to regularly check your client portal for any updates or new materials. Consistent engagement will help you make the most of the coaching experience.",
          backgroundColor: "#fef2f2",
          textColor: "#1f2937",
        },
      ],
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("how-to-use-tool");

    // Main container with 2 columns
    const container = document.createElement("div");
    container.classList.add("how-to-use-container");

    // Left column - Video section
    const leftColumn = document.createElement("div");
    leftColumn.classList.add("how-to-use-left");

    const videoCard = document.createElement("div");
    videoCard.classList.add("video-card");
    videoCard.style.backgroundColor = this.data.videoBackgroundColor;
    videoCard.style.color = this.data.videoTextColor;

    // Video title with icon
    const videoHeader = document.createElement("div");
    videoHeader.classList.add("video-card__header");
    const videoIconSpan = document.createElement("span");
    videoIconSpan.classList.add("video-card__icon");
    videoIconSpan.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>';
    const videoSvg = videoIconSpan.querySelector("svg");
    if (videoSvg) {
      videoSvg.style.stroke = this.data.videoTextColor;
    }
    videoHeader.appendChild(videoIconSpan);

    const videoTitleEl = document.createElement("span");
    videoTitleEl.classList.add("video-card__title");

    if (this.readOnly) {
      videoTitleEl.textContent = this.data.videoTitle;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.videoTitle;
      titleInput.placeholder = "Video title...";
      titleInput.addEventListener("input", (e) => {
        this.data.videoTitle = e.target.value;
        if (this.api && this.api.blocks) {
          this.api.blocks.save();
        }
      });
      videoTitleEl.appendChild(titleInput);
    }
    videoHeader.appendChild(videoTitleEl);
    videoCard.appendChild(videoHeader);

    // Video description
    const videoDesc = document.createElement("div");
    videoDesc.classList.add("video-card__description");

    if (this.readOnly) {
      videoDesc.textContent = this.data.videoDescription;
    } else {
      const descTextarea = document.createElement("textarea");
      descTextarea.value = this.data.videoDescription;
      descTextarea.placeholder = "Video description...";
      descTextarea.addEventListener("input", (e) => {
        this.data.videoDescription = e.target.value;
      });
      videoDesc.appendChild(descTextarea);
    }
    videoCard.appendChild(videoDesc);

    // User Guide label
    const userGuide = document.createElement("div");
    userGuide.classList.add("video-card__user-guide");

    if (this.readOnly) {
      const bookIconSpan = document.createElement("span");
      bookIconSpan.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
      const bookSvg = bookIconSpan.querySelector("svg");
      if (bookSvg) {
        bookSvg.style.stroke = this.data.videoTextColor;
      }
      userGuide.appendChild(bookIconSpan);
      const textNode = document.createTextNode(this.data.userGuideText);
      userGuide.appendChild(textNode);
    } else {
      const bookIconSpan = document.createElement("span");
      bookIconSpan.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
      const bookSvg = bookIconSpan.querySelector("svg");
      if (bookSvg) {
        bookSvg.style.stroke = this.data.videoTextColor;
      }
      userGuide.appendChild(bookIconSpan);
      const guideInput = document.createElement("input");
      guideInput.type = "text";
      guideInput.value = this.data.userGuideText;
      guideInput.placeholder = "User guide text...";
      guideInput.addEventListener("input", (e) => {
        this.data.userGuideText = e.target.value;
        if (this.api && this.api.blocks) {
          this.api.blocks.save();
        }
      });
      userGuide.appendChild(guideInput);
    }
    videoCard.appendChild(userGuide);

    // Video embed/placeholder
    const videoContainer = document.createElement("div");
    videoContainer.classList.add("video-card__video");

    if (this.data.videoUrl && this.readOnly) {
      const iframe = document.createElement("iframe");
      iframe.src = this.data.videoUrl.replace("watch?v=", "embed/");
      iframe.allowFullscreen = true;
      iframe.frameBorder = "0";
      videoContainer.appendChild(iframe);
    } else if (!this.readOnly) {
      const urlInput = document.createElement("input");
      urlInput.type = "url";
      urlInput.value = this.data.videoUrl;
      urlInput.placeholder = "YouTube video URL...";
      urlInput.classList.add("video-url-input");
      urlInput.addEventListener("input", (e) => {
        this.data.videoUrl = e.target.value;
      });
      videoContainer.appendChild(urlInput);
    } else {
      videoContainer.innerHTML =
        '<div class="video-placeholder">📹 Video will appear here</div>';
    }
    videoCard.appendChild(videoContainer);

    // Color controls for video card (edit mode only)
    if (!this.readOnly) {
      const videoColorControls = document.createElement("div");
      videoColorControls.classList.add("video-card__color-controls");

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "BG:";
      const bgInput = document.createElement("input");
      bgInput.type = "color";
      bgInput.value = this.data.videoBackgroundColor;
      bgInput.addEventListener("input", (e) => {
        this.data.videoBackgroundColor = e.target.value;
        videoCard.style.backgroundColor = e.target.value;
      });

      const textLabel = document.createElement("label");
      textLabel.textContent = "Text:";
      const textInput = document.createElement("input");
      textInput.type = "color";
      textInput.value = this.data.videoTextColor;
      textInput.addEventListener("input", (e) => {
        this.data.videoTextColor = e.target.value;
        videoCard.style.color = e.target.value;
        videoTitleEl.style.color = e.target.value;
        videoDesc.style.color = e.target.value;
        userGuide.style.color = e.target.value;

        // Update video icon color
        const videoSvg = videoIconSpan.querySelector("svg");
        if (videoSvg) {
          videoSvg.style.stroke = e.target.value;
        }

        if (videoTitleEl.querySelector("input")) {
          videoTitleEl.querySelector("input").style.color = e.target.value;
        }
        if (videoDesc.querySelector("textarea")) {
          videoDesc.querySelector("textarea").style.color = e.target.value;
        }
        if (userGuide.querySelector("input")) {
          userGuide.querySelector("input").style.color = e.target.value;
        }
      });

      videoColorControls.appendChild(bgLabel);
      videoColorControls.appendChild(bgInput);
      videoColorControls.appendChild(textLabel);
      videoColorControls.appendChild(textInput);
      videoCard.appendChild(videoColorControls);
    }

    leftColumn.appendChild(videoCard);
    container.appendChild(leftColumn);

    // Right column - Info cards (editable)
    const rightColumn = document.createElement("div");
    rightColumn.classList.add("how-to-use-right");

    this.data.cards.forEach((cardData, index) => {
      const infoCard = document.createElement("div");
      infoCard.classList.add("how-to-use");
      infoCard.style.backgroundColor = cardData.backgroundColor;
      infoCard.style.color = cardData.textColor;

      // Icon - using Lucide icon SVG based on index
      const iconEl = document.createElement("div");
      iconEl.classList.add("how-to-use__icon");
      iconEl.innerHTML = this.iconSvgs[index];
      const svg = iconEl.querySelector("svg");
      if (svg) {
        svg.style.color = cardData.textColor;
        svg.style.stroke = cardData.textColor;
      }

      // Content
      const content = document.createElement("div");
      content.classList.add("how-to-use__content");

      // Title
      const title = document.createElement("div");
      title.classList.add("how-to-use__title");
      title.style.color = cardData.textColor;

      if (this.readOnly) {
        title.textContent = cardData.title;
      } else {
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.value = cardData.title;
        titleInput.style.color = cardData.textColor;
        titleInput.addEventListener("input", (e) => {
          this.data.cards[index].title = e.target.value;
        });
        title.appendChild(titleInput);
      }

      // Description
      const description = document.createElement("div");
      description.classList.add("how-to-use__description");
      description.style.color = cardData.textColor;

      if (this.readOnly) {
        description.textContent = cardData.description;
      } else {
        const descTextarea = document.createElement("textarea");
        descTextarea.value = cardData.description;
        descTextarea.style.color = cardData.textColor;
        descTextarea.addEventListener("input", (e) => {
          this.data.cards[index].description = e.target.value;
        });
        description.appendChild(descTextarea);
      }

      content.appendChild(title);
      content.appendChild(description);

      // Color controls (edit mode only)
      if (!this.readOnly) {
        const colorControls = document.createElement("div");
        colorControls.classList.add("how-to-use__color-controls");

        const bgLabel = document.createElement("label");
        bgLabel.textContent = "BG:";
        const bgInput = document.createElement("input");
        bgInput.type = "color";
        bgInput.value = cardData.backgroundColor;
        bgInput.addEventListener("input", (e) => {
          this.data.cards[index].backgroundColor = e.target.value;
          infoCard.style.backgroundColor = e.target.value;
        });

        const textLabel = document.createElement("label");
        textLabel.textContent = "Text:";
        const textInput = document.createElement("input");
        textInput.type = "color";
        textInput.value = cardData.textColor;
        textInput.addEventListener("input", (e) => {
          this.data.cards[index].textColor = e.target.value;
          infoCard.style.color = e.target.value;
          title.style.color = e.target.value;
          description.style.color = e.target.value;
          if (title.querySelector("input")) {
            title.querySelector("input").style.color = e.target.value;
          }
          if (description.querySelector("textarea")) {
            description.querySelector("textarea").style.color = e.target.value;
          }
        });

        colorControls.appendChild(bgLabel);
        colorControls.appendChild(bgInput);
        colorControls.appendChild(textLabel);
        colorControls.appendChild(textInput);
        content.appendChild(colorControls);
      }

      infoCard.appendChild(iconEl);
      infoCard.appendChild(content);
      rightColumn.appendChild(infoCard);
    });

    container.appendChild(rightColumn);
    this.wrapper.appendChild(container);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .how-to-use-tool {
        margin: 20px 0;
      }
      .how-to-use-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 768px) {
        .how-to-use-container {
          grid-template-columns: 1fr;
        }
      }
      
      /* Video Card - Left */
      .video-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
      }
      .video-card__header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .video-card__icon {
        font-size: 24px;
      }
      .video-card__title {
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #1f2937;
      }
      .video-card__title input {
        border: none;
        background: #f9fafb;
        padding: 6px 10px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
        width: 100%;
      }
      .video-card__description {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: 20px;
      }
      .video-card__description textarea {
        width: 100%;
        min-height: 80px;
        border: 1px solid #e2e8f0;
        background: #f9fafb;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .video-card__user-guide {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 12px;
        color: #1f2937;
      }
      .video-card__user-guide input {
        border: none;
        background: #f9fafb;
        padding: 6px 10px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
        outline: none;
        width: 100%;
      }
      .video-card__video {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        background: #f3f4f6;
        min-height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .video-card__video iframe {
        width: 100%;
        height: 300px;
        border: none;
      }
      .video-url-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
      }
      .video-placeholder {
        font-size: 18px;
        color: #9ca3af;
      }
      .video-card__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }
      .video-card__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .video-card__color-controls input[type="color"] {
        width: 35px;
        height: 25px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
      
      /* Info Cards - Right */
      .how-to-use-right {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .how-to-use {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        gap: 14px;
      }
      .how-to-use__icon {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
      }
      .how-to-use__icon-input {
        font-size: 24px;
        width: 50px;
        text-align: center;
        border: 1px dashed #d1d5db;
        background: rgba(255, 255, 255, 0.3);
        padding: 4px;
        border-radius: 4px;
        outline: none;
      }
      .how-to-use__content {
        flex: 1;
      }
      .how-to-use__title {
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .how-to-use__title input {
        width: 100%;
        border: none;
        background: rgba(255, 255, 255, 0.3);
        padding: 6px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        outline: none;
      }
      .how-to-use__description {
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 10px;
      }
      .how-to-use__description textarea {
        width: 100%;
        min-height: 60px;
        border: none;
        background: rgba(255, 255, 255, 0.3);
        padding: 8px;
        border-radius: 4px;
        font-size: 13px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        font-family: inherit;
      }
      .how-to-use__color-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }
      .how-to-use__color-controls label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .how-to-use__color-controls input[type="color"] {
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

  save() {
    return this.data;
  }
}
