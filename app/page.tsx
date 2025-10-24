"use client";

import * as React from "react";
import TopNav from "@/components/nav/TopNav";
import AppSidebar from "@/components/nav/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { renderFoundationsDemo } from "@/components/depths/foundations/Demo";
import { renderTrendsDemo } from "@/components/depths/trends/Demo";

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
  "Gauge",
  "Error Budget Line",
  "Saturation Band",
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <AutoCloseOnMobile />
        <main className="w-full pt-14">
          {sections.map((label) => {
            const id = toId(label);
            return (
              <section key={id} id={id} className="w-full scroll-mt-16 px-6 py-12">
                <div className="mx-auto max-w-4xl">
                  <h1 className="mb-4 text-2xl font-semibold tracking-tight">
                    {label.replace(/\.tsx$/i, "")}
                  </h1>

                  {/* Ask the demo registry for this section; fallback to skeleton */}
                  {renderFoundationsDemo(id) ?? renderTrendsDemo(id) ??(
                    <div className="space-y-4">
                      <div className="h-5 w-1/3 rounded bg-muted" />
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-11/12 rounded bg-muted" />
                      <div className="h-4 w-4/5 rounded bg-muted" />
                      <div className="h-80 rounded border border-dashed" />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="h-12" />
      </SidebarInset>
    </SidebarProvider>
  );
}