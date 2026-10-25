import React, { useState, useEffect } from 'react';
import { BuyRequest } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatINR } from '../utils/rules.ts';
import { handleImageFallback, DEFAULT_ART_IMAGE } from '../utils/imageUtils.ts';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface BuyRequestsPageProps {
  onOpenChat: (conversationId: string) => void;
  onNavigate: (page: string) => void;
}

export const BuyRequestsPage: React.FC<BuyRequestsPageProps> = ({
  onOpenChat,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'selling' | 'buying'>('selling');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.buyRequests.getAll();
      setRequests(res.requests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch buy requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center max-w-md shadow-xs">
          <ShoppingBag className="w-12 h-12 text-[#C85A32] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Sign in to View Deals</h2>
          <p className="text-xs text-stone-600 mb-6">
            Log in to manage purchase interests and local transactions.
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

  const sellingRequests = requests.filter(r => r.sellerId === user.id);
  const buyingRequests = requests.filter(r => r.buyerId === user.id);
  const displayed = activeTab === 'selling' ? sellingRequests : buyingRequests;

  const handleUpdateStatus = async (requestId: string, status: BuyRequest['status']) => {
    try {
      setError(null);
      await api.buyRequests.updateStatus(requestId, status);
      setSuccess(`Request status updated to ${status}.`);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction status.');
    }
  };

  const getStatusBadge = (status: BuyRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200 rounded flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Seller Approval</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 rounded flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Accepted • Arrange Cash & Handoff</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200 rounded flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Handoff</span>
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
                <ShoppingBag className="w-3 h-3" />
                <span>Purchase Interest & Deals</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Direct Purchase Arrangements
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Coordinate independent peer-to-peer collection and cash handoffs without online middlemen.
              </p>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('selling')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'selling'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Incoming Orders (As Seller)</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-stone-200 text-stone-800 rounded-full font-bold">
                  {sellingRequests.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('buying')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'buying'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>My Buy Requests (As Buyer)</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-stone-200 text-stone-800 rounded-full font-bold">
                  {buyingRequests.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-xs font-semibold hover:underline">
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

        {/* List of deals */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-stone-500">Retrieving transactions...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">
              No {activeTab === 'selling' ? 'Incoming' : 'Outgoing'} Buy Requests
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              {activeTab === 'selling'
                ? 'When someone wants to purchase one of your listed art supplies, their request will appear here.'
                : 'Browse the marketplace to find affordable art materials and express buy interest!'}
            </p>
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-4 py-2 bg-[#C85A32] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Browse Art Supplies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(req => {
              const isSeller = req.sellerId === user.id;
              const isBuyer = req.buyerId === user.id;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-stone-700">
                        {isSeller
                          ? `Buyer: ${req.buyerName || 'Student Buyer'}`
                          : `Seller: ${req.sellerName || 'Artist'}`}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-400">
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 min-w-0">
                      {req.productImageUrl ? (
                        <img
                          src={req.productImageUrl}
                          alt={req.productTitle}
                          onError={handleImageFallback}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                        />
                      ) : (
                        <img
                          src={DEFAULT_ART_IMAGE}
                          alt={req.productTitle}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Product Requested
                        </span>
                        <h4 className="font-semibold text-stone-900 text-sm truncate">
                          {req.productTitle}
                        </h4>
                        <p className="text-sm font-bold text-stone-900 mt-1">
                          Agreed Price: {formatINR(req.productPrice || 0)}
                        </p>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-600 max-w-sm">
                        <span className="font-semibold text-stone-800">Buyer note:</span> "{req.notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('chat')}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 py-1.5 px-3 bg-stone-100 rounded-lg hover:bg-stone-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat to Coordinate Pickup</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {/* Seller actions on pending */}
                      {isSeller && req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'accepted')}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                          >
                            Accept & Reserve
                          </button>
                        </>
                      )}

                      {/* Buyer can cancel pending */}
                      {isBuyer && req.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg"
                        >
                          Cancel Request
                        </button>
                      )}

                      {/* When accepted, seller or buyer can confirm completed after payment and handoff */}
                      {req.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'completed')}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                        >
                          Confirm Paid & Collected
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
