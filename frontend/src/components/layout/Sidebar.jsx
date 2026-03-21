// frontend/src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  Mic,
  Video,
  User,
  FileText,
  ImageIcon,
} from "lucide-react";

const Sidebar = () => {
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clinical Assessments", href: "/assessments", icon: Brain },
    {
      name: "AI Analysis",
      href: "#",
      icon: Brain,
      children: [
        { name: "Text Analysis", href: "/text-analysis", icon: FileText },
        { name: "Image Analysis", href: "/image-analysis", icon: ImageIcon },
        { name: "Audio Analysis", href: "/audio-analysis", icon: Mic },
        { name: "Video Analysis", href: "/video-analysis", icon: Video },
      ],
    },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const [expandedSections, setExpandedSections] = React.useState({
    "AI Analysis": true,
  });

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MH</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            MindCare AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  {/* Expandable Section Header */}
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                      expandedSections[item.name]
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedSections[item.name] ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Child Items */}
                  {expandedSections[item.name] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "text-gray-700 hover:bg-gray-50"
                            }`
                          }
                        >
                          <child.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            {child.name}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Regular Navigation Item */
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">
              🧠 AI-Powered Mental Health Insights
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Multi-modal emotion analysis for comprehensive care
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
