"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Convert display label -> lower-case, dash-separated id (strip .tsx)
const toId = (label: string): string =>
  label
    .replace(/\.tsx$/i, "")
    .trim()
    .replace(/([A-Z])(?=[A-Z][a-z])/g, "$1-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

type SidebarSection = {
  label: string;
  items: string[];
};

const STRUCTURE: SidebarSection[] = [
  { label: "Hello", items: ["Hello"] },
  {
    label: "Foundations",
    items: ["KPI Stat", "Stat Grid", "Data Table", "Control Bar"],
  },
  {
    label: "Trends",
    items: ["Area Series", "Line Series", "Band Line", "Sparkline Card"],
  },
  {
    label: "Category",
    items: ["Bar List", "Grouped Bar", "Donut Chart"],
  },
  {
    label: "distribution",
    items: ["Histogram", "Heatmap"],
  },
  {
    label: "Specialized",
    items: ["Funnel", "Timeline", "Compare Cards", "Graph Service Map"],
  },
  {
    label: "SLO",
    items: ["Gauge.tsx", "ErrorBudgetLine.tsx", "SaturationBand.tsx"],
  },
  {
    label: "LIve",
    items: ["Live Tail List", "Live Traces Feed"],
  },
];

export default function AppSidebar(): React.JSX.Element {
  const { isMobile, setOpenMobile } = useSidebar(); // official hook for mobile control :contentReference[oaicite:5]{index=5}

  const onAnchorClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // Close the offcanvas drawer on mobile after navigation
      if (isMobile) setOpenMobile(false);
    },
    [isMobile, setOpenMobile]
  );

  return (
    // variant="inset" requires wrapping main content with <SidebarInset /> in page.tsx. :contentReference[oaicite:6]{index=6}
    <Sidebar side="left" variant="inset" collapsible="icon" className="h-svh">
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Navigation
        </div>
      </SidebarHeader>

      {/* Scrollable region per docs */}
      <SidebarContent>
        {STRUCTURE.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const id = toId(item);
                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        asChild
                        // isActive could be set by observing intersection, omitted for brevity. :contentReference[oaicite:7]{index=7}
                      >
                        <a
                          href={`#${id}`}
                          aria-label={item}
                          onClick={(e) => onAnchorClick(e, id)}
                        >
                          <span>{item.replace(/\.tsx$/i, "")}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">
          cmd/ctrl + b toggles sidebar
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
