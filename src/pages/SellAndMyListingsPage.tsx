import React, { useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatINR } from '../utils/rules.ts';
import { handleImageFallback, getCategoryFallbackImage } from '../utils/imageUtils.ts';
import {
  PlusCircle,
  Package,
  Edit3,
  Trash2,
  CheckCircle,
  Tag,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Eye,
  Upload,
} from 'lucide-react';

interface SellAndMyListingsPageProps {
  onViewProduct: (productId: string) => void;
  onNavigate: (page: string) => void;
}

const CATEGORIES = [
  'Original Paintings & Artworks',
  'Fine Art & Prints',
  'Paints and Colours',
  'Brushes and Painting Tools',
  'Canvas and Surfaces',
  'Sketchbooks and Paper',
  'Drawing and Sketching Tools',
  'Craft Supplies',
  'Other Art Materials',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

const SAMPLE_IMAGE_SUGGESTIONS = [
  { label: 'Original Art', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
  { label: 'Paints & Colours', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Brushes', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
  { label: 'Canvas', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sketchbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Drawing Tools', url: 'https://images.unsplash.com/photo-1585336261024-64ed7d013cd1?auto=format&fit=crop&w=800&q=80' },
];

export const SellAndMyListingsPage: React.FC<SellAndMyListingsPageProps> = ({
  onViewProduct,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'my-listings'>('create');
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [condition, setCondition] = useState<any>('Like New');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState(user?.location || 'Yelahanka, Bengaluru');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyListings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.products.getAll({ sellerId: user.id });
      setMyListings(res.products);
    } catch (err: any) {
      setError(err.message || 'Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyListings();
      if (!location) setLocation(user.location);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center max-w-md shadow-xs">
          <Package className="w-12 h-12 text-[#C85A32] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Sign in to List Supplies</h2>
          <p className="text-xs text-stone-600 mb-6">
            You must be signed in with an ArtLoop account to sell art materials or manage your active listings.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#B04C27] text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setPrice('');
    setCondition('Like New');
    setImageUrl('');
    setLocation(user?.location || 'Yelahanka, Bengaluru');
  };

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setDescription(p.description);
    setPrice(String(p.price));
    setCondition(p.condition);
    setImageUrl(p.imageUrl);
    setLocation(p.location);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(String(event.target.result));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please provide a valid non-negative price in ₹ (INR).');
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Title, description, and location are required.');
      return;
    }

    const finalImageUrl = imageUrl.trim() || getCategoryFallbackImage(category);

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.products.update(editingId, {
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          price: numPrice,
          imageUrl: finalImageUrl,
          location: location.trim(),
        });
        setSuccess('Listing updated successfully!');
      } else {
        await api.products.create({
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          price: numPrice,
          imageUrl: finalImageUrl,
          location: location.trim(),
        });
        setSuccess('Your art supplies were listed successfully in the marketplace!');
      }

      resetForm();
      fetchMyListings();
      setActiveTab('my-listings');
    } catch (err: any) {
      setError(err.message || 'Failed to save product listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (productId: string, currentStatus: Product['status']) => {
    try {
      const newStatus = currentStatus === 'sold' ? 'available' : 'sold';
      await api.products.updateStatus(productId, newStatus);
      fetchMyListings();
      setSuccess(`Listing status changed to ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.products.delete(productId);
      fetchMyListings();
      setSuccess('Listing removed successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Header Tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Art Supply Management
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Share excess studio supplies with peers, or manage your existing items.
              </p>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>{editingId ? 'Edit Listing' : 'List New Item'}</span>
              </button>

              <button
                onClick={() => setActiveTab('my-listings')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'my-listings'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-stone-500" />
                <span>My Listings ({myListings.length})</span>
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

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
              <div className="pb-4 mb-6 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-xl text-stone-900">
                    {editingId ? 'Edit Your Art Supply' : 'Post Art Materials for Sale or Swap'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Provide accurate details about your materials so student buyers know what they are getting.
                  </p>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-xs text-stone-500 hover:text-stone-900 underline"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Camel Artist Acrylic 12 Shades Set"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>

                {/* Category & Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Condition *
                    </label>
                    <select
                      value={condition}
                      onChange={e => setCondition(e.target.value as any)}
                      className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    >
                      {CONDITIONS.map(cond => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price and Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Price in INR (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 250"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Locality / Campus Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yelahanka, Bengaluru"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Image URL & Device File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Product Image *
                    </label>
                    <label className="text-[11px] font-semibold text-[#C85A32] hover:underline cursor-pointer flex items-center space-x-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload photo from device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://... (or click 'Upload photo from device' above)"
                    value={imageUrl.startsWith('data:image') ? '✓ Local image uploaded from your device' : imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                  {/* Sample suggestions for quick testing */}
                  <div className="mt-1.5 flex items-center space-x-1.5 flex-wrap text-[11px] text-stone-500">
                    <span>Quick presets:</span>
                    {SAMPLE_IMAGE_SUGGESTIONS.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setImageUrl(s.url)}
                        className="underline hover:text-[#C85A32] px-1 py-0.5"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Description & Usage History *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how much of the paint or paper is left, brand name, bristle quality, reason for selling..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#C85A32] hover:bg-[#B04C27] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Listing' : 'Publish Listing'}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Card Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-3">
                  Live Card Preview
                </span>

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs max-w-sm mx-auto">
                  <div className="relative aspect-4/3 bg-stone-200 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span>Image will display here</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded">
                        Available
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-white text-stone-800 rounded border border-stone-200">
                        {condition}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <span className="text-[11px] text-[#C85A32] font-semibold block">{category}</span>
                    <h4 className="font-serif font-bold text-stone-900 text-sm mt-0.5 truncate">
                      {title || 'Your Product Title'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {description || 'Product description will appear here as you type...'}
                    </p>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-base font-bold text-stone-900">
                        {price ? formatINR(Number(price)) : '₹0'}
                      </span>
                      <span className="text-[11px] text-stone-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span className="truncate max-w-[120px]">{location || 'Locality'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student advice box */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-xs text-stone-700 space-y-1.5">
                <p className="font-semibold text-stone-900">Tip for Student Sellers:</p>
                <p className="text-[11px] leading-relaxed">
                  Price lightly used items roughly 30-50% below market retail. This ensures quick
                  exchanges with campus peers who need materials for current term submissions!
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* My Listings Tab */
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 text-center text-xs text-stone-500">
                Loading your materials...
              </div>
            ) : myListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">
                  No Listings Yet
                </h3>
                <p className="text-xs text-stone-500 mb-6">
                  You haven't posted any art supplies for sale or exchange yet.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-[#C85A32] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-stone-900 text-sm">
                    Your Active Studio Listings ({myListings.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-[#C85A32] font-semibold hover:underline flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                </div>

                <div className="divide-y divide-stone-100">
                  {myListings.map(item => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <img
                          src={item.imageUrl || getCategoryFallbackImage(item.category)}
                          alt={item.title}
                          onError={(e) => handleImageFallback(e, item.category)}
                          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-stone-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                item.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'reserved'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-200 text-stone-800'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-stone-900 text-sm mt-0.5 truncate max-w-md">
                            {item.title}
                          </h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Asking: <strong className="text-stone-800">{formatINR(item.price)}</strong> • Condition: {item.condition}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <button
                          onClick={() => onViewProduct(item.id)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 rounded border border-stone-200 bg-white"
                          title="View public page"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 rounded border border-stone-200 bg-white"
                          title="Edit listing details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStatusToggle(item.id, item.status)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                            item.status === 'sold'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {item.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
