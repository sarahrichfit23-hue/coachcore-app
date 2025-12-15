"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.1,
});

function NProgressProviderContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(target.href);

      // Only start progress bar for same-origin navigation
      if (
        targetUrl.origin === currentUrl.origin &&
        targetUrl.pathname !== currentUrl.pathname
      ) {
        NProgress.start();
      }
    };

    const handleMutation = () => {
      const anchorElements = document.querySelectorAll('a[href^="/"]');
      anchorElements.forEach((anchor) => {
        anchor.addEventListener("click", handleAnchorClick as EventListener);
      });
    };

    // Attach to existing links
    handleMutation();

    // Watch for new links being added to the DOM
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      const anchorElements = document.querySelectorAll('a[href^="/"]');
      anchorElements.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick as EventListener);
      });
    };
  }, []);

  return <>{children}</>;
}

export default function NProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          Loading messages...
        </div>
      }
    >
      <NProgressProviderContent>{children}</NProgressProviderContent>
    </Suspense>
  );
}
