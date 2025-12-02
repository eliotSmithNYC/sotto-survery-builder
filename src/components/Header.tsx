"use client";

import MenuIcon from "./icons/MenuIcon";
import Button from "./ui/Button";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onToggleSidebar}
            className="md:hidden -ml-2"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold text-zinc-900">
            Survey Builder
          </h1>
        </div>
      </div>
    </header>
  );
}
