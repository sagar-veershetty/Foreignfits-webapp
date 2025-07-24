import React, { useState } from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Heart, 
  User, 
  Search,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface CustomerNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CustomerNavbar({ activeTab, onTabChange }: CustomerNavbarProps) {
  const { state, logout } = useCustomer();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'catalog', label: 'Shop', icon: ShoppingBag },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: state.cart.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: state.wishlist.length },
    { id: 'orders', label: 'Orders', icon: User },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <img 
                src="/WhatsApp Image 2025-07-23 at 20.17.32.jpeg" 
                alt="Foreign Fits Logo" 
                className="h-10 w-10 object-contain rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">Foreign Fits</h1>
                <p className="text-xs text-purple-600 -mt-1 whitespace-nowrap">Global Fashion Store</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{tab.label}</span>
                      {tab.badge && tab.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Desktop User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <div className="p-1 bg-purple-600 rounded-full">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{state.customer?.name}</p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</p>
                    </div>
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{state.customer?.name}</p>
                      <p className="text-xs text-gray-500">{state.customer?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-red-100 rounded-full">
                          <User className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-sm font-medium">Sign Out</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Button and User Info */}
            <div className="flex items-center space-x-3 lg:hidden">
              {/* Cart Badge for Mobile */}
              <button
                onClick={() => onTabChange('cart')}
                className="relative p-2 text-gray-600 hover:text-purple-600"
              >
                <ShoppingCart className="h-5 w-5" />
                {state.cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {state.cart.length}
                  </span>
                )}
              </button>
              
              {/* Mobile User Avatar */}
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-purple-600 rounded-full">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{state.customer?.name}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Left Panel Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/WhatsApp Image 2025-07-23 at 20.17.32.jpeg" 
              alt="Foreign Fits Logo" 
              className="h-10 w-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Foreign Fits</h1>
              <p className="text-xs text-purple-100">Global Fashion Store</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg bg-purple-500 hover:bg-purple-400 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600 rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{state.customer?.name}</p>
              <p className="text-sm text-gray-600">{state.customer?.email}</p>
              <p className="text-sm text-purple-600 font-medium">Customer Account</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 px-2">Shopping</p>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                      activeTab === tab.id
                        ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && tab.badge > 0 && (
                      <span className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <div className="p-1 bg-red-100 rounded-full">
              <User className="h-4 w-4 text-red-600" />
            </div>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}