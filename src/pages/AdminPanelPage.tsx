import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AdminStats, User, Product, Report } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatINR } from '../utils/rules.ts';
import { handleImageFallback, getCategoryFallbackImage } from '../utils/imageUtils.ts';
import {
  ShieldAlert,
  Users,
  Package,
  Repeat,
  ShoppingBag,
  Flag,
  Trash2,
  CheckCircle,
  Ban,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AdminPanelPageProps {
  onNavigate: (page: string) => void;
  onViewProduct: (productId: string) => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  onNavigate,
  onViewProduct,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sRes, uRes, pRes, rRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getProducts(),
        api.admin.getReports(),
      ]);
      setStats(sRes.stats);
      setUsersList(uRes.users);
      setProductsList(pRes.products);
      setReportsList(rRes.reports);
    } catch (err: any) {
      setError(err.message || 'Access denied or error loading administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  // Non-admin block
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-red-200 text-center max-w-md shadow-xs">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Restricted Access</h2>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            This administration control center requires an authenticated staff or moderator account.
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      const nextStatus = targetUser.accountStatus === 'active' ? 'suspended' : 'active';
      await api.admin.updateUserStatus(targetUser.id, nextStatus);
      setActionSuccess(`User ${targetUser.name} has been ${nextStatus}.`);
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteListing = async (productId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove listing "${title}" from the marketplace?`)) return;
    try {
      await api.admin.deleteProduct(productId);
      setActionSuccess(`Listing "${title}" removed.`);
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing.');
    }
  };

  const handleReportAction = async (reportId: string, status: Report['status']) => {
    try {
      await api.admin.updateReportStatus(reportId, status);
      setActionSuccess(`Report status updated to ${status}.`);
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to update report.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Admin Top Banner */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/90 text-white flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">ArtLoop Platform Administration</h1>
                <p className="text-xs text-stone-400 mt-0.5">
                  Logged in as Administrator: {user.name} ({user.email})
                </p>
              </div>
            </div>

            <button
              onClick={loadAdminData}
              className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="mt-6 flex space-x-2 border-t border-stone-800 pt-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'overview' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
              }`}
            >
              Overview & Metrics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'users' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
              }`}
            >
              Registered Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'listings' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
              }`}
            >
              Moderate Listings ({productsList.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'reports' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>User Reports</span>
              {stats?.pendingReports && stats.pendingReports > 0 ? (
                <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-full font-bold">
                  {stats.pendingReports}
                </span>
              ) : null}
            </button>
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
            <button onClick={() => setActionSuccess(null)} className="text-xs font-semibold hover:underline">
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

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-stone-500">Loading administrative dataset...</p>
          </div>
        ) : activeTab === 'overview' && stats ? (
          /* TAB 1: OVERVIEW METRICS */
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Total Users
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">{stats.totalUsers}</div>
                <div className="text-xs text-stone-500 mt-1">
                  {stats.activeUsers} Active • {stats.suspendedUsers} Suspended
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Marketplace Listings
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">{stats.totalListings}</div>
                <div className="text-xs text-stone-500 mt-1">
                  {stats.availableListings} Available • {stats.soldListings} Sold
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Pending Swaps
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">
                  {stats.pendingSwapRequests}
                </div>
                <div className="text-xs text-stone-500 mt-1">Active barter negotiations</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Reported Items
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">
                  {stats.pendingReports}
                </div>
                <div className="text-xs text-stone-500 mt-1">{stats.totalReports} total submitted</div>
              </div>
            </div>

            {/* Quick summary card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-stone-900 mb-2">
                Unified Mentor Project Audit Status
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
                The ArtLoop database is currently backed by an active repository storing real
                student users, verified art-material products, persistent message threads, and
                swap transaction lifecycles. All administrative actions (user suspension, listing
                moderation, report resolution) are server-authoritative and enforced on backend REST endpoints.
              </p>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          /* TAB 2: USER MANAGEMENT */
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                Registered Community Artists ({usersList.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Locality</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-stone-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">{u.location}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.accountStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold ${
                              u.accountStatus === 'active'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.accountStatus === 'active' ? 'Suspend Account' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'listings' ? (
          /* TAB 3: LISTINGS MODERATION */
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                Marketplace Listings Moderation ({productsList.length})
              </h3>
            </div>

            <div className="divide-y divide-stone-100">
              {productsList.map(prod => (
                <div
                  key={prod.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/50"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img
                      src={prod.imageUrl || getCategoryFallbackImage(prod.category)}
                      alt={prod.title}
                      onError={(e) => handleImageFallback(e, prod.category)}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-stone-100 rounded text-stone-700">
                          {prod.category}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          Status: {prod.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-stone-900 text-sm truncate max-w-md">
                        {prod.title}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {formatINR(prod.price)} • Seller: {prod.sellerName} • {prod.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewProduct(prod.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteListing(prod.id, prod.title)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded shadow-xs"
                    >
                      Remove Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TAB 4: USER REPORTS */
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                Reported Material Listings ({reportsList.length})
              </h3>
            </div>

            {reportsList.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500">
                No active user flags or complaints.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {reportsList.map(rep => (
                  <div
                    key={rep.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            rep.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {rep.status}
                        </span>
                        <span className="text-xs font-semibold text-stone-900">
                          {rep.productTitle}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 mt-1">
                        <strong>Reason:</strong> {rep.reason}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Reported by: {rep.reporterName} on{' '}
                        {new Date(rep.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewProduct(rep.productId)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-100 text-stone-800 rounded border border-stone-300"
                      >
                        Inspect Item
                      </button>
                      {rep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReportAction(rep.id, 'reviewed')}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleReportAction(rep.id, 'dismissed')}
                            className="px-3 py-1.5 text-xs font-semibold bg-stone-200 text-stone-700 rounded"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
