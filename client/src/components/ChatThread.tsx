import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AIToggleSwitch from "./AIToggleSwitch";
import ClearChatDialog from "./ClearChatDialog";

interface ChatThreadProps {
  conversationId: number;
  businessId: number;
}

export default function ChatThread({ conversationId, businessId }: ChatThreadProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getConversation = trpc.conversations.getConversation.useQuery({
    conversationId,
  });

  const sendMessage = trpc.conversations.sendMessage.useMutation();
  const toggleAI = trpc.conversations.toggleAI.useMutation();
  const markAsRead = trpc.conversations.markAsRead.useMutation();
  const clearChat = trpc.conversations.clearChat.useMutation();

  const conversation = getConversation.data;
  const messages = conversation?.messages || [];

  // Mark as read when conversation is opened
  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      markAsRead.mutate({ conversationId });
    }
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: messageInput.trim(),
      });
      setMessageInput("");
      getConversation.refetch();
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleToggleAI = async (enabled: boolean) => {
    if (!conversation) return;

    try {
      await toggleAI.mutateAsync({
        conversationId,
        aiEnabled: enabled,
      });
      getConversation.refetch();
    } catch (error) {
      toast.error("Failed to toggle AI");
      throw error;
    }
  };

  const handleClearChat = async () => {
    if (!conversation) return;

    try {
      await clearChat.mutateAsync({
        conversationId,
      });
      setIsClearDialogOpen(false);
      getConversation.refetch();
      toast.success("Chat cleared successfully");
    } catch (error) {
      toast.error("Failed to clear chat");
    }
  };

  if (getConversation.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">
            {conversation.customerName || conversation.customerPhoneNumber}
          </h3>
          <p className="text-xs text-slate-500">{conversation.customerPhoneNumber}</p>
        </div>

        <div className="flex items-center gap-3">
          {conversation.isWaitingForHuman && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Escalated</span>
            </div>
          )}

          {/* AI Toggle Switch */}
          <AIToggleSwitch
            isEnabled={conversation.aiEnabled}
            isLoading={toggleAI.isPending}
            onToggle={handleToggleAI}
          />

          {/* Clear Chat Button */}
          <Button
            onClick={() => setIsClearDialogOpen(true)}
            disabled={clearChat.isPending || messages.length === 0}
            variant="ghost"
            size="icon"
            title="Clear all messages"
            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            {clearChat.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>

          {/* Clear Chat Dialog */}
          <ClearChatDialog
            isOpen={isClearDialogOpen}
            isLoading={clearChat.isPending}
            onConfirm={handleClearChat}
            onCancel={() => setIsClearDialogOpen(false)}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderType === "customer" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.senderType === "customer"
                    ? "bg-slate-100 text-slate-900"
                    : message.senderType === "ai"
                      ? "bg-green-100 text-green-900"
                      : "bg-blue-600 text-white"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(message.createdAt), "HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!conversation.aiEnabled && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-2">
            <Input
              placeholder="Type your reply..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessage.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessage.isPending}
              className="bg-green-600 hover:bg-green-700"
              size="icon"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            AI is disabled. You can reply manually to this customer. Enable AI to activate auto-responses.
          </p>
        </div>
      )}

      {conversation.aiEnabled && (
        <div className="border-t border-slate-200 p-4 bg-green-50">
          <p className="text-xs text-green-700">
            ✓ AI is active and will automatically respond to customer messages. Reply with AGENT to escalate.
          </p>
        </div>
      )}
    </div>
  );
}
