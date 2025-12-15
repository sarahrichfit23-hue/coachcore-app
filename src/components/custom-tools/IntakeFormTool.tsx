/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-nocheck
/**
 * InteractiveComponentTool for EditorJS
 * Allows embedding pre-built interactive components (forms, steppers, etc.)
 */
export default class IntakeFormTool {
  static get toolbox() {
    return {
      title: "Interactive Component",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly, config }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};

    // Available component templates
    this.availableComponents = [
      { id: "intakeForm", name: "Health Coaching Intake Form", icon: "📋" },
    ];

    this.data = {
      componentType: data?.componentType || "",
      componentData: data?.componentData || {},
      componentInfo: data?.componentInfo || {},
    };
    this.wrapper = null;
  }

  static get enableLineBreaks() {
    return true;
  }

  validate(savedData) {
    // Always return true to prevent "saved data is invalid" errors
    return true;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("interactive-component-tool");

    // Add styles first
    if (!document.getElementById("interactive-component-tool-styles")) {
      const style = document.createElement("style");
      style.id = "interactive-component-tool-styles";
      style.textContent = `
      .interactive-component-tool {
        margin: 15px 0;
      }
      .component-selector {
        background: #f9fafb;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 24px;
      }
      .component-selector h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      .component-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      .component-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      .component-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      .component-card.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      .component-card-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      .component-card-name {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }
      .interactive-component-container {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 24px;
        min-height: 200px;
      }
      .component-badge {
        display: inline-block;
        background: #fffcfaff;
        color: #000000;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }
    `;
      document.head.appendChild(style);
    }

    if (this.readOnly && this.data.componentType) {
      // Read-only mode: render the actual interactive component
      this.renderInteractiveComponent();
    } else if (!this.readOnly && this.data.componentType) {
      // Edit mode with selected component: show both selector and preview
      this.renderComponentWithSelector();
    } else {
      // Edit mode: show component selector
      this.renderComponentSelector();
    }

    return this.wrapper;
  }

  renderComponentSelector() {
    const selector = document.createElement("div");
    selector.classList.add("component-selector");

    const title = document.createElement("h3");
    title.textContent = "Select an Interactive Component";
    selector.appendChild(title);

    const grid = document.createElement("div");
    grid.classList.add("component-grid");

    this.availableComponents.forEach((component) => {
      const card = document.createElement("div");
      card.classList.add("component-card");
      if (this.data.componentType === component.id) {
        card.classList.add("selected");
      }

      const icon = document.createElement("div");
      icon.classList.add("component-card-icon");
      icon.textContent = component.icon;

      const name = document.createElement("div");
      name.classList.add("component-card-name");
      name.textContent = component.name;

      card.appendChild(icon);
      card.appendChild(name);

      card.addEventListener("click", () => {
        this.data.componentType = component.id;
        this.data.componentData = this.getDefaultDataForComponent(component.id);
        // Re-render the entire wrapper
        this.wrapper.innerHTML = "";
        if (this.data.componentType) {
          this.renderComponentWithSelector();
        }
      });

      grid.appendChild(card);
    });

    selector.appendChild(grid);
    this.wrapper.appendChild(selector);
  }

  renderComponentWithSelector() {
    // Show component preview in edit mode
    const container = document.createElement("div");

    const badge = document.createElement("div");
    badge.classList.add("component-badge");
    const componentName = this.availableComponents.find(
      (c) => c.id === this.data.componentType
    )?.name;
    badge.textContent = `Selected: ${componentName || "Component"}`;
    badge.style.marginBottom = "12px";
    container.appendChild(badge);

    const changeBtn = document.createElement("button");
    changeBtn.textContent = "Change Component";
    changeBtn.style.cssText =
      "background: #6b7280; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; margin-bottom: 16px;";
    changeBtn.addEventListener("click", () => {
      this.data.componentType = "";
      this.wrapper.innerHTML = "";
      this.renderComponentSelector();
    });
    container.appendChild(changeBtn);

    const preview = document.createElement("div");
    preview.style.cssText =
      "background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px;";
    preview.innerHTML =
      "<p style='margin: 0; color: #6b7280; font-size: 14px;'>Preview: This component will be interactive when viewed in read-only mode.</p>";
    container.appendChild(preview);

    this.wrapper.appendChild(container);
  }

  renderInteractiveComponent() {
    const container = document.createElement("div");
    container.classList.add("interactive-component-container");

    const badge = document.createElement("div");
    badge.classList.add("component-badge");
    const componentName = this.availableComponents.find(
      (c) => c.id === this.data.componentType
    )?.name;
    badge.textContent = componentName || "Interactive Component";
    container.appendChild(badge);

    // Render the actual component based on type
    const componentContent = this.getComponentHTML(this.data.componentType);
    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = componentContent;
    container.appendChild(contentDiv);

    // Attach event listeners for interactivity
    this.attachComponentEvents(contentDiv, this.data.componentType);

    this.wrapper.innerHTML = "";
    this.wrapper.appendChild(container);
  }

  getDefaultDataForComponent(componentId) {
    const defaults = {
      intakeForm: {
        fields: ["fullName", "email", "phone", "height", "weight"],
      },
    };
    return defaults[componentId] || {};
  }

  getComponentHTML(componentType) {
    // Get existing data if available
    const formData = this.data.componentInfo?.formData || {};
    const personalInfo = formData.personalInfo || {};
    const healthMetrics = formData.healthMetrics || {};
    const medicalInfo = formData.medicalInfo || {};
    const emergencyContact = formData.emergencyContact || {};
    const goals = formData.goals || {};

    const templates = {
      intakeForm: `
        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Health Coaching Intake Form</h2>
        <p style="margin: 0 0 24px 0; color: #6b7280;">Please fill out this form to help us understand your health journey.</p>
        <form id="intake-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Full Name *</label>
            <input type="text" name="fullName" required value="${personalInfo.fullName || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Date of Birth *</label>
            <input type="date" name="dateOfBirth" required value="${personalInfo.dateOfBirth || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Phone Number</label>
            <input type="tel" name="phone" value="${personalInfo.phone || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email Address</label>
            <input type="email" name="email" value="${personalInfo.email || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Height</label>
            <input type="text" name="height" placeholder="e.g., 5'8\"" value="${healthMetrics.height || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Weight</label>
            <input type="text" name="weight" placeholder="e.g., 150 lbs" value="${healthMetrics.weight || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Past Medical History</label>
            <textarea name="medicalHistory" rows="3" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${medicalInfo.medicalHistory || ""}</textarea>
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Current Medications</label>
            <textarea name="currentMedications" rows="2" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${medicalInfo.currentMedications || ""}</textarea>
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Allergies</label>
            <textarea name="allergies" rows="2" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${medicalInfo.allergies || ""}</textarea>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Emergency Contact Name</label>
            <input type="text" name="emergencyContactName" value="${emergencyContact.name || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Emergency Contact Phone</label>
            <input type="tel" name="emergencyContactPhone" value="${emergencyContact.phone || ""}" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Primary Goals</label>
            <textarea name="primaryGoals" rows="3" placeholder="What are your main health and wellness goals?" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${goals.primaryGoals || ""}</textarea>
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Additional Notes</label>
            <textarea name="additionalNotes" rows="2" placeholder="Any other information you'd like to share..." style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${goals.additionalNotes || ""}</textarea>
          </div>
          <div style="grid-column: 1 / -1;">
            <button type="submit" style="background: #f5e3d1; color: black; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">Submit Form</button>
          </div>
        </form>
      `,
    };
    return templates[componentType] || "<p>Component not found</p>";
  }

  attachComponentEvents(container, componentType) {
    if (componentType === "intakeForm") {
      const form = container.querySelector("#intake-form");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);

          // Send to your API
          try {
            const response = await fetch(`/api/user/health-intake`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (response.ok) {
              alert("Form submitted successfully!");
              window.location.reload();
            }
          } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error submitting form. Please try again.");
          }
        });
      }
    }
  }

  save() {
    return {
      componentType: this.data.componentType || "",
      componentData: this.data.componentData || {},
      componentInfo: this.data.componentInfo || undefined,
    };
  }
}
