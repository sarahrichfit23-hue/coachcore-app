"use client";

import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Delimiter from "@editorjs/delimiter";
import Table from "@editorjs/table";
import Warning from "@editorjs/warning";
import LinkTool from "@editorjs/link";
import RawTool from "@editorjs/raw";
import Embed from "@editorjs/embed";
import Image from "@editorjs/image";
// custom tools
import CardTool from "../custom-tools/CardTool";
import ColumnsTool from "../custom-tools/ColumnsTool";
import InfoCardTool from "../custom-tools/InfoCardTool";
import ChecklistCardTool from "../custom-tools/ChecklistCardTool";
import ProfileCardTool from "../custom-tools/ProfileCardTool";
import FeatureCardTool from "../custom-tools/FeatureCardTool";
import FAQTool from "../custom-tools/FAQTool";
import HowToUseTool from "../custom-tools/HowToUseTool";
import GetStartedTool from "../custom-tools/GetStartedTool";
import ProgramWorksTool from "../custom-tools/ProgramWorksTool";
import IntakeFormTool from "../custom-tools/IntakeFormTool";
import InteractiveHeaderTool from "../custom-tools/InteractiveHeaderTool";
import NutritionPlanSummaryTool from "../custom-tools/NutritionPlanSummaryTool";
import PeriodSummaryCardTool from "../custom-tools/PeriodSummaryCardTool";
import MinimalCardTool from "../custom-tools/MinimalCardTool";

interface ReactPageEditorProps {
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export function ReactPageEditor({
  value,
  onChange,
  readOnly,
}: ReactPageEditorProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const holderKeyRef = useRef<string>(
    `editorjs-${Math.random().toString(36).slice(2)}`
  );
  const editorRef = useRef<EditorJS | null>(null);
  const lastSavedRef = useRef<unknown>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;

      const holder = holderRef.current;
      if (!holder) return;

      if (holder.dataset.editorMounted === "true") {
        return;
      }
      holder.dataset.editorMounted = "true";

      // Tear down any stale instance before creating a new one
      if (editorRef.current) {
        try {
          await editorRef.current.isReady;
          await editorRef.current.destroy();
        } catch (err) {
          // Ignore cleanup errors
        }
        editorRef.current = null;
      }

      holder.replaceChildren();

      try {
        editorRef.current = new EditorJS({
          holder,
          data: value || {},
          readOnly: !!readOnly,
          autofocus: false,
          tools: {
            header: {
              class: Header as any,
              inlineToolbar: true,
              config: {
                placeholder: "Enter a header",
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 1,
              },
            },
            list: {
              class: List,
              inlineToolbar: true,
              config: {
                defaultStyle: "unordered",
              },
            },
            checklist: {
              class: Checklist,
              inlineToolbar: true,
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
              config: {
                quotePlaceholder: "Enter a quote",
                captionPlaceholder: "Quote's author",
              },
            },
            code: {
              class: Code,
            },
            raw: {
              class: RawTool,
            },
            marker: {
              class: Marker,
              shortcut: "CMD+SHIFT+M",
            },
            inlineCode: {
              class: InlineCode,
              shortcut: "CMD+SHIFT+C",
            },
            delimiter: {
              class: Delimiter,
            },
            table: {
              class: Table as any,
              inlineToolbar: true,
              config: {
                rows: 2,
                cols: 3,
              },
            },
            warning: {
              class: Warning,
              inlineToolbar: true,
              config: {
                titlePlaceholder: "Title",
                messagePlaceholder: "Message",
              },
            },
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: "http://localhost:3000/api/fetchUrl",
              },
            },
            embed: {
              class: Embed,
              config: {
                services: {
                  youtube: true,
                  vimeo: true,
                  coub: true,
                  codepen: {
                    regex:
                      /https?:\/\/codepen.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                    embedUrl:
                      "https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2",
                    html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                    height: 300,
                    width: 600,
                    id: (groups: any) => groups.join("/embed/"),
                  },
                  twitter: true,
                  instagram: true,
                  facebook: true,
                  gfycat: true,
                },
              },
            },
            image: {
              class: Image,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const url = URL.createObjectURL(file);
                    return {
                      success: 1,
                      file: {
                        url,
                      },
                    };
                  },
                  async uploadByUrl(url: string) {
                    return {
                      success: 1,
                      file: {
                        url,
                      },
                    };
                  },
                },
              },
            },
            card: {
              class: CardTool,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const url = URL.createObjectURL(file);
                    return { success: 1, file: { url } };
                  },
                },
              },
            },
            columns: {
              class: ColumnsTool,
            },
            infoCard: {
              class: InfoCardTool,
            },
            checklistCard: {
              class: ChecklistCardTool,
            },
            profileCard: {
              class: ProfileCardTool as any,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const url = URL.createObjectURL(file);
                    return { success: 1, file: { url } };
                  },
                },
              },
            },
            featureCard: {
              class: FeatureCardTool as any,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const url = URL.createObjectURL(file);
                    return { success: 1, file: { url } };
                  },
                },
              },
            },
            faq: {
              class: FAQTool,
            },
            howToUse: {
              class: HowToUseTool as any,
            },
            getStarted: {
              class: GetStartedTool as any,
            },
            programWorks: {
              class: ProgramWorksTool as any,
            },
            IntakeForm: {
              class: IntakeFormTool as any,
            },
            interactiveHeader: {
              class: InteractiveHeaderTool as any,
            },
            nutritionPlanSummary: {
              class: NutritionPlanSummaryTool as any,
            },
            periodSummaryCard: {
              class: PeriodSummaryCardTool as any,
            },
            minimalCard: {
              class: MinimalCardTool as any,
            },
          },
          onChange: async () => {
            if (!editorRef.current) return;
            try {
              const saved = await editorRef.current.save();
              lastSavedRef.current = saved;
              onChange(saved);
            } catch (err) {
              console.error("Save error:", err);
            }
          },
        });

        await editorRef.current.isReady;
        initializedRef.current = true;
        lastSavedRef.current = value;

        const editors = holder.querySelectorAll(".codex-editor");
        editors.forEach((node, index) => {
          if (index > 0) {
            node.remove();
          }
        });
      } catch (err) {
        console.error("EditorJS initialization error:", err);
        holder.dataset.editorMounted = "false";
      }
    };

    init();

    return () => {
      mounted = false;
      const holder = holderRef.current;
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (err) {
          // Ignore cleanup errors
        }
        editorRef.current = null;
      }

      if (holder) {
        holder.replaceChildren();
        holder.dataset.editorMounted = "false";
      }
      initializedRef.current = false;
      lastSavedRef.current = null;
    };
    // eslint-disable-next-line
  }, [readOnly]);

  // Keep editor content in sync when `value` prop changes externally
  useEffect(() => {
    if (!initializedRef.current || !editorRef.current) return;

    const tryRender = async () => {
      const editor = editorRef.current;
      if (!editor) return;
      try {
        const current = lastSavedRef.current;
        if (JSON.stringify(current) !== JSON.stringify(value)) {
          if (typeof (editor as any).render === "function") {
            await (editor as any).render(value || {});
            lastSavedRef.current = value;
          }
        }
      } catch (err) {
        console.error("Render error:", err);
      }
    };
    tryRender();
  }, [value]);

  const holderKey = holderKeyRef.current;

  return (
    <div>
      <div
        className="bg-[#f5e3d1]"
        data-editor-id={holderKey}
        ref={holderRef}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        [data-editor-id="${holderKey}"] {
          min-height: 120px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          max-width: 100%;
          width: 100%;
        }
        [data-editor-id="${holderKey}"] .codex-editor {
          max-width: 100% !important;
        }
        [data-editor-id="${holderKey}"] .ce-block__content {
          max-width: ${readOnly ? "100%" : "90%"} !important;
        }
        [data-editor-id="${holderKey}"] .ce-block {
          outline: none;
        }
        [data-editor-id="${holderKey}"] .codex-editor__redactor {
          padding-bottom: 20px !important;
        }
        [data-editor-id="${holderKey}"] .ce-toolbar__content {
          max-width: 90% !important;
        }
        [data-editor-id="${holderKey}"] .ce-toolbar__plus,
        [data-editor-id="${holderKey}"] .ce-toolbar__settings-btn {
          color: #3b82f6;
        }
        [data-editor-id="${holderKey}"] .ce-header {
          font-weight: 600 !important;
          line-height: 1.3 !important;
          margin: 0.5em 0 !important;
          padding: 0 !important;
        }
        [data-editor-id="${holderKey}"] h1.ce-header {
          font-size: 2.5em !important;
        }
        [data-editor-id="${holderKey}"] h2.ce-header {
          font-size: 2em !important;
        }
        [data-editor-id="${holderKey}"] h3.ce-header {
          font-size: 1.75em !important;
        }
        [data-editor-id="${holderKey}"] h4.ce-header {
          font-size: 1.5em !important;
        }
        [data-editor-id="${holderKey}"] h5.ce-header {
          font-size: 1.25em !important;
        }
        [data-editor-id="${holderKey}"] h6.ce-header {
          font-size: 1em !important;
        }
      `,
        }}
      />
    </div>
  );
}
