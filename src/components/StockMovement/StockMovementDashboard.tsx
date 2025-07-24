import React, { useState } from 'react';
import { StockAdjustmentForm } from './StockAdjustment';
import { StockMovementHistory } from './StockMovementHistory';
import { StockTransferForm } from './StockTransfer';
import { StockTransferHistory } from './StockTransferHistory';
import { Package, History, Settings, Truck } from 'lucide-react';

export function StockMovementDashboard() {
  const [activeTab, setActiveTab] = useState<'adjust' | 'history' | 'transfer' | 'transfer-history'>('adjust');

  const tabs = [
    { id: 'adjust' as const, label: 'Stock Adjustment', icon: Settings },
    { id: 'history' as const, label: 'Movement History', icon: History },
    { id: 'transfer' as const, label: 'Stock Transfer', icon: Truck },
    { id: 'transfer-history' as const, label: 'Transfer History', icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stock Management</h1>
            <p className="text-indigo-100 text-lg">Foreign Fits - Global Fashion</p>
            <p className="text-indigo-200 text-sm mt-1">Manage inventory levels and track movements</p>
          </div>
          <div className="text-right">
            <div className="p-3 bg-indigo-500 rounded-full">
              <Package className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'adjust' && <StockAdjustmentForm />}
      {activeTab === 'history' && <StockMovementHistory />}
      {activeTab === 'transfer' && <StockTransferForm />}
      {activeTab === 'transfer-history' && <StockTransferHistory />}
    </div>
  );
}