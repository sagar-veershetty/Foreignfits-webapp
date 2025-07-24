import React, { useState } from 'react';
import { Package, ShoppingCart, BarChart3, Plus, User, ChevronDown, TrendingUp, Globe, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { state: authState, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'sales-history', label: 'Sales History', icon: TrendingUp },
    { id: 'add-product', label: 'Add Product', icon: Plus },
    { id: 'stock-movement', label: 'Stock Movement', icon: TrendingUp },
  ];

  const getFilteredTabs = () => {
    switch (authState.user?.role) {
      case 'sales':
        return tabs.filter(tab => ['dashboard', 'inventory', 'sales', 'sales-history'].includes(tab.id));
      case 'warehouse':
        return tabs.filter(tab => ['dashboard', 'inventory', 'add-product', 'stock-movement'].includes(tab.id));
      default:
        return tabs;
    }
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
                <p className="text-xs text-gray-500 -mt-1 whitespace-nowrap">Global Fashion</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex space-x-1">
                {getFilteredTabs().map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Desktop User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <div className="p-1 bg-blue-600 rounded-full">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{authState.user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</p>
                    </div>
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                      <p className="text-xs text-gray-500">{authState.user?.email}</p>
                      <p className="text-xs text-blue-600 capitalize mt-1">{authState.user?.role} Access</p>
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
              {/* Mobile User Avatar */}
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-600 rounded-full">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{authState.user?.role}</p>
                </div>
              </div>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMobileMenu}
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/WhatsApp Image 2025-07-23 at 20.17.32.jpeg" 
              alt="Foreign Fits Logo" 
              className="h-10 w-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Foreign Fits</h1>
              <p className="text-xs text-blue-100">Global Fashion</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{authState.user?.name}</p>
              <p className="text-sm text-gray-600">{authState.user?.email}</p>
              <p className="text-sm text-blue-600 capitalize font-medium">{authState.user?.role} Access</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 px-2">Navigation</p>
            <div className="space-y-2">
              {getFilteredTabs().map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
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