/**
 * Reusable icon renderer for EditorJS custom tools
 * Handles dynamic icon search and rendering with Lucide React icons
 */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { findIcon } from "./icon-map";

/**
 * Creates an icon element with dynamic search functionality
 * @param {Object} options - Configuration options
 * @param {string} options.iconName - Initial icon name
 * @param {string} options.color - Icon color
 * @param {boolean} options.readOnly - Whether in read-only mode
 * @param {Function} options.onChange - Callback when icon name changes
 * @returns {HTMLElement} The icon container element
 */
export function createIconElement({
  iconName = "info",
  color = "#1f2937",
  readOnly = false,
  onChange = null,
  size = 20,
  strokeWidth = 2,
}) {
  const iconEl = document.createElement("div");
  iconEl.classList.add("editorjs-icon-container");

  if (readOnly) {
    // Read-only mode: just render the icon
    const IconComponent = findIcon(iconName);
    if (IconComponent) {
      try {
        const iconSvg = renderToString(
          createElement(IconComponent, {
            size: size,
            strokeWidth: strokeWidth,
            color: color,
          })
        );
        iconEl.innerHTML = iconSvg;
      } catch (err) {
        console.error("Icon render error:", err);
      }
    }
  } else {
    // Edit mode: render icon + input field
    const iconInput = document.createElement("input");
    iconInput.type = "text";
    iconInput.value = iconName;
    iconInput.placeholder = "icon name...";
    iconInput.classList.add("editorjs-icon-input");

    const updateIcon = (newIconName: any) => {
      const IconComponent = findIcon(newIconName);

      // Clear previous icon
      const existingIcon = iconEl.querySelector("svg");
      if (existingIcon) existingIcon.remove();

      // Render new icon if found
      if (IconComponent) {
        try {
          const iconSvg = renderToString(
            createElement(IconComponent, {
              size: 20,
              strokeWidth: 2,
              color: color,
            })
          );
          iconEl.insertAdjacentHTML("afterbegin", iconSvg);
        } catch (err) {
          console.error("Icon render error:", err);
        }
      }

      // Call onChange callback if provided
      if (onChange) {
        onChange(newIconName);
      }
    };

    iconInput.addEventListener("input", (e) => {
      updateIcon(e.target.value);
    });

    iconInput.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && iconInput.value === "") {
        const existingIcon = iconEl.querySelector("svg");
        if (existingIcon) existingIcon.remove();
        if (onChange) {
          onChange("");
        }
      }
    });

    // Initial icon render
    updateIcon(iconName);

    iconEl.appendChild(iconInput);
  }

  return iconEl;
}

/**
 * Updates the color of an icon element
 * @param {HTMLElement} iconEl - The icon container element
 * @param {string} newColor - New color for the icon
 * @param {string} iconName - Current icon name
 */
export function updateIconColor(
  iconEl: HTMLElement,
  newColor: string,
  iconName: string
) {
  const iconSvg = iconEl.querySelector("svg");
  if (iconSvg) {
    iconSvg.setAttribute("stroke", newColor);
  }

  // Re-render icon with new color if input exists
  const iconInput = iconEl.querySelector("input");
  if (iconInput && iconName) {
    const IconComponent = findIcon(iconName);
    if (IconComponent) {
      try {
        const existingIcon = iconEl.querySelector("svg");
        if (existingIcon) existingIcon.remove();
        const iconSvg = renderToString(
          createElement(IconComponent, {
            size: 20,
            strokeWidth: 2,
            color: newColor,
          })
        );
        iconEl.insertAdjacentHTML("afterbegin", iconSvg);
      } catch (err) {
        console.error("Icon color update error:", err);
      }
    }
  }
}

/**
 * Returns the CSS styles for icon elements
 * @returns {string} CSS string to inject
 */
export function getIconStyles() {
  return `
    .editorjs-icon-container {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 24px;
      height: 24px;
    }
    .editorjs-icon-container svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .editorjs-icon-input {
      font-size: 11px;
      width: 80px;
      text-align: left;
      border: 1px dashed #d1d5db;
      background: rgba(255, 255, 255, 0.5);
      padding: 2px 6px;
      border-radius: 3px;
      outline: none;
    }
    .editorjs-icon-input::placeholder {
      color: #9ca3af;
      font-size: 10px;
    }
  `;
}
