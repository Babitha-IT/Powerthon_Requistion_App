'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useState, useEffect } from 'react'

// Simple SVG icon components to replace heroicons
const DocumentPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const AnalyticsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

// Define navigation based on user roles
const getNavigationForRole = (role: string) => {
  // Finance role - only Analytics dashboard
  if (role?.toLowerCase() === 'finance') {
    return [
      { name: 'Analytics', href: '/analytics', icon: AnalyticsIcon }
    ]
  }

  // Employee role - full access except approval and analytics
  if (role?.toLowerCase() === 'employee') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
      { name: 'Create Requisition', href: '/requisition/create', icon: DocumentPlusIcon },
      { name: 'View Requisitions', href: '/requisitions', icon: DocumentTextIcon }
    ]
  }

  // HOD role - all access including approvals but no analytics
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    { name: 'View Requisitions', href: '/requisitions', icon: DocumentTextIcon }
  ]

  return baseNavigation
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    // Get user role from localStorage for immediate access
    const role = localStorage.getItem('userRole')
    if (role) {
      setUserRole(role)
    }
  }, [])

  // Get navigation based on user role
  const navigation = getNavigationForRole(user?.role || userRole)

  return (
    <div className="bg-slate-800 w-64 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Requisition</h1>
        </div>
      </div>

      {/* Welcome message with user name */}
      {user && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-300">
            Welcome, <span className="text-white font-medium">{user.name}</span>
          </p>
          <p className="text-xs text-gray-400 capitalize">
            {user.role}
          </p>
        </div>
      )}
      
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
        
        {/* Logout button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-gray-400">
          Need help? Contact support<br />
          support@requisition.com
        </p>
      </div>
    </div>
  )
}