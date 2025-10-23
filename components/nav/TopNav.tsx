// components/nav/TopNav.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconMenu2, IconExternalLink } from "@tabler/icons-react";

export default function TopNav(): React.JSX.Element {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* 3-column grid on mobile to keep brand centered; flex on md+ */}
        <div className="grid h-14 grid-cols-3 items-center md:flex md:h-14 md:items-center md:justify-between">
          {/* Left (mobile): sidebar trigger; Desktop: optional space */}
          <div className="flex items-center gap-2">
            <div>
              <SidebarTrigger aria-label="Toggle sidebar" />
            </div>
          </div>

          {/* Brand — centered on mobile, left-aligned on desktop */}
          <Link
            href="/"
            className="col-start-2 col-end-3 flex items-center justify-center gap-2 md:col-auto md:justify-start"
            aria-label="Depths Components Home"
          >
            <Image
              src="/logo.png"
              alt="Depths logo"
              width={24}
              height={24}
              className="rounded-sm"
              priority
            />
            <span className="text-sm md:text-base font-bold">
              Depths <em className="not-italic italic font-bold">Components</em>
            </span>
          </Link>

          {/* Right: desktop links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="https://www.depthsai.com/" className="text-sm font-semibold" target="_blank" rel="noreferrer">
              Home
            </Link>
            <Link href="http://docs.depthsai.com/" className="text-sm font-semibold" target="_blank" rel="noreferrer">
              Docs
            </Link>
            <Link href="https://github.com/Depths-AI/depths" className="text-sm font-semibold" target="_blank" rel="noreferrer">
              Github
            </Link>
          </nav>

          {/* Right: mobile dropdown */}
          <div className="col-start-3 col-end-4 flex justify-end md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-9 items-center justify-center rounded-md border bg-background"
                aria-label="Open navigation"
              >
                <IconMenu2 className="size-5" stroke={1.8} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <a href="https://www.depthsai.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                    Home <IconExternalLink className="size-4" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="http://docs.depthsai.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                    Docs <IconExternalLink className="size-4" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://github.com/Depths-AI/depths" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                    Github <IconExternalLink className="size-4" />
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
