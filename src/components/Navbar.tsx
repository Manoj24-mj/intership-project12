import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Palette,
  ShoppingBag,
  Repeat,
  PlusCircle,
  MessageSquare,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  LogIn,
  Menu,
  X,
  User as UserIcon,
  ShoppingBag as DealsIcon,
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, unreadCount = 0 }) => {
  const { user, logout, quickLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoSwitchOpen, setDemoSwitchOpen] = useState(false);

  const navItems = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, public: true },
    { id: 'studio-3d', label: '3D Studio', icon: Palette, public: true },
    { id: 'sell', label: 'Sell / My Listings', icon: PlusCircle, public: false },
    { id: 'swaps', label: 'Swap Requests', icon: Repeat, public: false },
    { id: 'deals', label: 'Buy Requests', icon: DealsIcon, public: false },
    { id: 'chat', label: 'Messages', icon: MessageSquare, public: false, badge: unreadCount },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, public: false },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert, public: false });
  }

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('marketplace')}>
            <div className="w-10 h-10 rounded-lg bg-[#C85A32] text-white flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                  Art<span className="text-[#C85A32]">Loop</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200 hidden sm:inline-block">
                  Student Exchange
                </span>
              </div>
              <p className="text-[11px] text-stone-700 hidden md:block">Second-hand Art Supplies & Materials</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              // If not logged in and not public, don't show or lead to login
              if (!user && !item.public) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#C85A32] text-white rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* User profile & Demo Quick Switcher */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Demo user quick switch helper button */}
            <div className="relative">
              <button
                onClick={() => setDemoSwitchOpen(!demoSwitchOpen)}
                className="px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 flex items-center space-x-1"
                title="Quick switch demo accounts for internship evaluation"
              >
                <span>Demo Switch</span>
                <span className="text-stone-400">▾</span>
              </button>

              {demoSwitchOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 font-semibold text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-100">
                    Internship Demo Accounts
                  </div>
                  <button
                    onClick={async () => {
                      await quickLoginAs('priya');
                      setDemoSwitchOpen(false);
                      handleNav('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex flex-col"
                  >
                    <span className="font-semibold text-stone-800">Priya Sharma (Student)</span>
                    <span className="text-[11px] text-stone-500">priya@artloop.in • Yelahanka</span>
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('rahul');
                      setDemoSwitchOpen(false);
                      handleNav('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex flex-col"
                  >
                    <span className="font-semibold text-stone-800">Rahul Verma (Hobbyist)</span>
                    <span className="text-[11px] text-stone-500">rahul@artloop.in • Rajanukunte</span>
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('admin');
                      setDemoSwitchOpen(false);
                      handleNav('admin');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex flex-col border-t border-stone-100"
                  >
                    <span className="font-semibold text-red-700">Administrator (Staff)</span>
                    <span className="text-[11px] text-stone-500">admin@artloop.in • Full Access</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-stone-300">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleNav('dashboard')}
                  title="View your dashboard"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-800 text-amber-100 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-stone-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-stone-500 capitalize">{user.role === 'admin' ? 'Administrator' : user.location.split(',')[0]}</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await logout();
                    handleNav('marketplace');
                  }}
                  className="p-1.5 text-stone-600 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C85A32] hover:bg-[#B04C27] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-700 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-[#FAF7F2] px-4 pt-3 pb-6 space-y-2">
          {user ? (
            <div className="pb-3 mb-2 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-stone-800 text-amber-100 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  handleNav('marketplace');
                }}
                className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-50 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pb-3 mb-2 border-b border-stone-200">
              <button
                onClick={() => handleNav('login')}
                className="w-full py-2 bg-[#C85A32] text-white text-center rounded-md font-semibold text-sm shadow-xs"
              >
                Sign In / Register
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              if (!user && !item.public) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-md text-xs font-medium text-left ${
                    isActive ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Demo Switcher on mobile */}
          <div className="pt-3 border-t border-stone-200">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Quick Switch Demo User
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={async () => {
                  await quickLoginAs('priya');
                  handleNav('dashboard');
                }}
                className="px-2 py-1.5 bg-white border border-stone-300 rounded text-[11px] font-medium text-stone-700 text-center"
              >
                Priya (Student)
              </button>
              <button
                onClick={async () => {
                  await quickLoginAs('rahul');
                  handleNav('dashboard');
                }}
                className="px-2 py-1.5 bg-white border border-stone-300 rounded text-[11px] font-medium text-stone-700 text-center"
              >
                Rahul (Hobbyist)
              </button>
              <button
                onClick={async () => {
                  await quickLoginAs('admin');
                  handleNav('admin');
                }}
                className="px-2 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-medium text-center"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
