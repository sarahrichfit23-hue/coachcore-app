"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactPageEditor } from "@/components/documents/react-page-editor";
import { findPageById } from "@/lib/document-template";
import { type DocumentTemplate } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentViewerProps {
  document: DocumentTemplate;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const visiblePageIds = useMemo(() => {
    return document.sections.flatMap((section) =>
      section.pages.filter((page) => !page.hidden).map((page) => page.id)
    );
  }, [document.sections]);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    () => visiblePageIds[0] ?? null
  );

  const selected = useMemo(() => {
    if (!selectedPageId) return null;
    const result = findPageById(document, selectedPageId);
    return result;
  }, [document, selectedPageId]);

  const currentPageIndex = useMemo(() => {
    return selectedPageId ? visiblePageIds.indexOf(selectedPageId) : -1;
  }, [selectedPageId, visiblePageIds]);

  const canGoPrevious = currentPageIndex > 0;
  const canGoNext = currentPageIndex < visiblePageIds.length - 1;

  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    // Scroll to top of content when page changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      handlePageSelect(visiblePageIds[currentPageIndex - 1]);
    }
  }, [canGoPrevious, currentPageIndex, visiblePageIds, handlePageSelect]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      handlePageSelect(visiblePageIds[currentPageIndex + 1]);
    }
  }, [canGoNext, currentPageIndex, visiblePageIds, handlePageSelect]);

  // Ensure selected page is valid
  useEffect(() => {
    if (selectedPageId && !visiblePageIds.includes(selectedPageId)) {
      setSelectedPageId(visiblePageIds[0] ?? null);
    }
  }, [selectedPageId, visiblePageIds]);

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 shrink-0 space-y-4 rounded-lg bg-white p-4 shadow-sm">
          {document.sections
            .filter((section) => section.pages.some((page) => !page.hidden))
            .map((section) => (
              <div key={section.id} className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {section.name}
                </p>
                <div className="space-y-1">
                  {section.pages
                    .filter((page) => !page.hidden)
                    .map((page) => (
                      <button
                        key={page.id}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-all duration-150 ${
                          selectedPageId === page.id
                            ? "bg-[#fcca56] font-medium text-gray-900 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        }`}
                        onClick={() => handlePageSelect(page.id)}
                      >
                        {page.title}
                      </button>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className="min-h-[70vh] flex-1 overflow-y-auto rounded-lg bg-white shadow-sm"
      >
        {selected ? (
          <div key={selectedPageId} className="space-y-4">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  {isSidebarOpen ? (
                    <ChevronLeft className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {selected.sectionName}
                </p>
                <h2 className="mt-0.5 text-2xl font-semibold text-gray-900">
                  {selected.page.title}
                </h2>
              </div>
              {!isSidebarOpen && (
                <div>
                  <button
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={!canGoNext}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <ReactPageEditor
                key={`editor-${selectedPageId}`}
                value={selected.page.json}
                onChange={() => {}}
                readOnly
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            <p className="text-gray-500">No visible pages available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
