'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'

type DashboardStats = {
  total: number
  approved: number
  pending: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ total: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Build API URL with query parameters for filtering based on user role
      let apiUrl = '/api/requisitions'
      if (user?.email && user?.role) {
        const params = new URLSearchParams({
          email: user.email,
          role: user.role
        })
        apiUrl += `?${params.toString()}`
      }
      
      const response = await fetch(apiUrl)
      const result = await response.json()
      
      if (result.success) {
        const requisitions = result.data
        const total = requisitions.length
        const approved = requisitions.filter((r: any) => r.status === 2).length // Assuming statusid 2 = Approved
        const pending = requisitions.filter((r: any) => r.status === 1).length  // Assuming statusid 1 = Pending
        
        setStats({ total, approved, pending })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Overview of requisition requests and their current status.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats.total}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-green-900 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">
              {loading ? '...' : stats.approved}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {loading ? '...' : stats.pending}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}