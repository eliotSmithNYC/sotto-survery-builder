"use client";

import MenuIcon from "./icons/MenuIcon";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900">
            Survey Builder
          </h1>
        </div>
      </div>
    </header>
  );
}
