// import { randomUUID } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import {
  type DocumentContent,
  type DocumentPage,
  type DocumentSection,
  type DocumentTemplate,
} from "@/types";
import {
  agreementJSON,
  fitnessJounrneyJSON,
  intakeFormJSON,
  onboardingStartHereJSON,
  offboardingFeedbackJSON,
  offboardingFinalReflectionJSON,
  offboardingNextStepsJSON,
  offboardingProgramRecapJSON,
  programCourseMaterialJSON,
  programCourseNotesJSON,
  programResourcesJSON,
} from "./initial-template";

const baseTemplateSections: Array<
  Omit<DocumentSection, "id" | "pages"> & {
    pages: Array<Omit<DocumentPage, "id">>;
  }
> = [
  {
    name: "Onboarding",
    pages: [
      {
        title: "Start Here",
        hidden: false,
        json: { ...onboardingStartHereJSON },
      },
      {
        title: "Coaching Agreement",
        hidden: false,
        json: { ...agreementJSON },
      },
      {
        title: "Intake Questionnaire",
        hidden: false,
        json: { ...intakeFormJSON },
      },
      {
        title: "Your Fitness & Nutrition Program",
        hidden: false,
        json: { ...fitnessJounrneyJSON },
      },
    ],
  },
  {
    name: "Program",
    pages: [
      {
        title: "Course Material",
        hidden: false,
        json: { ...programCourseMaterialJSON },
      },
      {
        title: "Course Notes",
        hidden: false,
        json: { ...programCourseNotesJSON },
      },
      { title: "Resources", hidden: false, json: { ...programResourcesJSON } },
    ],
  },
  {
    name: "Offboarding",
    pages: [
      {
        title: "Program Recap",
        hidden: false,
        json: { ...offboardingProgramRecapJSON },
      },
      {
        title: "Final Reflection",
        hidden: false,
        json: { ...offboardingFinalReflectionJSON },
      },
      {
        title: "Feedback",
        hidden: false,
        json: { ...offboardingFeedbackJSON },
      },
      {
        title: "Next Steps",
        hidden: false,
        json: { ...offboardingNextStepsJSON },
      },
    ],
  },
];

function cloneContent(json: DocumentContent): DocumentContent {
  return JSON.parse(JSON.stringify(json));
}

function createSectionWithIds(
  section: (typeof baseTemplateSections)[number],
): DocumentSection {
  return {
    id: uuidv4(),
    name: section.name,
    pages: section.pages.map((page) => ({
      id: uuidv4(),
      title: page.title,
      hidden: page.hidden,
      json: cloneContent(page.json),
    })),
  };
}

export function createDocumentTemplateWithIds(): DocumentTemplate {
  return {
    sections: baseTemplateSections.map(createSectionWithIds),
  };
}

export function cloneTemplateWithNewPageIds(
  template: DocumentTemplate,
): DocumentTemplate {
  return {
    sections: template.sections.map((section) => ({
      ...section,
      pages: section.pages.map((page) => ({
        ...page,
        id: uuidv4(),
        json: cloneContent(page.json),
      })),
    })),
  };
}

export const DEFAULT_DOCUMENT_TEMPLATE: DocumentTemplate =
  createDocumentTemplateWithIds();

export function updatePageHidden(
  template: DocumentTemplate,
  pageId: string,
  hidden: boolean,
): DocumentTemplate | null {
  const cloned = structuredClone(template);
  for (const section of cloned.sections) {
    const page = section.pages.find((p) => p.id === pageId);
    if (page) {
      page.hidden = hidden;
      return cloned;
    }
  }
  return null;
}

export function updatePageJson(
  template: DocumentTemplate,
  pageId: string,
  json: DocumentContent,
): DocumentTemplate | null {
  const cloned = structuredClone(template);
  for (const section of cloned.sections) {
    const page = section.pages.find((p) => p.id === pageId);
    if (page) {
      page.json = cloneContent(json);
      return cloned;
    }
  }
  return null;
}

export function findPageById(
  template: DocumentTemplate,
  pageId: string,
): { page: DocumentPage; sectionName: string } | null {
  for (const section of template.sections) {
    const page = section.pages.find((p) => p.id === pageId);
    if (page) {
      return { page, sectionName: section.name };
    }
  }
  return null;
}
