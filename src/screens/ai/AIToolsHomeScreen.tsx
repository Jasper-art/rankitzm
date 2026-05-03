import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: "done" | "coming";
}

export default function AIToolsHomeScreen() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const navigate = useNavigate();

  const aiTools: AITool[] = [
    {
      id: "lesson-plan",
      name: "📚 Lesson Planner",
      description: "Generate daily lesson plans aligned to CDC standards",
      icon: "📚",
      color: "from-blue-500 to-blue-600",
      status: "done",
    },
    {
      id: "schemes-of-work",
      name: "📅 Schemes of Work",
      description: "Generate termly overviews (simple or official MoE format)",
      icon: "📅",
      color: "from-purple-500 to-purple-600",
      status: "done",
    },
    {
      id: "records-of-work",
      name: "📝 Records of Work",
      description: "Daily teaching records with AI summaries",
      icon: "📝",
      color: "from-green-500 to-green-600",
      status: "done",
    },
    {
      id: "weekly-forecast",
      name: "🗓️ Weekly Forecast",
      description: "Plan the full week - Monday to Friday activities",
      icon: "🗓️",
      color: "from-cyan-500 to-cyan-600",
      status: "done",
    },
  ];

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    navigate(`/ai-tools/${toolId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
          AI Teaching Assistant
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
          Generate CDC & CBC-aligned lesson plans, schemes, assessments, and
          reports in seconds
        </p>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {aiTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              disabled={tool.status === "coming"}
              className={`relative group p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl transition-all duration-300 w-full ${
                tool.status === "coming"
                  ? "bg-gray-100 opacity-50 cursor-not-allowed"
                  : "bg-white shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:scale-100 sm:hover:scale-105 cursor-pointer active:scale-95 sm:active:scale-100"
              }`}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />

              {/* Content */}
              <div className="relative z-10 text-left h-full flex flex-col">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">
                  {tool.icon}
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground mb-1 sm:mb-2 line-clamp-2">
                  {tool.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 flex-grow">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span
                    className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                      tool.status === "done"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tool.status === "done" ? "✓ Ready" : "🔜 Soon"}
                  </span>
                  {tool.status === "done" && (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <div className="text-center p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              4
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Tools Ready</p>
          </div>
          <div className="text-center p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              1-12
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Grades Covered
            </p>
          </div>
          <div className="text-center p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              8
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Languages</p>
          </div>
          <div className="text-center p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
              CDC/CBC
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">MoE Aligned</p>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <h2 className="text-xl sm:text-2xl md:text-2xl font-bold mb-4 sm:mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="p-4 sm:p-5 md:p-6 bg-white rounded-lg sm:rounded-lg shadow-sm sm:shadow hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⚡</div>
              <h3 className="font-bold text-sm sm:text-base mb-1 sm:mb-2">
                Fast Generation
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Create lesson plans in seconds with Gemini AI
              </p>
            </div>
            <div className="p-4 sm:p-5 md:p-6 bg-white rounded-lg sm:rounded-lg shadow-sm sm:shadow hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📱</div>
              <h3 className="font-bold text-sm sm:text-base mb-1 sm:mb-2">
                Works Offline
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Access saved documents anytime without internet
              </p>
            </div>
            <div className="p-4 sm:p-5 md:p-6 bg-white rounded-lg sm:rounded-lg shadow-sm sm:shadow hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🖨️</div>
              <h3 className="font-bold text-sm sm:text-base mb-1 sm:mb-2">
                Print & Export
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Export to PDF, CSV and print directly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 sm:mt-12 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-gray-600 px-2">
        <p className="leading-relaxed">
          Built for Zambian teachers • Aligned with MoE CDC & CBC standards
        </p>
        <p className="mt-2 leading-relaxed">
          Part of RankItZM Teaching Assistant Module
        </p>
      </div>
    </div>
  );
}
