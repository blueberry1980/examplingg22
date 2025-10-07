import React, { useState, useEffect } from 'react'
import { Database, Package, FileText, ShoppingCart, Users, Pill, TrendingUp, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import StatCard from './StatCard'
import InventoryChart from './charts/InventoryChart'
import PrescriptionChart from './charts/PrescriptionChart'
import SupplierChart from './charts/SupplierChart'
import RecentActivity from './RecentActivity'
import {
  getMedications,
  getInventory,
  getTop6Inventory,
  getPrescriptions,
  getPrescriptionItems,
  getSuppliers,
  getPurchaseOrders,
  getPurchaseOrderItems,
  getTableCounts,
  getRecentActivity,
  type Medication,
  type InventoryItem,
  type Prescription,
  type PrescriptionItem,
  type Supplier,
  type PurchaseOrder,
  type PurchaseOrderItem
} from '../services/supabaseService'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [medications, setMedications] = useState<Medication[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [top6Inventory, setTop6Inventory] = useState<InventoryItem[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<PurchaseOrderItem[]>([])
  const [tableCounts, setTableCounts] = useState({
    medications: 0,
    inventory: 0,
    prescriptions: 0,
    suppliers: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const [
          medicationsData,
          inventoryData,
          top6InventoryData,
          prescriptionsData,
          prescriptionItemsData,
          suppliersData,
          purchaseOrdersData,
          purchaseOrderItemsData,
          counts,
          activity
        ] = await Promise.all([
          getMedications(),
          getInventory(),
          getTop6Inventory(),
          getPrescriptions(),
          getPrescriptionItems(),
          getSuppliers(),
          getPurchaseOrders(),
          getPurchaseOrderItems(),
          getTableCounts(),
          getRecentActivity()
        ])

        setMedications(medicationsData)
        setInventory(inventoryData)
        setTop6Inventory(top6InventoryData)
        setPrescriptions(prescriptionsData)
        setPrescriptionItems(prescriptionItemsData)
        setSuppliers(suppliersData)
        setPurchaseOrders(purchaseOrdersData)
        setPurchaseOrderItems(purchaseOrderItemsData)
        setTableCounts(counts)
        setRecentActivity(activity)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Real-time subscription for top 6 inventory items
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Inventory',
          filter: 'inventory_id=in.(1,2,3,4,5,6)'
        },
        async (payload) => {
          console.log('Inventory update received:', payload)
          // Refetch top 6 inventory data
          const updatedData = await getTop6Inventory()
          setTop6Inventory(updatedData)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pharmacy data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pharmacy Database Dashboard</h1>
                <p className="text-sm text-gray-600">Supabase Analytics & Insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Connection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Medications"
            value={tableCounts.medications.toLocaleString()}
            change={`${medications.length} active medications`}
            changeType="positive"
            icon={Pill}
            color="blue"
          />
          <StatCard
            title="Active Prescriptions"
            value={tableCounts.prescriptions.toLocaleString()}
            change={`${prescriptionItems.length} items dispensed`}
            changeType="positive"
            icon={FileText}
            color="green"
          />
          <StatCard
            title="Inventory Items"
            value={tableCounts.inventory.toLocaleString()}
            change={`${inventory.filter(item => item.quantity_in_stock < item.reorder_level).length} low stock alerts`}
            changeType={inventory.filter(item => item.quantity_in_stock < item.reorder_level).length > 0 ? "negative" : "positive"}
            icon={Package}
            color="orange"
          />
          <StatCard
            title="Active Suppliers"
            value={tableCounts.suppliers.toLocaleString()}
            change={`${purchaseOrders.length} purchase orders`}
            changeType="positive"
            icon={Users}
            color="purple"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <InventoryChart inventoryData={top6Inventory} />
          <PrescriptionChart prescriptionItems={prescriptionItems} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SupplierChart />
          </div>
          <RecentActivity activities={recentActivity} />
        </div>

        {/* Database Tables Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Database Schema Overview</h3>
            <p className="text-sm text-gray-600">7 tables managing pharmacy operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Inventory', records: tableCounts.inventory.toLocaleString(), icon: Package, color: 'bg-blue-50 text-blue-600' },
              { name: 'Medications', records: tableCounts.medications.toLocaleString(), icon: Pill, color: 'bg-green-50 text-green-600' },
              { name: 'Prescriptions', records: tableCounts.prescriptions.toLocaleString(), icon: FileText, color: 'bg-purple-50 text-purple-600' },
              { name: 'PrescriptionItems', records: prescriptionItems.length.toLocaleString(), icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
              { name: 'PurchaseOrders', records: purchaseOrders.length.toLocaleString(), icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
              { name: 'PurchaseOrderItems', records: purchaseOrderItems.length.toLocaleString(), icon: ShoppingCart, color: 'bg-red-50 text-red-600' },
              { name: 'Suppliers', records: tableCounts.suppliers.toLocaleString(), icon: Users, color: 'bg-teal-50 text-teal-600' }
            ].map((table, index) => {
              const Icon = table.icon
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-150 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${table.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{table.name}</p>
                      <p className="text-xs text-gray-600">{table.records} records</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Database Facts */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Growth Rate</h4>
            <p className="text-2xl font-bold text-blue-600 mb-1">
              ${prescriptionItems.reduce((sum, item) => sum + (item.cost || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total prescription revenue</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <Package className="h-8 w-8 text-green-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Stock Efficiency</h4>
            <p className="text-2xl font-bold text-green-600 mb-1">
              {inventory.length > 0 ? 
                (((inventory.length - inventory.filter(item => item.quantity_in_stock < item.reorder_level).length) / inventory.length) * 100).toFixed(1) + '%'
                : '0%'
              }
            </p>
            <p className="text-sm text-gray-600">Inventory availability rate</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Supplier Network</h4>
            <p className="text-2xl font-bold text-purple-600 mb-1">{tableCounts.suppliers}</p>
            <p className="text-sm text-gray-600">Active pharmaceutical suppliers</p>
          </div>
        </div>
      </div>
    </div>
  )
}