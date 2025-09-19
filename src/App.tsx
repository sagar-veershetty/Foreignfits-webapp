import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { InventoryList } from './components/Inventory/InventoryList';
import { SalesTerminal } from './components/Sales/SalesTerminal';
import { AddProduct } from './components/Products/AddProduct';
import { StockMovementDashboard } from './components/StockMovement/StockMovementDashboard';
import { SalesHistory } from './components/Sales/SalesHistory';
import { CustomerApp } from './components/Customer/CustomerApp';

function App() {
 const { loadInitialData } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appMode, setAppMode] = useState<'admin' | 'customer'>('admin');

  // Check URL for customer mode
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'customer') {
      setAppMode('customer');
    }
  }, []);


  if (appMode === 'customer') {
    return <CustomerApp />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'inventory':
        return <InventoryList />;
      case 'sales':
        return <SalesTerminal />;
      case 'add-product':
        return <AddProduct />;
      case 'stock-movement':
        return <StockMovementDashboard />;
      case 'sales-history':
        return <SalesHistory />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent activeTab={activeTab} setActiveTab={setActiveTab} renderContent={renderContent} />
      </AuthGuard>
    </AuthProvider>
  );
}

function AppContent({ activeTab, setActiveTab, renderContent }: any) {
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Foreign Fits...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;