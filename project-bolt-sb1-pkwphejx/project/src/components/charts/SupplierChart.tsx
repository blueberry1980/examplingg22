import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../../lib/supabase'
import { TableCount, getAllTableCounts } from '../../services/supabaseService'

export default function SupplierChart() {
  const [tableCounts, setTableCounts] = useState<TableCount[]>([])
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    fetchTableCounts()

    const tables = ['Medications', 'Inventory', 'Prescriptions', 'PrescriptionItems', 'Suppliers', 'PurchaseOrders', 'PurchaseOrderItem', 'users']

    const subscriptions = tables.map(tableName => {
      return supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          () => {
            fetchTableCounts()
          }
        )
        .subscribe()
    })

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [])

  async function fetchTableCounts() {
    const counts = await getAllTableCounts()
    setTableCounts(counts)
    const total = counts.reduce((sum, table) => sum + table.count, 0)
    setTotalRecords(total)
  }

  const chartData = tableCounts.map(table => ({
    name: table.name,
    value: table.count,
    color: table.color
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Table Distribution</h3>
            <p className="text-sm text-gray-600">Record count by table (%)</p>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">Real-time</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Total Records: <span className="font-semibold text-gray-900">{totalRecords.toLocaleString()}</span>
        </p>
      </div>
    </div>
  )
}