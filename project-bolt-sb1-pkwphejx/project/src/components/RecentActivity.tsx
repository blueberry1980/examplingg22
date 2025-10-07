import React from 'react'
import { Package, FileText, ShoppingCart, Users } from 'lucide-react'

interface Activity {
  id: string
  type: string
  message: string
  time: string
}

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prescription': return FileText
      case 'inventory': return Package
      case 'purchase': return ShoppingCart
      case 'supplier': return Users
      default: return FileText
    }
  }
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'prescription': return 'text-blue-600 bg-blue-50'
      case 'inventory': return 'text-orange-600 bg-orange-50'
      case 'purchase': return 'text-green-600 bg-green-50'
      case 'supplier': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest system events</p>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          const colorClass = getActivityColor(activity.type)
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          )
        })}
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  )
}