// components/nav/AppSidebar.tsx
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  IconHome2,
  IconGauge,
  IconLayoutGrid,
  IconTable,
  IconAdjustmentsHorizontal,
  IconChartAreaLine,
  IconChartLine,
  IconWaveSine,
  IconColumns,
  IconChartBar,
  IconChartDonut,
  IconChartHistogram,
  IconGridDots,
  IconChartFunnel,
  IconTimeline,
  IconCards,
  IconTopologyStar3,
  IconNumber100Small,
  IconLivePhoto,
  IconRipple,
  IconCircle,
  IconExclamationCircle,
  IconGaugeFilled,
  IconChartSankey,
  IconChartScatter,
  IconWorld
} from "@tabler/icons-react";

import { type Icon } from "@tabler/icons-react";

type SidebarSection = { label: string; items: string[] };

const STRUCTURE: SidebarSection[] = [
  { label: "Building Blocks", items: ["Building blocks"] },
  { label: "Foundations", items: ["KPI Stat", "Stat Grid", "Data Table", "Control Bar", "Radial Gauge"] },
  { label: "Trends", items: ["Area Series", "Line Series", "Band Line","Scatter Plot","Sankey Diagram"] },
  { label: "Category", items: ["Bar List", "Grouped Bar", "Donut Chart"] },
  { label: "Distribution", items: ["Histogram", "Heatmap","World Map"] },
  { label: "LIve", items: ["Live Tail List", "Live Traces Feed"] },
];

const toId = (label: string): string =>
  label
    .replace(/\.tsx$/i, "")
    .trim()
    .replace(/([A-Z])(?=[A-Z][a-z])/g, "$1-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

// Standardize icon prop type to the first imported icon's props.

const ICONS: Record<string, Icon> = {
  // top
  "building-blocks": IconHome2,
  // Foundations
  "kpi-stat": IconGauge,
  "stat-grid": IconLayoutGrid,
  "data-table": IconTable,
  "control-bar": IconAdjustmentsHorizontal,
  "radial-gauge": IconGaugeFilled,
  // Trends
  "area-series": IconChartAreaLine,
  "line-series": IconChartLine,
  "band-line": IconWaveSine,
  "scatter-plot": IconChartScatter,
  "sankey-diagram": IconChartSankey,
  // Category
  "bar-list": IconColumns,
  "grouped-bar": IconChartBar,
  "donut-chart": IconChartDonut,
  // distribution
  "histogram": IconChartHistogram,
  "heatmap": IconGridDots,
  "world-map": IconWorld,
  // Specialized
  "funnel": IconChartFunnel,
  "timeline": IconTimeline,
  "compare-cards": IconCards,
  "graph-service-map": IconTopologyStar3,
  // SLO
  "gauge": IconGauge,
  "error-budget-line": IconExclamationCircle,
  "saturation-band": IconNumber100Small,
  // Live
  "live-tail-list": IconLivePhoto,
  "live-traces-feed": IconRipple,
};

export default function AppSidebar(): React.JSX.Element {
  const { isMobile, setOpenMobile } = useSidebar(); // documented API for mobile control. :contentReference[oaicite:2]{index=2}

  const onAnchorClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (isMobile) setOpenMobile(false);
    },
    [isMobile, setOpenMobile]
  );

  return (
    // inset + icon-collapsible; content remains scrollable; shell spans viewport height.
    <Sidebar side="left" variant="inset" collapsible="icon" className="h-svh">
      <SidebarHeader>
        <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
          Navigation
        </div>
      </SidebarHeader>

      <SidebarContent>
        {STRUCTURE.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-semibold group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const id = toId(item);
                  const iconKey =
                    id === "gauge-tsx"
                      ? "gauge"
                      : id === "errorbudgetline-tsx"
                      ? "errorbudgetline"
                      : id === "saturationband-tsx"
                      ? "saturationband"
                      : id;
                  const Icon = ICONS[iconKey] ?? IconCircle;

                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton asChild className="font-semibold">
                        <a href={`#${id}`} aria-label={item} onClick={(e) => onAnchorClick(e, id)}>
                          <Icon className="size-4 shrink-0" stroke={1.7} />
                          <span className="truncate group-data-[collapsible=icon]:hidden">
                            {item.replace(/\.tsx$/i, "")}
                          </span>
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

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="px-2 py-2 text-xs text-muted-foreground">cmd/ctrl + b toggles</div>
      </SidebarFooter>

      {/* Optional rail for quick hover/toggle affordance */}
      <SidebarRail />
    </Sidebar>
  );
}
