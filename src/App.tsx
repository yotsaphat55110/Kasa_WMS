import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { InventoryView } from './components/InventoryView';
import { InboundView } from './components/InboundView';
import { OutboundView } from './components/OutboundView';
import { ProductCatalogView } from './components/ProductCatalogView';
import { ZoneManagementView } from './components/ZoneManagementView';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogView } from './components/AuditLogView';
import { LineIntegrationView } from './components/LineIntegrationView';
import { ReportsView } from './components/ReportsView';
import { GoogleSheetsDatabaseView } from './components/GoogleSheetsDatabaseView';
import { LoginView } from './components/LoginView';
import { LineLiffMobileView } from './components/LineLiffMobileView';

import { InboundModal } from './components/InboundModal';
import { OutboundModal } from './components/OutboundModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { ProductModal } from './components/ProductModal';
import { UserModal } from './components/UserModal';

import { InventoryItem, Product, User } from './types';

const MainContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if opened with ?mode=liff or inside LINE LIFF
  const [isLiffMode, setIsLiffMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'liff' || params.get('liff') === '1' || window.location.hash.includes('liff');
    }
    return false;
  });
  
  // Modals state
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const handleOpenProductModal = (product?: Product) => {
    setProductToEdit(product || null);
    setIsProductModalOpen(true);
  };

  const handleOpenUserModal = (user?: User) => {
    setUserToEdit(user || null);
    setIsUserModalOpen(true);
  };

  if (isLiffMode) {
    return <LineLiffMobileView onExitLiffMode={() => setIsLiffMode(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header Bar */}
        <Header
          onOpenInboundModal={() => setIsInboundOpen(true)}
          onOpenOutboundModal={() => setIsOutboundOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Primary Container View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'inventory' && (
              <InventoryView
                searchTerm={searchTerm}
                onAdjustStock={(item) => setAdjustItem(item)}
              />
            )}

            {activeTab === 'inbound' && (
              <InboundView
                onOpenModal={() => setIsInboundOpen(true)}
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'outbound' && (
              <OutboundView
                onOpenModal={() => setIsOutboundOpen(true)}
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'catalog' && (
              <ProductCatalogView
                onOpenModal={handleOpenProductModal}
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'zones' && (
              <ZoneManagementView
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'users' && (
              <UserManagementView
                onOpenModal={handleOpenUserModal}
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'audit-log' && (
              <AuditLogView
                searchTerm={searchTerm}
              />
            )}

            {activeTab === 'line-oa' && (
              <LineIntegrationView />
            )}

            {activeTab === 'reports' && (
              <ReportsView />
            )}

            {activeTab === 'database' && (
              <GoogleSheetsDatabaseView />
            )}
          </div>
        </main>

      </div>

      {/* Global Action Modals */}
      <InboundModal
        isOpen={isInboundOpen}
        onClose={() => setIsInboundOpen(false)}
      />

      <OutboundModal
        isOpen={isOutboundOpen}
        onClose={() => setIsOutboundOpen(false)}
      />

      <AdjustStockModal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        inventoryItem={adjustItem}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
