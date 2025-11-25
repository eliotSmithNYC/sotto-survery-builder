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
    <div className="md:hidden">
      <div className="border-b border-zinc-200 bg-white">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-zinc-900 border-b-2 border-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
