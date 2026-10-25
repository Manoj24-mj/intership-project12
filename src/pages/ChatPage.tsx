import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  MessageSquare,
  Send,
  RefreshCw,
  User as UserIcon,
  ShoppingBag,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ChatPageProps {
  initialConversationId?: string;
  onNavigate: (page: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialConversationId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (autoSelect = false) => {
    if (!user) return;
    try {
      setLoadingConvs(true);
      setError(null);
      const res = await api.chat.getConversations();
      setConversations(res.conversations);

      if (autoSelect && res.conversations.length > 0 && !activeConvId) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.chat.getMessages(convId);
      setMessages(res.messages);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to load message history.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations(true);
    }
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Gentle polling every 5 seconds for new messages
      const interval = setInterval(() => {
        fetchMessages(activeConvId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center max-w-md shadow-xs">
          <MessageSquare className="w-12 h-12 text-[#C85A32] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Sign in to Access Chat</h2>
          <p className="text-xs text-stone-600 mb-6">
            Log in to talk with art material sellers and coordinate swaps securely.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 bg-[#C85A32] text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim()) return;

    try {
      setSending(true);
      const res = await api.chat.sendMessage(activeConvId, newMessage.trim());
      setMessages(prev => [...prev, res.message]);
      setNewMessage('');
      setTimeout(scrollToBottom, 50);

      // Refresh list to update snippet
      fetchConversations(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Helper to get other participant name
  const getOtherParticipantName = (conv: Conversation) => {
    const otherId = conv.participantIds.find(id => id !== user.id);
    if (!otherId) return 'Artist';
    return conv.participantNames?.[otherId] || 'Fellow Artist';
  };

  return (
    <div className="bg-[#FAF7F2] p-4 sm:p-6 lg:p-8 flex-1">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-[680px] flex flex-col md:flex-row">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col shrink-0 bg-stone-100/60">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">Conversations</h2>
              <p className="text-[11px] text-stone-500">Peer-to-peer artist chats</p>
            </div>
            <button
              onClick={() => fetchConversations(false)}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded border border-stone-200 bg-stone-50"
              title="Refresh conversation list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-200/80">
            {loadingConvs ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-stone-600">No conversations yet</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Click "Express Buy", "Request Swap", or "Contact Seller" on any marketplace item to start chatting.
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = conv.id === activeConvId;
                const otherName = getOtherParticipantName(conv);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start space-x-3 border-b border-stone-200/60 ${
                      isActive
                        ? 'bg-amber-100/80 border-l-4 border-l-[#C85A32]'
                        : 'bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-stone-800 text-amber-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {otherName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{otherName}</h4>
                        <span className="text-[10px] text-stone-500 font-medium">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {conv.productTitle && (
                        <p className="text-[11px] text-[#C85A32] font-semibold truncate flex items-center space-x-1 mt-0.5">
                          <ShoppingBag className="w-3 h-3 shrink-0" />
                          <span className="truncate">{conv.productTitle}</span>
                        </p>
                      )}
                      <p className="text-xs text-stone-600 truncate mt-0.5">
                        {conv.lastMessage || 'New conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel: Active Message History */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-stone-800 text-amber-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {getOtherParticipantName(activeConv).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 truncate">
                      {getOtherParticipantName(activeConv)}
                    </h3>
                    {activeConv.productTitle ? (
                      <p className="text-xs text-[#C85A32] font-medium truncate">
                        Regarding: {activeConv.productTitle}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-500">Direct Discussion</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchMessages(activeConv.id)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded border border-stone-200 bg-white"
                    title="Refresh messages"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]/40">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-stone-500">
                    Loading chat messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-stone-400">
                    <p className="text-xs font-semibold text-stone-600">No messages yet</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Say hello to introduce yourself and coordinate exchange time and place!
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-baseline space-x-1 mb-0.5">
                          <span className="text-[10px] font-semibold text-stone-500">
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          <span className="text-[9px] text-stone-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-stone-900 text-white rounded-tr-xs'
                              : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error banner if send failed */}
              {error && (
                <div className="px-4 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="font-semibold underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Input bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 bg-white flex gap-2">
                <input
                  type="text"
                  maxLength={2000}
                  placeholder="Type your message to coordinate swap, meeting point, or payment..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-[#C85A32] hover:bg-[#B04C27] disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <MessageSquare className="w-12 h-12 mb-3 text-stone-300" />
              <h3 className="font-serif font-bold text-lg text-stone-800">Your Artist Messages</h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Select an existing conversation from the left, or initiate one from any product details card.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
