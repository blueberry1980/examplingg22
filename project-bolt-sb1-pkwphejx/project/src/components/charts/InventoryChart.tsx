import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { InventoryItem } from '../../services/supabaseService'

interface InventoryChartProps {
  inventoryData: InventoryItem[]
}

export default function InventoryChart({ inventoryData }: InventoryChartProps) {
  // Transform inventory data for the chart - showing stock levels and reorder levels
  const chartData = inventoryData.map(item => ({
    name: item.Medications?.medication_name || 'Unknown',
    current: item.quantity_in_stock,
    reorder: item.reorder_level
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Trending Medications</h3>
        <p className="text-sm text-gray-600">Current inventory levels</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="current" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="reorder" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}