// app/page.tsx
"use client";

import * as React from "react";
import TopNav from "@/components/nav/TopNav";
import AppSidebar from "@/components/nav/AppSidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { renderFoundationsDemo } from "@/components/depths/foundations/Demo";
import { renderTrendsDemo } from "@/components/depths/trends/Demo";
import { renderCategoryDemo } from "@/components/depths/category/Demo";
import { renderDistributionDemo } from "@/components/depths/distribution/Demo";
import { renderLiveDemo } from "@/components/depths/live/Demo";

// --- keep your existing toId + sections ---
const toId = (label: string): string =>
  label.replace(/\.tsx$/i, "")
    .trim()
    .replace(/([A-Z])(?=[A-Z][a-z])/g, "$1-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const sections: string[] = [
  "Building Blocks",
  // Foundations
  "KPI Stat", "Stat Grid", "Data Table", "Control Bar","Radial Gauge",
  // Trends
  "Area Series", "Line Series", "Band Line", "Scatter Plot","Sankey Diagram",
  // Category
  "Bar List", "Grouped Bar", "Donut Chart",
  // Distribution
  "Histogram", "Heatmap",
  // Live
  "Live Tail List", "Live Traces Feed",
];

// --- hello cards (first section targets per cluster) ---
const clusterCards = [
  { id: "kpi-stat",       title: "Foundations",  blurb: "KPIs, grids, tables, gauge & controls." },
  { id: "area-series",    title: "Trends",       blurb: "Area, line, bands." },
  { id: "bar-list",       title: "Category",     blurb: "Breakdowns: bars & donut." },
  { id: "histogram",      title: "Distribution", blurb: "Histogram & heatmap." },
  { id: "live-tail-list", title: "Live",         blurb: "Real-time logs & traces." },
] as const;

// --- cluster headings: render before the first section of each group ---
const CLUSTER_BY_FIRST_ID: Record<string, string> = {
  "kpi-stat": "Foundations",
  "area-series": "Trends",
  "bar-list": "Category",
  "histogram": "Distribution",
  "funnel": "Specialized",
  "gauge": "SLO",
  "live-tail-list": "Live",
};

// optional: auto-close sidebar on mobile
function AutoCloseOnMobile(): React.JSX.Element | null {
  const { isMobile, setOpenMobile } = useSidebar();
  React.useEffect(() => { if (isMobile) setOpenMobile(false); }, [isMobile, setOpenMobile]);
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
            const clusterTitle = CLUSTER_BY_FIRST_ID[id];

            return (
              <section key={id} id={id} className="w-full scroll-mt-16 px-6 py-12">
                <div className="mx-auto max-w-6xl">
                  {/* cluster heading (only before the first section of a cluster) */}
                  {id !== "hello" && clusterTitle && (
                    <div className="mb-6">
                      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{clusterTitle}</span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    </div>
                  )}

                  <h1 className="mb-4 text-2xl font-semibold tracking-tight">
                    {label.replace(/\.tsx$/i, "")}
                  </h1>

                  {/* --- Hello section: square card grid --- */}
                  {id === "building-blocks" ? (
                    <div className="space-y-6">
                      <p className="text-sm text-muted-foreground max-w-prose">
                        A curated library of React&nbsp;19 + Tailwind&nbsp;v4 analytics components,
                        showcased in a Next.js&nbsp;15.5 App Router demo. Jump into a cluster below.
                      </p>

                      <div className="@container">
                        {/* Auto-fit cards; compact on mobile, square from @md: */}
                        <div className="grid gap-3 @md:gap-4 grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
                        {clusterCards.map((c, i) => (
                          <a
                            key={c.id}
                            href={`#${c.id}`}
                            className="group block rounded-xl border bg-card shadow-sm transition
                                       hover:shadow-md hover:border-accent focus-visible:outline-none
                                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label={`Go to ${c.title}`}
                          >
                            {/* Mobile: 16/9 rectangle; Desktop+: square */}
                            <div className="aspect-[8/3] @md:aspect-square p-3 @md:p-4 flex flex-col items-center justify-center text-center">
                              <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-accent text-sm font-semibold">
                                {i + 1}
                              </div>
                              <h3 className="text-lg font-semibold leading-6">{c.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                      </div>
                    </div>
                  ) : (
                    // other sections via registries, else skeleton
                    renderFoundationsDemo(id) ??
                    renderTrendsDemo(id) ??
                    renderCategoryDemo(id) ??
                    renderDistributionDemo(id) ??
                    renderLiveDemo(id) ?? (
                      <div className="space-y-4">
                        <div className="h-5 w-1/3 rounded bg-muted" />
                        <div className="h-4 w-full rounded bg-muted" />
                        <div className="h-4 w-11/12 rounded bg-muted" />
                        <div className="h-4 w-4/5 rounded bg-muted" />
                        <div className="h-80 rounded border border-dashed" />
                      </div>
                    )
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
