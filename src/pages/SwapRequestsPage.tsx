import React, { useState, useEffect } from 'react';
import { SwapRequest } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Repeat,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface SwapRequestsPageProps {
  onOpenChat: (conversationId: string) => void;
  onNavigate: (page: string) => void;
}

export const SwapRequestsPage: React.FC<SwapRequestsPageProps> = ({
  onOpenChat,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSwaps = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.swapRequests.getAll();
      setSwaps(res.swaps);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch swap requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSwaps();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center max-w-md shadow-xs">
          <Repeat className="w-12 h-12 text-[#C85A32] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Sign in to View Swaps</h2>
          <p className="text-xs text-stone-600 mb-6">
            Log in to submit and respond to item-for-item art material exchange proposals.
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

  const receivedSwaps = swaps.filter(s => s.recipientId === user.id);
  const sentSwaps = swaps.filter(s => s.requesterId === user.id);
  const displayedSwaps = activeTab === 'received' ? receivedSwaps : sentSwaps;

  const handleUpdateStatus = async (swapId: string, status: SwapRequest['status']) => {
    try {
      setError(null);
      await api.swapRequests.updateStatus(swapId, status);
      setActionSuccess(`Swap status updated to ${status}.`);
      fetchSwaps();
    } catch (err: any) {
      setError(err.message || 'Failed to update swap request status.');
    }
  };

  const getStatusBadge = (status: SwapRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200 rounded flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 rounded flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Accepted • In Coordination</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200 rounded flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exchange Completed</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-900 border border-red-200 rounded">
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-stone-200 text-stone-700 rounded">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-orange-100 text-[#C85A32] text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Repeat className="w-3 h-3" />
                <span>Item-for-Item Barter</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Swap Proposals & Exchanges
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Exchange excess paints, brushes, and surfaces without spending currency.
              </p>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'received'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Received Proposals</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-stone-200 text-stone-800 rounded-full font-bold">
                  {receivedSwaps.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'sent'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Sent Proposals</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-stone-200 text-stone-800 rounded-full font-bold">
                  {sentSwaps.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Alerts */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-stone-500">Checking exchange records...</p>
          </div>
        ) : displayedSwaps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <Repeat className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">
              No {activeTab === 'received' ? 'Received' : 'Sent'} Swap Proposals
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              {activeTab === 'received'
                ? 'When another student proposes an exchange for one of your listed items, it will appear here.'
                : 'Browse the marketplace to find art supplies you need and propose a swap with your materials!'}
            </p>
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-4 py-2 bg-[#C85A32] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Browse Marketplace Supplies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSwaps.map(swap => {
              const isRecipient = swap.recipientId === user.id;
              const isRequester = swap.requesterId === user.id;

              return (
                <div
                  key={swap.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-stone-500">
                        {isRecipient
                          ? `Proposal from: ${swap.requesterName || 'Artist'}`
                          : `Proposal sent to: ${swap.recipientName || 'Artist'}`}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-400">
                        {new Date(swap.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(swap.status)}</div>
                  </div>

                  {/* Side-by-side comparison of items */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    {/* Item 1: Offered Item */}
                    <div className="md:col-span-5 bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 flex items-center space-x-3.5">
                      <img
                        src={swap.offeredProductImageUrl}
                        alt={swap.offeredProductTitle}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-200"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Offered Material
                        </span>
                        <h4 className="font-semibold text-stone-900 text-sm truncate">
                          {swap.offeredProductTitle}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          By: {swap.requesterName || 'Requester'}
                        </p>
                      </div>
                    </div>

                    {/* Swap icon arrow */}
                    <div className="md:col-span-1 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#C85A32] flex items-center justify-center">
                        <Repeat className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Item 2: Desired Item */}
                    <div className="md:col-span-5 bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 flex items-center space-x-3.5">
                      <img
                        src={swap.requestedProductImageUrl}
                        alt={swap.requestedProductTitle}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-200"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Desired Material
                        </span>
                        <h4 className="font-semibold text-stone-900 text-sm truncate">
                          {swap.requestedProductTitle}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Owned by: {swap.recipientName || 'Owner'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Note if present */}
                  {swap.message && (
                    <div className="mt-1 p-3 bg-amber-50/50 rounded-lg text-xs text-stone-700 border border-amber-100">
                      <strong>Note:</strong> "{swap.message}"
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('chat')}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 py-1.5 px-3 bg-stone-100 rounded-lg hover:bg-stone-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat to Coordinate Meeting</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {/* Recipient can accept or reject pending */}
                      {isRecipient && swap.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(swap.id, 'rejected')}
                            className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(swap.id, 'accepted')}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                          >
                            Accept Swap
                          </button>
                        </>
                      )}

                      {/* Requester can cancel pending */}
                      {isRequester && swap.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(swap.id, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg"
                        >
                          Cancel Proposal
                        </button>
                      )}

                      {/* Once accepted, either participant can mark completed after physical handoff */}
                      {swap.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(swap.id, 'completed')}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                        >
                          Confirm Materials Exchanged
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
