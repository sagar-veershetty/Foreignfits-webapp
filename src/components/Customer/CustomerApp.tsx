import React, { useState } from 'react';
import { CustomerProvider, useCustomer } from '../../context/CustomerContext';
import { AppProvider } from '../../context/AppContext';
import { CustomerLogin } from './CustomerLogin';
import { CustomerNavbar } from './CustomerNavbar';
import { ProductCatalog } from './ProductCatalog';
import { ShoppingCart } from './ShoppingCart';
import { Wishlist } from './Wishlist';
import { CustomerOrders } from './CustomerOrders';

function CustomerDashboard() {
  const { state } = useCustomer();
  const [activeTab, setActiveTab] = useState('catalog');

  const renderContent = () => {
    switch (activeTab) {
      case 'catalog':
        return <ProductCatalog />;
      case 'cart':
        return <ShoppingCart onCheckout={() => setActiveTab('checkout')} />;
      case 'wishlist':
        return <Wishlist />;
      case 'orders':
        return <CustomerOrders />;
      default:
        return <ProductCatalog />;
    }
  };

  if (!state.isAuthenticated) {
    return <CustomerLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <CustomerNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export function CustomerApp() {
  return (
    <AppProvider>
      <CustomerProvider>
        <CustomerDashboard />
      </CustomerProvider>
    </AppProvider>
  );
}