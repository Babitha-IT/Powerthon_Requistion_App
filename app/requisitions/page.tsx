'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

type Requisition = {
  id: string
  fullName: string
  employeeId: string
  emailAddress: string
  department: string
  purposeOfRequest?: string
  software?: string
  createdAt: string
  status: string
  approvedOn?: string
}

export default function ViewRequisitionsPage() {
  const { user } = useAuth()
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [approving, setApproving] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    employeeId: '',
    fullName: '',
    emailAddress: '',
    department: '',
    software: '',
    status: '',
    createdAt: '',
    approvedOn: ''
  })

  useEffect(() => {
    if (user) {
      fetchRequisitions()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [requisitions, filters])

  const applyFilters = () => {
    let filtered = requisitions.filter((req) => {
      return (
        req.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase()) &&
        req.fullName.toLowerCase().includes(filters.fullName.toLowerCase()) &&
        req.emailAddress.toLowerCase().includes(filters.emailAddress.toLowerCase()) &&
        req.department.toLowerCase().includes(filters.department.toLowerCase()) &&
        (filters.software === '' || 
         (req.software && req.software.toLowerCase().includes(filters.software.toLowerCase()))) &&
        (filters.status === '' || 
         (filters.status === 'pending' && req.status === 1) ||
         (filters.status === 'approved' && req.status === 2)) &&
        (filters.createdAt === '' || 
         new Date(req.createdAt).toLocaleDateString().includes(filters.createdAt)) &&
        (filters.approvedOn === '' || 
         (req.approvedOn && new Date(req.approvedOn).toLocaleDateString().includes(filters.approvedOn)))
      )
    })
    setFilteredRequisitions(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }))
  }

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      fullName: '',
      emailAddress: '',
      department: '',
      software: '',
      status: '',
      createdAt: '',
      approvedOn: ''
    })
  }

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      
      // Build API URL with query parameters for filtering
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
        setRequisitions(result.data)
        setFilteredRequisitions(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch requisitions')
      }
    } catch (err) {
      console.error('Error fetching requisitions:', err)
      setError('Failed to fetch requisitions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequisitions = filteredRequisitions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleApprove = async (requisitionId: string) => {
    if (!user?.name) return
    
    console.log('Attempting to approve requisition:', requisitionId)
    console.log('Approved by:', user.name)
    
    setApproving(requisitionId)
    try {
      const response = await fetch(`/api/requisitions/${requisitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 2,
          approvedBy: user.name,
          approvedOn: new Date().toISOString()
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)
      
      if (result.success) {
        console.log('Requisition approved successfully, redirecting...')
        alert('Requisition approved successfully!')
        // Refresh the data to show updated status
        fetchRequisitions()
      } else {
        console.error('Approval failed:', result.error)
        setError(result.error || 'Failed to approve requisition')
      }
    } catch (error) {
      console.error('Error approving requisition:', error)
      setError('Failed to approve requisition')
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {user?.role === 'employee' ? 'My Requisitions' : 'View Requisitions'}
              </h1>
              <p className="mt-1 text-xs text-gray-600">
                {user?.role === 'employee' 
                  ? 'View and manage your submitted requisition requests.' 
                  : 'View and manage all submitted requisition requests.'
                }
              </p>
            </div>
            {user?.role === 'employee' && (
              <Link
                href="/requisition/create"
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Requisition
              </Link>
            )}
          </div>
        </div>
        
        <div className="p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Loading requisitions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-xs text-red-600 mb-3">{error}</p>
              <button
                onClick={fetchRequisitions}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          ) : filteredRequisitions.length === 0 && requisitions.length > 0 ? (
            <div className="text-center py-8">
              <div className="bg-yellow-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-xs text-gray-600 mb-3">Try adjusting your search filters.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No requisitions found</h3>
              <p className="text-xs text-gray-600 mb-3">Get started by creating your first requisition request.</p>
              <a
                href="/requisition/create"
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Create Requisition
              </a>
            </div>
          ) : (
            <div>
              {/* Search Filters */}
              <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-medium text-gray-700">Search Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className={`grid gap-2 ${user?.role === 'employee' ? 'grid-cols-8' : 'grid-cols-9'}`}>
                  {user?.role !== 'employee' && (
                    <input
                      type="text"
                      placeholder="Employee ID..."
                      value={filters.employeeId}
                      onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={filters.fullName}
                    onChange={(e) => handleFilterChange('fullName', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={filters.emailAddress}
                    onChange={(e) => handleFilterChange('emailAddress', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Search department..."
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Search software..."
                    value={filters.software}
                    onChange={(e) => handleFilterChange('software', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search date..."
                    value={filters.createdAt}
                    onChange={(e) => handleFilterChange('createdAt', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="px-2 py-1 text-xs text-gray-500 flex items-center justify-center">
                    Actions
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div className="mb-2 flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredRequisitions.length)} of {filteredRequisitions.length} requisitions
                </p>
              </div>

              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.role !== 'employee' && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Software
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequisitions.map((requisition) => (
                    <tr key={requisition.id} className="hover:bg-gray-50">
                      {user?.role !== 'employee' && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{requisition.employeeId}</div>
                        </td>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{requisition.fullName}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{requisition.emailAddress}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {requisition.department}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{requisition.software || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          requisition.status === 2 ? 'bg-green-100 text-green-800' :
                          requisition.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {requisition.status === 2 ? 'Approved' :
                           requisition.status === 1 ? 'Pending' :
                           'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(requisition.createdAt)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {(requisition.status === 1 && user?.role?.toLowerCase() === 'employee') ? (
                            <Link
                              href={`/requisition/create?id=${requisition.id}`}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Edit Details
                            </Link>
                          ) : (
                            <Link
                              href={`/requisition/create?id=${requisition.id}`}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-600 bg-gray-100 cursor-default"
                            >
                              View Details
                            </Link>
                          )}
                          {user?.role === 'hod' && requisition.status === 1 && (
                            <button
                              onClick={() => handleApprove(requisition.id)}
                              disabled={approving === requisition.id}
                              className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                approving === requisition.id 
                                  ? 'bg-green-400 cursor-not-allowed' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {approving === requisition.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          {user?.role === 'hod' && requisition.status === 2 && (
                            <span className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100">
                              ✓ Approved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNumber = Math.max(1, currentPage - 2) + i
                    if (pageNumber > totalPages) return null
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-2 py-1 text-xs border rounded ${
                          pageNumber === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}