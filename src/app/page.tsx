"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";

type Tab = "build" | "preview" | "json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("build");

  const handleAddQuestion = () => {
    // Will be wired up in Step 3
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <Header onAddQuestion={handleAddQuestion} />

      <div className="md:hidden">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-64 border-r border-zinc-200 bg-white">
          {/* Sidebar - will be populated in Step 2 */}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Builder area - will be populated in Step 4 */}
            {activeTab === "build" && (
              <div className="p-4 md:p-6">
                <p className="text-zinc-600">Builder area</p>
              </div>
            )}
            {activeTab === "preview" && (
              <div className="p-4 md:p-6">
                <p className="text-zinc-600">Preview area</p>
              </div>
            )}
            {activeTab === "json" && (
              <div className="p-4 md:p-6">
                <p className="text-zinc-600">JSON view</p>
              </div>
            )}
          </div>

          <div className="hidden md:block w-64 border-l border-zinc-200 bg-white">
            {/* Properties panel - will be populated in Step 6 */}
          </div>
        </div>
      </div>

      <div className="hidden md:block h-12 border-t border-zinc-200 bg-white">
        {/* JSON drawer - will be populated in Step 7 */}
      </div>
    </div>
  );
}
