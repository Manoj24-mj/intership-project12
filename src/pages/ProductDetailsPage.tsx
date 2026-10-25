import React, { useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatINR, canExpressBuyInterest } from '../utils/rules.ts';
import { handleImageFallback, getCategoryFallbackImage } from '../utils/imageUtils.ts';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User as UserIcon,
  ShoppingBag,
  Repeat,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Tag,
  Share2,
  Palette,
} from 'lucide-react';

interface ProductDetailsPageProps {
  productId: string;
  onBack: () => void;
  onOpenChat: (conversationId: string) => void;
  onNavigate: (page: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
  onBack,
  onOpenChat,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [userListings, setUserListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyNotes, setBuyNotes] = useState('');
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedOfferedId, setSelectedOfferedId] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.products.getById(productId);
        setProduct(res.product);

        // If user is logged in, fetch their own listings to populate swap choices
        if (user) {
          const myRes = await api.products.getAll({ sellerId: user.id });
          setUserListings(myRes.products.filter(p => p.status === 'available' && p.id !== productId));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-stone-600 font-medium">Loading art material specifications...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8 max-w-xl mx-auto text-center">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Item Unavailable</h2>
          <p className="text-sm text-stone-600 mb-6">{error || 'This listing does not exist.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const isAvailable = product.status === 'available';

  // Buy Interest Handler
  const handleExpressBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    try {
      setIsSubmittingBuy(true);
      setError(null);
      const res = await api.buyRequests.create(product.id, buyNotes);
      setSuccessMessage('Your buy interest was recorded! Seller has been notified via message.');
      setBuyModalOpen(false);
      setBuyNotes('');
      // Optionally direct to chat
      if (res.conversationId) {
        setTimeout(() => {
          onOpenChat(res.conversationId);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Could not express buy interest.');
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  // Swap Request Handler
  const handleRequestSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!selectedOfferedId) {
      setError('Please select one of your items to offer in swap.');
      return;
    }

    try {
      setIsSubmittingSwap(true);
      setError(null);
      const res = await api.swapRequests.create({
        requestedProductId: product.id,
        offeredProductId: selectedOfferedId,
        message: swapMessage,
      });
      setSuccessMessage('Swap proposal submitted! You can track its status in Swap Requests.');
      setSwapModalOpen(false);
      setSwapMessage('');
      if (res.conversationId) {
        setTimeout(() => {
          onOpenChat(res.conversationId);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Could not submit swap request.');
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  // Direct Message Handler
  const handleContactSeller = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    try {
      const res = await api.chat.startConversation({
        recipientId: product.sellerId,
        recipientName: product.sellerName,
        productId: product.id,
        productTitle: product.title,
      });
      onOpenChat(res.conversation.id);
    } catch (err: any) {
      setError(err.message || 'Could not initiate conversation.');
    }
  };

  // Report Listing Handler
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }
    if (!reportReason.trim()) return;

    try {
      setIsSubmittingReport(true);
      await api.reports.submit(product.id, reportReason);
      setSuccessMessage('Thank you. This listing has been flagged for administrator review.');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      setError(err.message || 'Could not submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-stone-200 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-400">ID: {product.id}</span>
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-stone-400 hover:text-red-600 p-1 rounded"
              title="Report inappropriate listing"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Alerts & Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
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
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Product Spec Layout */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Image with gallery style frame */}
          <div className="lg:col-span-7 bg-stone-100 p-6 sm:p-10 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-stone-200">
            <div className="relative max-w-lg w-full rounded-xl overflow-hidden shadow-md bg-white border border-stone-200/80 aspect-4/3">
              <img
                src={product.imageUrl || getCategoryFallbackImage(product.category)}
                alt={product.title}
                onError={(e) => handleImageFallback(e, product.category)}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                    product.status === 'available'
                      ? 'bg-emerald-600 text-white'
                      : product.status === 'reserved'
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-900 text-white'
                  }`}
                >
                  {product.status}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-white/95 text-stone-800 border border-stone-200 rounded">
                  Condition: {product.condition}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Price, and Action CTAs */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-stone-100 text-stone-700 text-xs font-medium mb-3">
                <Tag className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>{product.category}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {product.title}
              </h1>

              {/* Price Banner */}
              <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-stone-500 uppercase font-semibold tracking-wider block">
                    Asking Price (INR)
                  </span>
                  <span className="text-3xl font-extrabold text-stone-900 font-sans">
                    {formatINR(product.price)}
                  </span>
                </div>
                <span className="text-xs text-stone-500 font-medium">Second-hand price</span>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Material Details & Usage
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50/70 p-4 rounded-xl border border-stone-100">
                  {product.description}
                </p>
              </div>

              {/* Seller & Location Info */}
              <div className="mt-6 pt-5 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>
                    Listed by:{' '}
                    <strong className="text-stone-800 font-semibold">
                      {product.sellerName || 'Fellow Artist'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Locality: {product.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Listed on: {formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-stone-200 space-y-3">
              {isOwner ? (
                <div className="bg-stone-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-stone-700">
                    This is your personal listing.
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Manage or mark this item sold from "Sell / My Listings".
                  </p>
                  <button
                    onClick={() => onNavigate('sell')}
                    className="mt-3 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
                  >
                    Go to My Listings
                  </button>
                </div>
              ) : isAvailable ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setBuyModalOpen(true)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-[#C85A32] hover:bg-[#B04C27] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Express Buy</span>
                    </button>

                    <button
                      onClick={() => setSwapModalOpen(true)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                    >
                      <Repeat className="w-4 h-4" />
                      <span>Request Swap</span>
                    </button>
                  </div>

                  <button
                    onClick={handleContactSeller}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                    <span>Chat with Seller to Coordinate</span>
                  </button>

                  <button
                    onClick={() => onNavigate('studio-3d')}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Mount on 3D Studio Easel (360° Inspection)</span>
                  </button>
                </>
              ) : (
                <div className="bg-stone-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Item {product.status}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    This art supply is no longer open for active buy or swap requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Express Buy Interest */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-900 mb-1">Express Buy Interest</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Expressing buy interest notifies <strong className="text-stone-800">{product.sellerName}</strong> that you want to purchase this item for <strong className="text-stone-900">{formatINR(product.price)}</strong>. Payment and pickup are arranged directly between you and the seller.
            </p>

            <form onSubmit={handleExpressBuy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Optional Note / Preferred Meeting Spot
                </label>
                <textarea
                  rows={3}
                  value={buyNotes}
                  onChange={e => setBuyNotes(e.target.value)}
                  placeholder="e.g. Can meet near Yelahanka campus tomorrow afternoon, cash ready."
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[11px] text-stone-700">
                Notice: ArtLoop does not process online payments. Always inspect materials before handing over cash.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBuyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBuy}
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B04C27] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {isSubmittingBuy ? 'Submitting...' : 'Confirm Buy Interest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request a Swap */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-900 mb-1">Item-for-Item Swap Proposal</h3>
            <p className="text-xs text-stone-500 mb-4">
              Choose one of your own available art supplies to offer in exchange for "{product.title}".
            </p>

            <form onSubmit={handleRequestSwap} className="space-y-4">
              {userListings.length === 0 ? (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
                  <p className="text-xs text-stone-600 mb-2">
                    You don't have any available active listings to offer in swap right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('sell')}
                    className="px-4 py-1.5 bg-[#C85A32] text-white text-xs font-semibold rounded-lg"
                  >
                    Post an Item to Offer
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Select Your Offered Item *
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {userListings.map(item => (
                        <label
                          key={item.id}
                          className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selectedOfferedId === item.id
                              ? 'bg-amber-50/70 border-[#C85A32]'
                              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="offeredItem"
                            value={item.id}
                            checked={selectedOfferedId === item.id}
                            onChange={() => setSelectedOfferedId(item.id)}
                            className="text-[#C85A32] focus:ring-[#C85A32]"
                          />
                          <img
                            src={item.imageUrl || getCategoryFallbackImage(item.category)}
                            alt={item.title}
                            onError={(e) => handleImageFallback(e, item.category)}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Value: {formatINR(item.price)} • {item.condition}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Message to {product.sellerName}
                    </label>
                    <textarea
                      rows={2}
                      value={swapMessage}
                      onChange={e => setSwapMessage(e.target.value)}
                      placeholder="e.g. Would love to swap my palette knives for your sketch pad!"
                      className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32]"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSwapModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                {userListings.length > 0 && (
                  <button
                    type="submit"
                    disabled={isSubmittingSwap || !selectedOfferedId}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    {isSubmittingSwap ? 'Submitting...' : 'Send Swap Request'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Listing */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-900 mb-1">Report Listing</h3>
            <p className="text-xs text-stone-500 mb-4">
              Help keep our student art marketplace safe and truthful.
            </p>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reason for reporting *
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg mb-2"
                >
                  <option value="">Select a reason...</option>
                  <option value="Not authentic art supplies">Not authentic art supplies</option>
                  <option value="Inaccurate condition or photo">Inaccurate condition or photo</option>
                  <option value="Unreasonable price or scalping">Unreasonable price or scalping</option>
                  <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                  <option value="Suspected fraudulent seller">Suspected fraudulent seller</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport || !reportReason}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
