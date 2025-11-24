"use client";

type Tab = "build" | "preview" | "json";

interface TabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "build", label: "Build" },
    { id: "preview", label: "Preview" },
    { id: "json", label: "JSON" },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-zinc-50"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

