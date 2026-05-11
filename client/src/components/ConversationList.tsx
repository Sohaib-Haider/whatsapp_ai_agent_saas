import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle } from "lucide-react";
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
    <div className="divide-y divide-slate-200">
      {filtered.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${
            selectedConversationId === conversation.id ? "bg-green-50" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900 truncate">
                  {conversation.customerName || conversation.customerPhoneNumber}
                </h3>
                {conversation.unreadCount > 0 && (
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate mt-1">
                {conversation.customerPhoneNumber}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!conversation.aiEnabled && (
                <div className="w-2 h-2 bg-amber-500 rounded-full" title="AI disabled" />
              )}
              {conversation.isWaitingForHuman && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Waiting for human" />
              )}
            </div>
          </div>

          {conversation.lastMessageAt && (
            <p className="text-xs text-slate-400 mt-2">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
