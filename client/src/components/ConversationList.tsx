import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  businessId: number;
  viewMode: "conversations" | "escalations";
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  searchQuery: string;
}

export default function ConversationList({
  businessId,
  viewMode,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
}: ConversationListProps) {
  const getConversations = trpc.conversations.getConversations.useQuery({
    businessId,
  });

  const getEscalated = trpc.conversations.getEscalatedConversations.useQuery({
    businessId,
  });

  const isLoading = viewMode === "conversations" ? getConversations.isLoading : getEscalated.isLoading;
  const conversations =
    viewMode === "conversations"
      ? getConversations.data || []
      : getEscalated.data || [];

  const filtered = conversations.filter((conv) =>
    conv.customerPhoneNumber.includes(searchQuery) ||
    (conv.customerName && conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageCircle className="w-12 h-12 text-slate-200 mb-3" />
        <p className="text-slate-500">
          {searchQuery ? "No conversations match your search" : "No conversations yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 h-full overflow-y-auto">
      {filtered.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={`w-full p-4 text-left transition-all hover:bg-slate-50 border-l-4 ${
            selectedConversationId === conversation.id
              ? "bg-green-50 border-l-green-600"
              : "border-l-transparent hover:border-l-slate-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">
                  {conversation.customerName || conversation.customerPhoneNumber}
                </h3>
                {conversation.unreadCount > 0 && (
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {conversation.customerPhoneNumber}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!conversation.aiEnabled && (
                <div
                  className="w-2.5 h-2.5 bg-amber-500 rounded-full"
                  title="AI disabled"
                />
              )}
              {conversation.isWaitingForHuman && (
                <div
                  className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"
                  title="Waiting for human"
                />
              )}
            </div>
          </div>

          {/* Last message preview */}
          <div className="mb-2">
            <p className="text-sm text-slate-600 truncate line-clamp-1">
              Last message preview
            </p>
          </div>

          {/* Timestamp and status */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {conversation.lastMessageAt
                ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
                : "No activity"}
            </p>
            {conversation.isWaitingForHuman && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Needs attention</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
