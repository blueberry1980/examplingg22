import { supabase } from '../lib/supabase'

export interface Medication {
  medication_id: number
  medication_name: string
  generic_name: string
  manufacturer: string
  dosage: string
  formulation: string
  description: string
  price_per_unit: number
}

export interface InventoryItem {
  inventory_id: number
  medication_id: number
  batch_number: string
  expiry_date: string
  quantity_in_stock: number
  reorder_level: number
  last_updated: string
  Medications?: Medication
}

export interface Prescription {
  prescription_id: number
  patient_id: number
  physician_id: number
  date_prescribed: string
  status: string
}

export interface PrescriptionItem {
  prescription_item_id: number
  prescription_id: number
  medication_id: number
  quantity_dispensed: string
  dosage_instructions: string
  cost: number
  Medications?: Medication
  Prescriptions?: Prescription
}

export interface Supplier {
  supplier_id: number
  supplier_name: string
  contact_person: string
  phone_number: string
  email: string
}

export interface PurchaseOrder {
  purchase_order_id: number
  supplier_id: number
  order_date: string
  delivery_date: string
  status: string
  Suppliers?: Supplier
}

export interface PurchaseOrderItem {
  purchase_order_item_id: number
  purchase_order_id: number
  medication_id: number
  quantity_ordered: number
  cost_per_unit: number
  Medications?: Medication
  PurchaseOrders?: PurchaseOrder
}

// Fetch all medications
export async function getMedications() {
  const { data, error } = await supabase
    .from('Medications')
    .select('*')
    .order('medication_name')
  
  if (error) {
    console.error('Error fetching medications:', error)
    return []
  }
  return data as Medication[]
}

// Fetch inventory with medication details
export async function getInventory() {
  const { data, error } = await supabase
    .from('Inventory')
    .select(`
      *,
      Medications (
        medication_name,
        generic_name,
        manufacturer
      )
    `)
    .order('last_updated', { ascending: false })

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
  return data as InventoryItem[]
}

// Fetch top 6 inventory items (IDs 1-6) for trending medications chart
export async function getTop6Inventory() {
  const { data, error } = await supabase
    .from('Inventory')
    .select(`
      *,
      Medications (
        medication_name,
        generic_name,
        manufacturer
      )
    `)
    .in('inventory_id', [1, 2, 3, 4, 5, 6])
    .order('inventory_id')

  if (error) {
    console.error('Error fetching top 6 inventory:', error)
    return []
  }
  return data as InventoryItem[]
}

// Fetch prescriptions
export async function getPrescriptions() {
  const { data, error } = await supabase
    .from('Prescriptions')
    .select('*')
    .order('date_prescribed', { ascending: false })
  
  if (error) {
    console.error('Error fetching prescriptions:', error)
    return []
  }
  return data as Prescription[]
}

// Fetch prescription items with details
export async function getPrescriptionItems() {
  const { data, error } = await supabase
    .from('PrescriptionItems')
    .select(`
      *,
      Medications (
        medication_name,
        generic_name
      ),
      Prescriptions (
        date_prescribed,
        status
      )
    `)
    .order('prescription_item_id', { ascending: false })
  
  if (error) {
    console.error('Error fetching prescription items:', error)
    return []
  }
  return data as PrescriptionItem[]
}

// Fetch suppliers
export async function getSuppliers() {
  const { data, error } = await supabase
    .from('Suppliers')
    .select('*')
    .order('supplier_name')
  
  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }
  return data as Supplier[]
}

// Fetch purchase orders with supplier details
export async function getPurchaseOrders() {
  const { data, error } = await supabase
    .from('PurchaseOrders')
    .select(`
      *,
      Suppliers (
        supplier_name,
        contact_person
      )
    `)
    .order('order_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }
  return data as PurchaseOrder[]
}

// Fetch purchase order items
export async function getPurchaseOrderItems() {
  const { data, error } = await supabase
    .from('PurchaseOrderItem')
    .select(`
      *,
      Medications (
        medication_name
      ),
      PurchaseOrders (
        order_date,
        status
      )
    `)
    .order('purchase_order_item_id', { ascending: false })
  
  if (error) {
    console.error('Error fetching purchase order items:', error)
    return []
  }
  return data as PurchaseOrderItem[]
}

// Get table counts for dashboard stats
export async function getTableCounts() {
  const [medications, inventory, prescriptions, suppliers] = await Promise.all([
    supabase.from('Medications').select('*', { count: 'exact', head: true }),
    supabase.from('Inventory').select('*', { count: 'exact', head: true }),
    supabase.from('Prescriptions').select('*', { count: 'exact', head: true }),
    supabase.from('Suppliers').select('*', { count: 'exact', head: true })
  ])

  return {
    medications: medications.count || 0,
    inventory: inventory.count || 0,
    prescriptions: prescriptions.count || 0,
    suppliers: suppliers.count || 0
  }
}

// Get low stock items for alerts
export async function getLowStockItems() {
  const { data, error } = await supabase
    .from('Inventory')
    .select(`
      *,
      Medications (
        medication_name
      )
    `)
    .order('quantity_in_stock')
  
  if (error) {
    console.error('Error fetching low stock items:', error)
    return []
  }
  
  // Filter low stock items on client side
  const lowStockItems = data?.filter(item => 
    item.quantity_in_stock < item.reorder_level
  ) || []
  
  return lowStockItems as InventoryItem[]
}

// Get recent activity data
export async function getRecentActivity() {
  const activities = []

  // Recent prescriptions
  const { data: recentPrescriptions } = await supabase
    .from('Prescriptions')
    .select('*')
    .order('date_prescribed', { ascending: false })
    .limit(2)

  if (recentPrescriptions) {
    recentPrescriptions.forEach(prescription => {
      activities.push({
        id: `prescription-${prescription.prescription_id}`,
        type: 'prescription',
        message: `New prescription created for Patient #${prescription.patient_id}`,
        time: new Date(prescription.date_prescribed).toLocaleString(),
        timestamp: new Date(prescription.date_prescribed)
      })
    })
  }

  // Low stock alerts
  const lowStock = await getLowStockItems()
  if (lowStock.length > 0) {
    const item = lowStock[0]
    activities.push({
      id: `low-stock-${item.inventory_id}`,
      type: 'inventory',
      message: `Low stock alert: ${item.Medications?.medication_name || 'Unknown medication'}`,
      time: 'Recently',
      timestamp: new Date(item.last_updated)
    })
  }

  // Recent purchase orders
  const { data: recentOrders } = await supabase
    .from('PurchaseOrders')
    .select(`
      *,
      Suppliers (supplier_name)
    `)
    .order('order_date', { ascending: false })
    .limit(1)

  if (recentOrders && recentOrders.length > 0) {
    const order = recentOrders[0]
    activities.push({
      id: `purchase-${order.purchase_order_id}`,
      type: 'purchase',
      message: `Purchase order #${order.purchase_order_id} from ${order.Suppliers?.supplier_name}`,
      time: new Date(order.order_date).toLocaleString(),
      timestamp: new Date(order.order_date)
    })
  }

  // Sort by timestamp and return
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 4)
}

export interface TableCount {
  name: string
  count: number
  color: string
}

// Get trending medications based on today's prescription counts
export interface TrendingMedication {
  medication_id: number
  medication_name: string
  prescription_count: number
  average_daily: number
}

export async function getTrendingMedications(): Promise<TrendingMedication[]> {
  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch prescriptions from today with their items
  const { data, error } = await supabase
    .from('PrescriptionItems')
    .select(`
      medication_id,
      Medications (medication_name),
      Prescriptions (date_prescribed)
    `)
    .gte('Prescriptions.date_prescribed', today.toISOString())
    .lt('Prescriptions.date_prescribed', tomorrow.toISOString())

  if (error) {
    console.error('Error fetching trending medications:', error)
    return []
  }

  // Count prescriptions per medication
  const medicationCounts = new Map<number, { name: string; count: number }>()

  data?.forEach((item: any) => {
    const medId = item.medication_id
    const medName = item.Medications?.medication_name || 'Unknown'

    if (medicationCounts.has(medId)) {
      const current = medicationCounts.get(medId)!
      medicationCounts.set(medId, { name: medName, count: current.count + 1 })
    } else {
      medicationCounts.set(medId, { name: medName, count: 1 })
    }
  })

  // Convert to array and calculate average (for demo, we'll use count * 0.85 as average)
  const trending: TrendingMedication[] = Array.from(medicationCounts.entries())
    .map(([medication_id, { name, count }]) => ({
      medication_id,
      medication_name: name,
      prescription_count: count,
      average_daily: Math.round(count * 0.85)
    }))
    .sort((a, b) => b.prescription_count - a.prescription_count)
    .slice(0, 6)

  return trending
}

export async function getAllTableCounts(): Promise<TableCount[]> {
  const [
    medications,
    inventory,
    prescriptions,
    prescriptionItems,
    suppliers,
    purchaseOrders,
    purchaseOrderItems,
    users
  ] = await Promise.all([
    supabase.from('Medications').select('*', { count: 'exact', head: true }),
    supabase.from('Inventory').select('*', { count: 'exact', head: true }),
    supabase.from('Prescriptions').select('*', { count: 'exact', head: true }),
    supabase.from('PrescriptionItems').select('*', { count: 'exact', head: true }),
    supabase.from('Suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('PurchaseOrders').select('*', { count: 'exact', head: true }),
    supabase.from('PurchaseOrderItem').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
  ])

  return [
    { name: 'Inventory', count: inventory.count || 0, color: '#2563eb' },
    { name: 'Medications', count: medications.count || 0, color: '#059669' },
    { name: 'PrescriptionItems', count: prescriptionItems.count || 0, color: '#ea580c' },
    { name: 'Prescriptions', count: prescriptions.count || 0, color: '#7c3aed' },
    { name: 'PurchaseOrderItem', count: purchaseOrderItems.count || 0, color: '#dc2626' },
    { name: 'PurchaseOrders', count: purchaseOrders.count || 0, color: '#0891b2' },
    { name: 'Suppliers', count: suppliers.count || 0, color: '#ca8a04' },
    { name: 'Users', count: users.count || 0, color: '#db2777' }
  ]
}