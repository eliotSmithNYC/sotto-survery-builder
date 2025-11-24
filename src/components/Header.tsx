"use client";

interface HeaderProps {
  onAddQuestion?: () => void;
}

export default function Header({ onAddQuestion }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold text-zinc-900">Survey Builder</h1>
        <button
          onClick={onAddQuestion}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
        >
          Add question
        </button>
      </div>
    </header>
  );
}
