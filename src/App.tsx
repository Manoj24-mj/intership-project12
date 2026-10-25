/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { MarketplacePage } from './pages/MarketplacePage.tsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.tsx';
import { SellAndMyListingsPage } from './pages/SellAndMyListingsPage.tsx';
import { SwapRequestsPage } from './pages/SwapRequestsPage.tsx';
import { BuyRequestsPage } from './pages/BuyRequestsPage.tsx';
import { ChatPage } from './pages/ChatPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AdminPanelPage } from './pages/AdminPanelPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { Studio3DPage } from './pages/Studio3DPage.tsx';

function MainApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('marketplace');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  // Sync with browser hash for reliable refresh and direct linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setCurrentPage('marketplace');
        return;
      }

      if (hash.startsWith('product/')) {
        const id = hash.replace('product/', '');
        setSelectedProductId(id);
        setCurrentPage('product-details');
      } else {
        setCurrentPage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string, params?: Record<string, string>) => {
    if (page === 'product-details' && params?.productId) {
      setSelectedProductId(params.productId);
      window.location.hash = `product/${params.productId}`;
    } else {
      window.location.hash = page;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    navigateTo('product-details', { productId });
  };

  const handleOpenChat = (conversationId: string) => {
    setActiveConversationId(conversationId);
    navigateTo('chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-900">
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      <div className="flex-1">
        {currentPage === 'marketplace' && (
          <MarketplacePage
            onViewProduct={handleViewProduct}
            onInitiateSwap={handleViewProduct}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'studio-3d' && (
          <Studio3DPage
            initialProductId={selectedProductId || undefined}
            onNavigate={navigateTo}
            onViewProduct={handleViewProduct}
          />
        )}

        {currentPage === 'product-details' && selectedProductId && (
          <ProductDetailsPage
            productId={selectedProductId}
            onBack={() => navigateTo('marketplace')}
            onOpenChat={handleOpenChat}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'sell' && (
          <SellAndMyListingsPage
            onViewProduct={handleViewProduct}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'swaps' && (
          <SwapRequestsPage
            onOpenChat={handleOpenChat}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'deals' && (
          <BuyRequestsPage
            onOpenChat={handleOpenChat}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'chat' && (
          <ChatPage
            initialConversationId={activeConversationId}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={navigateTo}
            onViewProduct={handleViewProduct}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPanelPage
            onNavigate={navigateTo}
            onViewProduct={handleViewProduct}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onSuccess={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        )}
      </div>

      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
