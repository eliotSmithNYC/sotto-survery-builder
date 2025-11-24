"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import QuestionSidebar from "@/components/QuestionSidebar";

type Tab = "build" | "preview" | "json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("build");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>();

  const handleAddQuestion = () => {
    // Will be wired up in Step 3
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <Header onAddQuestion={handleAddQuestion} onToggleSidebar={handleToggleSidebar} />

      <div className="md:hidden">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseSidebar}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <QuestionSidebar
            questions={[]}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
            onAddQuestion={handleAddQuestion}
            onClose={handleCloseSidebar}
          />
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
