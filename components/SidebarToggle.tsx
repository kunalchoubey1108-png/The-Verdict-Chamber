"use client";

import { useEffect, useState } from "react";

export function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        if (next) {
          sidebar.classList.add("sidebar-open");
        } else {
          sidebar.classList.remove("sidebar-open");
        }
      }
      window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { open: next } }));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("sidebar-open");
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { open: false } }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <button
      id="sidebar-toggle-btn"
      type="button"
      onClick={toggle}
      className="fixed top-2.5 left-4 z-[1100] inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-carbon border-2 border-graphite text-white font-tech text-xs font-bold uppercase tracking-wider hover:border-cb-orange hover:text-cb-orange transition-colors cursor-pointer shadow-brutal select-none"
      title={isOpen ? "Hide Sidebar [Esc]" : "Show Sidebar"}
      aria-label="Toggle Sidebar"
      aria-expanded={isOpen}
    >
      <span className="text-cb-orange font-mono text-sm leading-none">
        {isOpen ? "✕" : "☰"}
      </span>
      <span className="hidden sm:inline">
        {isOpen ? "HIDE SIDEBAR" : "SIDEBAR"}
      </span>
    </button>
  );
}
