import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatThread from "@/components/ChatThread";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import { toast } from "sonner";

/**
 * Main dashboard for managing WhatsApp conversations and AI agent
 */

type ViewMode = "conversations" | "escalations" | "analytics" | "settings";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("conversations");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getBusinesses = trpc.onboarding.getBusinesses.useQuery();
  const currentBusiness = getBusinesses.data?.[0];

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Business Found</h2>
            <p className="text-slate-600 mb-4">Please complete onboarding first</p>
            <Button
              onClick={() => navigate("/onboarding")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Onboarding
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 rounded-lg p-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">WhatsApp AI</h1>
              <p className="text-xs text-slate-500">Agent Manager</p>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="p-4 border-b border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Current Business</p>
          <p className="text-sm font-medium text-slate-900 mt-1">{currentBusiness.businessName}</p>
          <p className="text-xs text-slate-500 mt-1">{currentBusiness.whatsappPhoneNumber}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setViewMode("conversations");
              setSelectedConversationId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === "conversations"
                ? "bg-green-50 text-green-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>All Conversations</span>
          </button>

          <button
            onClick={() => {
              setViewMode("escalations");
              setSelectedConversationId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === "escalations"
                ? "bg-amber-50 text-amber-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span>Waiting for You</span>
          </button>

          <button
            onClick={() => {
              setViewMode("analytics");
              setSelectedConversationId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === "analytics"
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => {
              setViewMode("settings");
              setSelectedConversationId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === "settings"
                ? "bg-slate-100 text-slate-900 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-bold text-slate-900">
              {viewMode === "conversations" && "All Conversations"}
              {viewMode === "escalations" && "Waiting for You"}
              {viewMode === "analytics" && "Analytics"}
              {viewMode === "settings" && "Settings"}
            </h2>
          </div>

          {viewMode === "conversations" && (
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Conversation List */}
          {(viewMode === "conversations" || viewMode === "escalations") && (
            <div className="w-80 border-r border-slate-200 overflow-y-auto">
              <ConversationList
                businessId={currentBusiness.id}
                viewMode={viewMode}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {/* Right Panel - Chat or Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "conversations" && selectedConversationId ? (
              <ChatThread
                conversationId={selectedConversationId}
                businessId={currentBusiness.id}
              />
            ) : viewMode === "escalations" && selectedConversationId ? (
              <ChatThread
                conversationId={selectedConversationId}
                businessId={currentBusiness.id}
              />
            ) : viewMode === "analytics" ? (
              <AnalyticsPanel businessId={currentBusiness.id} />
            ) : viewMode === "settings" ? (
              <SettingsPanel business={currentBusiness} />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Select a conversation to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings panel component
 */
function SettingsPanel({ business }: { business: any }) {
  return (
    <div className="p-6 overflow-y-auto">
      <div className="max-w-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Business Settings</h3>

        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Business Information</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600">Business Name</p>
                <p className="font-medium text-slate-900">{business.businessName}</p>
              </div>
              <div>
                <p className="text-slate-600">WhatsApp Phone Number</p>
                <p className="font-medium text-slate-900">{business.whatsappPhoneNumber}</p>
              </div>
              <div>
                <p className="text-slate-600">Agent Name</p>
                <p className="font-medium text-slate-900">{business.agentName}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Agent Configuration</h4>
            <div className="space-y-3 text-sm">
              {business.agentPersona && (
                <div>
                  <p className="text-slate-600">Persona</p>
                  <p className="text-slate-900">{business.agentPersona}</p>
                </div>
              )}
              {business.systemPrompt && (
                <div>
                  <p className="text-slate-600">System Prompt</p>
                  <p className="text-slate-900">{business.systemPrompt}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
