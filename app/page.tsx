"use client";

import * as React from "react";
import AppSidebar from "@/components/nav/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Keep IDs exactly in sync with the sidebar.
const toId = (label: string): string =>
  label
    .replace(/\.tsx$/i, "")
    .trim()
    .replace(/([A-Z])(?=[A-Z][a-z])/g, "$1-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const sections: string[] = [
  "Hello",
  // Foundations (4)
  "KPI Stat",
  "Stat Grid",
  "Data Table",
  "Control Bar",
  // Trends (4)
  "Area Series",
  "Line Series",
  "Band Line",
  "Sparkline Card",
  // Category (3)
  "Bar List",
  "Grouped Bar",
  "Donut Chart",
  // distribution (2)
  "Histogram",
  "Heatmap",
  // Specialized (4)
  "Funnel",
  "Timeline",
  "Compare Cards",
  "Graph Service Map",
  // SLO (3)
  "Gauge.tsx",
  "ErrorBudgetLine.tsx",
  "SaturationBand.tsx",
  // LIve (2)
  "Live Tail List",
  "Live Traces Feed",
];

// Ensures mobile starts closed on first paint (official hook).
function AutoCloseOnMobile(): React.JSX.Element | null {
  const { isMobile, setOpenMobile } = useSidebar(); // :contentReference[oaicite:12]{index=12}
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);
  return null;
}

export default function HomePage(): React.JSX.Element {
  return (
    // Using provider at page-level for your demo.
    // For persistence via cookies, move this to app/layout.tsx per docs. :contentReference[oaicite:13]{index=13}
    <SidebarProvider /* defaultOpen can be cookie-driven in layout */>
      <AppSidebar />
      <AutoCloseOnMobile />

      {/* Inset variant requires SidebarInset wrapper so spacing is handled by the lib. :contentReference[oaicite:14]{index=14} */}
      <SidebarInset>
        {/* Top app bar with trigger */}
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
          <div className="flex h-12 items-center gap-3 px-3">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">
              Hello &mdash; Demo of 23 sections
            </div>
          </div>
        </header>

        {/* Main content */}
        <main>
          {sections.map((label) => {
            const id = toId(label);
            return (
              <section
                key={id}
                id={id}
                className="min-h-svh w-full scroll-mt-16 px-6 py-12"
              >
                <div className="mx-auto max-w-4xl">
                  <h1 className="mb-4 text-2xl font-semibold tracking-tight">
                    {label.replace(/\.tsx$/i, "")}
                  </h1>

                  {/* Skeleton content to force scroll and show layout */}
                  <div className="space-y-4">
                    <div className="h-5 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-11/12 rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                    <div className="h-80 rounded border border-dashed" />
                  </div>
                </div>
              </section>
            );
          })}
        </main>

        {/* Optional footer spacer */}
        <footer className="h-12" />
      </SidebarInset>
    </SidebarProvider>
  );
}
