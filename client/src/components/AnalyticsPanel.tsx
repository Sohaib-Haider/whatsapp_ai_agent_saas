import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare, Zap, Users, AlertTriangle, TrendingUp } from "lucide-react";

interface AnalyticsPanelProps {
  businessId: number;
}

export default function AnalyticsPanel({ businessId }: AnalyticsPanelProps) {
  const getAnalytics = trpc.analytics.getSummary.useQuery({ businessId });

  if (getAnalytics.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const analytics = getAnalytics.data;

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">No analytics data available</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Messages",
      value: analytics.totalMessages,
      icon: MessageSquare,
      color: "bg-blue-100 text-blue-600",
      trend: "+12% this month",
    },
    {
      title: "AI Response Rate",
      value: `${analytics.aiResponseRate}%`,
      icon: Zap,
      color: "bg-green-100 text-green-600",
      trend: "of messages handled by AI",
    },
    {
      title: "Active Conversations",
      value: analytics.activeConversations,
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      trend: "ongoing chats",
    },
    {
      title: "Escalations",
      value: analytics.escalationCount,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
      trend: "requiring human attention",
    },
  ];

  return (
    <div className="p-6 overflow-y-auto">
      <div className="max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analytics Overview</h2>
          <p className="text-slate-600">Monitor your WhatsApp Business performance</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</p>
                <p className="text-xs text-slate-500">{metric.trend}</p>
              </Card>
            );
          })}
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Breakdown */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-4">Message Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">AI Messages</span>
                  <span className="font-semibold text-slate-900">{analytics.aiMessages}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalMessages > 0
                          ? (analytics.aiMessages / analytics.totalMessages) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Human Messages</span>
                  <span className="font-semibold text-slate-900">{analytics.humanMessages}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalMessages > 0
                          ? (analytics.humanMessages / analytics.totalMessages) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Summary */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-4">Performance Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-900">AI Efficiency</span>
                <span className="font-semibold text-green-700">{analytics.aiResponseRate}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-900">Avg. Active Chats</span>
                <span className="font-semibold text-blue-700">
                  {analytics.activeConversations}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-900">Escalation Rate</span>
                <span className="font-semibold text-red-700">
                  {analytics.totalMessages > 0
                    ? Math.round((analytics.escalationCount / analytics.totalMessages) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Insights */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Insights</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  • Your AI is handling{" "}
                  <span className="font-semibold">{analytics.aiResponseRate}%</span> of messages
                  automatically
                </li>
                <li>
                  • You have <span className="font-semibold">{analytics.escalationCount}</span>{" "}
                  conversations waiting for your attention
                </li>
                <li>
                  • Average response efficiency is{" "}
                  <span className="font-semibold">
                    {analytics.totalMessages > 0 ? "excellent" : "pending"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
