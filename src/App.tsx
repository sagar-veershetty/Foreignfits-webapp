import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
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
        <AppProvider>
          <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
              {renderContent()}
            </main>
          </div>
        </AppProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;