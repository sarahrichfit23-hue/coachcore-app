/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createIconElement, getIconStyles } from "./icon-renderer";

/**
 * PeriodSummaryCardTool for EditorJS - creates a detailed period/phase summary card
 */
export default class PeriodSummaryCardTool {
  static get toolbox() {
    return {
      title: "Period Summary Card",
      icon: '<svg width="17" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M3 10h18" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="7" r="1" fill="currentColor"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      // Header
      periodNumber: data.periodNumber || "1",
      title: data.title || "Foundation & Ignition",
      subtitle: data.subtitle || "Weeks 1-3",
      headerBgColor: data.headerBgColor || "#ff9999",

      // Motivational section
      motivationIconName: data.motivationIconName || "zap",
      motivationIconColor: data.motivationIconColor || "#f59e0b",
      motivationTitle: data.motivationTitle || "You've Got This!",
      motivationText:
        data.motivationText ||
        "Welcome to Phase 1! You're not just starting a fitness program—you're beginning a complete transformation. Every rep, every meal, every choice matters. Let's build your foundation strong!",
      motivationBgColor: data.motivationBgColor || "#fef3c7",

      // Workout Plan
      workoutIconName: data.workoutIconName || "dumbbell",
      workoutIconColor: data.workoutIconColor || "#ef4444",
      workoutTitle: data.workoutTitle || "Workout Plan",
      workoutSubtitle: data.workoutSubtitle || "Your Week 1-3 training program",
      workoutStatus: data.workoutStatus || "Workout plan coming soon",
      workoutBgColor: data.workoutBgColor || "#f3f4f6",

      // Phase Goals
      goalsIconName: data.goalsIconName || "target",
      goalsIconColor: data.goalsIconColor || "#1f2937",
      goalsTitle: data.goalsTitle || "Phase Goals",
      goals: data.goals || [
        { label: "Training Days per Week", value: "4-5" },
        { label: "Session Duration", value: "45-60 min" },
        { label: "Intensity Level", value: "Moderate" },
      ],
      goalsBgColor: data.goalsBgColor || "#fef2f2",

      // Mindset section
      mindsetIconName: data.mindsetIconName || "brain",
      mindsetIconColor: data.mindsetIconColor || "#8b5cf6",
      mindsetTitle: data.mindsetTitle || "Mindset Mastery",
      mindsetText:
        data.mindsetText ||
        "Building Your Transformation Mindset: Start where you are. The journey of a thousand miles begins with a single step. This phase is about building consistency, trusting the process, and celebrating small wins.",
      mindsetBgColor: data.mindsetBgColor || "#faf5ff",

      // Learning section
      learningIconName: data.learningIconName || "heart",
      learningIconColor: data.learningIconColor || "#3b82f6",
      learningTitle: data.learningTitle || "What You'll Learn",
      learningText:
        data.learningText ||
        "Foundation Training Principles: Learn proper form, establish baseline fitness, understand progressive overload, and build sustainable habits.",
      learningBgColor: data.learningBgColor || "#f0f6ff",
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("period-summary-card-tool");

    const container = document.createElement("div");
    container.classList.add("period-summary-container");

    // Header
    const header = document.createElement("div");
    header.classList.add("period-summary-header");
    header.style.backgroundColor = this.data.headerBgColor;

    const headerContent = document.createElement("div");
    headerContent.classList.add("period-summary-header-content");

    // Number badge
    const badge = document.createElement("div");
    badge.classList.add("period-summary-badge");

    if (this.readOnly) {
      badge.textContent = this.data.periodNumber;
    } else {
      const badgeInput = document.createElement("input");
      badgeInput.type = "text";
      badgeInput.value = this.data.periodNumber;
      badgeInput.classList.add("period-summary-badge-input");
      badgeInput.addEventListener("input", (e) => {
        this.data.periodNumber = e.target.value;
      });
      badge.appendChild(badgeInput);
    }
    headerContent.appendChild(badge);

    // Title section
    const titleSection = document.createElement("div");
    titleSection.classList.add("period-summary-title-section");

    const titleEl = document.createElement("h2");
    titleEl.classList.add("period-summary-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.title;
    } else {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.data.title;
      titleInput.placeholder = "Period title...";
      titleInput.classList.add("period-summary-title-input");
      titleInput.addEventListener("input", (e) => {
        this.data.title = e.target.value;
      });
      titleEl.appendChild(titleInput);
    }
    titleSection.appendChild(titleEl);

    const subtitleEl = document.createElement("div");
    subtitleEl.classList.add("period-summary-subtitle");

    if (this.readOnly) {
      subtitleEl.textContent = this.data.subtitle;
    } else {
      const subtitleInput = document.createElement("input");
      subtitleInput.type = "text";
      subtitleInput.value = this.data.subtitle;
      subtitleInput.placeholder = "Subtitle...";
      subtitleInput.classList.add("period-summary-subtitle-input");
      subtitleInput.addEventListener("input", (e) => {
        this.data.subtitle = e.target.value;
      });
      subtitleEl.appendChild(subtitleInput);
    }
    titleSection.appendChild(subtitleEl);

    headerContent.appendChild(titleSection);
    header.appendChild(headerContent);
    container.appendChild(header);

    // Content area
    const contentArea = document.createElement("div");
    contentArea.classList.add("period-summary-content");

    // Motivational section
    this.renderMotivationSection(contentArea);

    // Workout and Goals sections
    this.renderWorkoutGoalsSection(contentArea);

    // Mindset section
    this.renderMindsetSection(contentArea);

    // Learning section
    this.renderLearningSection(contentArea);

    container.appendChild(contentArea);
    this.wrapper.appendChild(container);

    // Controls
    if (!this.readOnly) {
      this.renderControls();
    }

    // Styles
    this.addStyles();

    return this.wrapper;
  }

  renderMotivationSection(container) {
    const section = document.createElement("div");
    section.classList.add("period-summary-motivation");
    section.style.backgroundColor = this.data.motivationBgColor;

    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("period-summary-icon-wrapper");

    const iconEl = createIconElement({
      iconName: this.data.motivationIconName,
      color: this.data.motivationIconColor,
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.motivationIconName = newIconName;
      },
    });
    iconEl.classList.add("period-summary-section-icon");
    iconWrapper.appendChild(iconEl);
    section.appendChild(iconWrapper);

    const textContent = document.createElement("div");
    textContent.classList.add("period-summary-motivation-text");

    const titleEl = document.createElement("div");
    titleEl.classList.add("period-summary-section-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.motivationTitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.motivationTitle;
      input.placeholder = "Motivation title...";
      input.classList.add("period-summary-section-title-input");
      input.addEventListener("input", (e) => {
        this.data.motivationTitle = e.target.value;
      });
      titleEl.appendChild(input);
    }
    textContent.appendChild(titleEl);

    const descEl = document.createElement("div");
    descEl.classList.add("period-summary-section-desc");

    if (this.readOnly) {
      descEl.textContent = this.data.motivationText;
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = this.data.motivationText;
      textarea.placeholder = "Motivation text...";
      textarea.classList.add("period-summary-section-desc-input");
      textarea.addEventListener("input", (e) => {
        this.data.motivationText = e.target.value;
      });
      descEl.appendChild(textarea);
    }
    textContent.appendChild(descEl);

    section.appendChild(textContent);
    container.appendChild(section);
  }

  renderWorkoutGoalsSection(container) {
    const twoColumnSection = document.createElement("div");
    twoColumnSection.classList.add("period-summary-two-column");

    // Workout Plan
    const workoutSection = document.createElement("div");
    workoutSection.classList.add("period-summary-workout");
    workoutSection.style.backgroundColor = this.data.workoutBgColor;

    const workoutHeader = document.createElement("div");
    workoutHeader.classList.add("period-summary-workout-header");

    const workoutIconEl = createIconElement({
      iconName: this.data.workoutIconName,
      color: this.data.workoutIconColor,
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.workoutIconName = newIconName;
      },
    });
    workoutIconEl.classList.add("period-summary-section-icon");
    workoutHeader.appendChild(workoutIconEl);

    const workoutTitleWrapper = document.createElement("div");

    const workoutTitleEl = document.createElement("div");
    workoutTitleEl.classList.add("period-summary-workout-title");

    if (this.readOnly) {
      workoutTitleEl.textContent = this.data.workoutTitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.workoutTitle;
      input.placeholder = "Workout title...";
      input.classList.add("period-summary-workout-title-input");
      input.addEventListener("input", (e) => {
        this.data.workoutTitle = e.target.value;
      });
      workoutTitleEl.appendChild(input);
    }
    workoutTitleWrapper.appendChild(workoutTitleEl);

    const workoutSubtitleEl = document.createElement("div");
    workoutSubtitleEl.classList.add("period-summary-workout-subtitle");

    if (this.readOnly) {
      workoutSubtitleEl.textContent = this.data.workoutSubtitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.workoutSubtitle;
      input.placeholder = "Subtitle...";
      input.classList.add("period-summary-workout-subtitle-input");
      input.addEventListener("input", (e) => {
        this.data.workoutSubtitle = e.target.value;
      });
      workoutSubtitleEl.appendChild(input);
    }
    workoutTitleWrapper.appendChild(workoutSubtitleEl);

    workoutHeader.appendChild(workoutTitleWrapper);
    workoutSection.appendChild(workoutHeader);

    const workoutStatusEl = document.createElement("div");
    workoutStatusEl.classList.add("period-summary-workout-status");

    if (this.readOnly) {
      workoutStatusEl.textContent = this.data.workoutStatus;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.workoutStatus;
      input.placeholder = "Status...";
      input.classList.add("period-summary-workout-status-input");
      input.addEventListener("input", (e) => {
        this.data.workoutStatus = e.target.value;
      });
      workoutStatusEl.appendChild(input);
    }
    workoutSection.appendChild(workoutStatusEl);

    twoColumnSection.appendChild(workoutSection);

    // Goals Section
    const goalsSection = document.createElement("div");
    goalsSection.classList.add("period-summary-goals");
    goalsSection.style.backgroundColor = this.data.goalsBgColor;

    const goalsHeader = document.createElement("div");
    goalsHeader.classList.add("period-summary-goals-header");

    const goalsIconEl = createIconElement({
      iconName: this.data.goalsIconName,
      color: this.data.goalsIconColor,
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.goalsIconName = newIconName;
      },
    });
    goalsIconEl.classList.add("period-summary-section-icon");
    goalsHeader.appendChild(goalsIconEl);

    const goalsTitleEl = document.createElement("div");
    goalsTitleEl.classList.add("period-summary-goals-title");

    if (this.readOnly) {
      goalsTitleEl.textContent = this.data.goalsTitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.goalsTitle;
      input.placeholder = "Goals title...";
      input.classList.add("period-summary-goals-title-input");
      input.addEventListener("input", (e) => {
        this.data.goalsTitle = e.target.value;
      });
      goalsTitleEl.appendChild(input);
    }
    goalsHeader.appendChild(goalsTitleEl);

    goalsSection.appendChild(goalsHeader);

    // Goals list
    const goalsList = document.createElement("div");
    goalsList.classList.add("period-summary-goals-list");

    this.data.goals.forEach((goal, index) => {
      const goalItem = document.createElement("div");
      goalItem.classList.add("period-summary-goal-item");

      const label = document.createElement("div");
      label.classList.add("period-summary-goal-label");

      if (this.readOnly) {
        label.textContent = goal.label;
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = goal.label;
        input.placeholder = "Label...";
        input.classList.add("period-summary-goal-label-input");
        input.addEventListener("input", (e) => {
          this.data.goals[index].label = e.target.value;
        });
        label.appendChild(input);
      }
      goalItem.appendChild(label);

      const value = document.createElement("div");
      value.classList.add("period-summary-goal-value");

      if (this.readOnly) {
        value.textContent = goal.value;
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = goal.value;
        input.placeholder = "Value...";
        input.classList.add("period-summary-goal-value-input");
        input.addEventListener("input", (e) => {
          this.data.goals[index].value = e.target.value;
        });
        value.appendChild(input);
      }
      goalItem.appendChild(value);

      if (!this.readOnly) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "×";
        deleteBtn.classList.add("period-summary-goal-delete");
        deleteBtn.addEventListener("click", () => {
          this.data.goals.splice(index, 1);
          // Remove old section and re-render
          const oldSection = container.querySelector(
            ".period-summary-two-column",
          );
          if (oldSection) {
            container.removeChild(oldSection);
          }
          this.renderWorkoutGoalsSection(container);
        });
        goalItem.appendChild(deleteBtn);
      }

      goalsList.appendChild(goalItem);
    });

    if (!this.readOnly) {
      const addGoalBtn = document.createElement("button");
      addGoalBtn.textContent = "+ Add Goal";
      addGoalBtn.classList.add("period-summary-add-goal-btn");
      addGoalBtn.addEventListener("click", () => {
        this.data.goals.push({ label: "", value: "" });
        // Remove old section and re-render
        const oldSection = container.querySelector(
          ".period-summary-two-column",
        );
        if (oldSection) {
          container.removeChild(oldSection);
        }
        this.renderWorkoutGoalsSection(container);
      });
      goalsList.appendChild(addGoalBtn);
    }

    goalsSection.appendChild(goalsList);
    twoColumnSection.appendChild(goalsSection);
    container.appendChild(twoColumnSection);
  }

  renderMindsetSection(container) {
    const section = document.createElement("div");
    section.classList.add("period-summary-mindset");
    section.style.backgroundColor = this.data.mindsetBgColor;

    const iconEl = createIconElement({
      iconName: this.data.mindsetIconName,
      color: this.data.mindsetIconColor,
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.mindsetIconName = newIconName;
      },
    });
    iconEl.classList.add("period-summary-section-icon");
    section.appendChild(iconEl);

    const textContent = document.createElement("div");
    textContent.classList.add("period-summary-mindset-text");

    const titleEl = document.createElement("div");
    titleEl.classList.add("period-summary-section-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.mindsetTitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.mindsetTitle;
      input.placeholder = "Mindset title...";
      input.classList.add("period-summary-section-title-input");
      input.addEventListener("input", (e) => {
        this.data.mindsetTitle = e.target.value;
      });
      titleEl.appendChild(input);
    }
    textContent.appendChild(titleEl);

    const descEl = document.createElement("div");
    descEl.classList.add("period-summary-section-desc");

    if (this.readOnly) {
      descEl.textContent = this.data.mindsetText;
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = this.data.mindsetText;
      textarea.placeholder = "Mindset text...";
      textarea.classList.add("period-summary-section-desc-input");
      textarea.addEventListener("input", (e) => {
        this.data.mindsetText = e.target.value;
      });
      descEl.appendChild(textarea);
    }
    textContent.appendChild(descEl);

    section.appendChild(textContent);
    container.appendChild(section);
  }

  renderLearningSection(container) {
    const section = document.createElement("div");
    section.classList.add("period-summary-learning");
    section.style.backgroundColor = this.data.learningBgColor;

    const iconEl = createIconElement({
      iconName: this.data.learningIconName,
      color: this.data.learningIconColor,
      readOnly: this.readOnly,
      onChange: (newIconName) => {
        this.data.learningIconName = newIconName;
      },
    });
    iconEl.classList.add("period-summary-section-icon");
    section.appendChild(iconEl);

    const textContent = document.createElement("div");
    textContent.classList.add("period-summary-learning-text");

    const titleEl = document.createElement("div");
    titleEl.classList.add("period-summary-section-title");

    if (this.readOnly) {
      titleEl.textContent = this.data.learningTitle;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.data.learningTitle;
      input.placeholder = "Learning title...";
      input.classList.add("period-summary-section-title-input");
      input.addEventListener("input", (e) => {
        this.data.learningTitle = e.target.value;
      });
      titleEl.appendChild(input);
    }
    textContent.appendChild(titleEl);

    const descEl = document.createElement("div");
    descEl.classList.add("period-summary-section-desc");

    if (this.readOnly) {
      descEl.textContent = this.data.learningText;
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = this.data.learningText;
      textarea.placeholder = "Learning text...";
      textarea.classList.add("period-summary-section-desc-input");
      textarea.addEventListener("input", (e) => {
        this.data.learningText = e.target.value;
      });
      descEl.appendChild(textarea);
    }
    textContent.appendChild(descEl);

    section.appendChild(textContent);
    container.appendChild(section);
  }

  renderControls() {
    const controls = document.createElement("div");
    controls.classList.add("period-summary-controls");

    const colorPickers = [
      { label: "Header BG", key: "headerBgColor" },
      { label: "Motivation BG", key: "motivationBgColor" },
      { label: "Workout BG", key: "workoutBgColor" },
      { label: "Goals BG", key: "goalsBgColor" },
      { label: "Mindset BG", key: "mindsetBgColor" },
      { label: "Learning BG", key: "learningBgColor" },
    ];

    colorPickers.forEach(({ label, key }) => {
      const pickerLabel = document.createElement("label");
      pickerLabel.textContent = label + ":";
      pickerLabel.style.fontSize = "11px";
      pickerLabel.style.fontWeight = "600";

      const input = document.createElement("input");
      input.type = "color";
      input.value = this.data[key];
      input.addEventListener("input", (e) => {
        this.data[key] = e.target.value;
        const sections = {
          headerBgColor: ".period-summary-header",
          motivationBgColor: ".period-summary-motivation",
          workoutBgColor: ".period-summary-workout",
          goalsBgColor: ".period-summary-goals",
          mindsetBgColor: ".period-summary-mindset",
          learningBgColor: ".period-summary-learning",
        };
        const section = this.wrapper.querySelector(sections[key]);
        if (section) {
          section.style.backgroundColor = e.target.value;
        }
      });

      controls.appendChild(pickerLabel);
      controls.appendChild(input);
    });

    this.wrapper.appendChild(controls);
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      ${getIconStyles()}
      
      .period-summary-card-tool {
        margin: 20px 0;
      }
      
      .period-summary-container {
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .period-summary-header {
        padding: 2rem;
        color: white;
      }
      
      .period-summary-header-content {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      
      .period-summary-badge {
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      
      .period-summary-badge-input {
        width: 50px;
        text-align: center;
        background: transparent;
        border: none;
        color: white;
        font-size: 2rem;
        font-weight: 700;
        outline: none;
      }
      
      .period-summary-title-section {
        flex: 1;
      }
      
      .period-summary-title {
        font-size: 1.875rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      }
      
      .period-summary-title-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 1.875rem;
        font-weight: 700;
        padding: 0.5rem;
        border-radius: 6px;
        outline: none;
      }
      
      .period-summary-subtitle {
        font-size: 0.875rem;
        opacity: 0.9;
      }
      
      .period-summary-subtitle-input {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        outline: none;
      }
      
      .period-summary-content {
        background: white;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .period-summary-icon-wrapper {
        flex-shrink: 0;
      }
      
      .period-summary-section-icon .editorjs-icon-container {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .period-summary-section-icon svg {
        width: 24px !important;
        height: 24px !important;
      }
      
      .period-summary-motivation {
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 4px solid #f59e0b;
        display: flex;
        gap: 1rem;
      }
      
      .period-summary-motivation-text {
        flex: 1;
      }
      
      .period-summary-section-title {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      
      .period-summary-section-title-input {
        width: 100%;
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 700;
        outline: none;
      }
      
      .period-summary-section-desc {
        font-size: 0.875rem;
        line-height: 1.6;
        color: #4b5563;
      }
      
      .period-summary-section-desc-input {
        width: 100%;
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        line-height: 1.6;
        min-height: 80px;
        outline: none;
        font-family: inherit;
        resize: vertical;
      }
      
      .period-summary-two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      
      @media (max-width: 768px) {
        .period-summary-two-column {
          grid-template-columns: 1fr;
        }
      }
      
      .period-summary-workout,
      .period-summary-goals {
        padding: 1.5rem;
        border-radius: 12px;
      }
      
      .period-summary-workout-header,
      .period-summary-goals-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      
      .period-summary-workout-title,
      .period-summary-goals-title {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
      }
      
      .period-summary-workout-title-input,
      .period-summary-goals-title-input {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 700;
        outline: none;
        width: 100%;
      }
      
      .period-summary-workout-subtitle {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }
      
      .period-summary-workout-subtitle-input {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        outline: none;
        width: 100%;
      }
      
      .period-summary-workout-status {
        text-align: center;
        color: #9ca3af;
        font-size: 0.875rem;
        margin-top: 2rem;
      }
      
      .period-summary-workout-status-input {
        width: 100%;
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        text-align: center;
        outline: none;
      }
      
      .period-summary-goals-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .period-summary-goal-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      
      .period-summary-goal-label {
        font-size: 0.875rem;
        color: #4b5563;
        flex: 1;
      }
      
      .period-summary-goal-label-input {
        width: 100%;
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        outline: none;
      }
      
      .period-summary-goal-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
      }
      
      .period-summary-goal-value-input {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
        outline: none;
        width: 100px;
        text-align: right;
      }
      
      .period-summary-goal-delete {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }
      
      .period-summary-goal-delete:hover {
        background: #dc2626;
      }
      
      .period-summary-add-goal-btn {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      
      .period-summary-add-goal-btn:hover {
        background: #2563eb;
      }
      
      .period-summary-mindset,
      .period-summary-learning {
        padding: 1.5rem;
        border-radius: 12px;
        display: flex;
        gap: 1rem;
      }
      
      .period-summary-mindset-text,
      .period-summary-learning-text {
        flex: 1;
      }
      
      .period-summary-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .period-summary-controls label {
        font-size: 11px;
        font-weight: 600;
        color: #4b5563;
      }
      
      .period-summary-controls input[type="color"] {
        width: 40px;
        height: 25px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.wrapper.appendChild(style);
  }

  save() {
    return this.data;
  }

  validate(savedData) {
    return true;
  }
}
