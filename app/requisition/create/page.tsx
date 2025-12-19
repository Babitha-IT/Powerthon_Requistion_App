'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'

type FormData = {
  fullName: string
  employeeId: string
  emailAddress: string
  department: string
  purposeOfRequest: string
  software: string
}

type Software = {
  id: number
  name: string
  category: string
  description?: string
}

const departments = [
  'Procure',
  'Snowkap',
  'eWizPromo', 
  'HR',
  'Finance',
]

export default function CreateRequisitionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const editId = searchParams.get('id')
  const isEditMode = !!editId
  const [loading, setLoading] = useState(isEditMode)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    employeeId: '',
    emailAddress: '',
    department: '',
    purposeOfRequest: '',
    software: ''
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [requisitionStatus, setRequisitionStatus] = useState<number>(1)
  const [softwares, setSoftwares] = useState<Software[]>([])
  const [loadingSoftwares, setLoadingSoftwares] = useState(true)

  // Load existing data if in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      fetchRequisition(editId)
    } else if (user && !isEditMode) {
      // Pre-fill user data for new requisitions
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        employeeId: user.employeeId || '',  // Pre-fill employee ID
        emailAddress: user.email || ''
      }))
    }
  }, [isEditMode, editId, user])
  // Load software options
  useEffect(() => {
    fetchSoftwares()
  }, [])

  const fetchSoftwares = async () => {
    try {
      setLoadingSoftwares(true)
      const response = await fetch('/api/softwares')
      const result = await response.json()
      
      if (result.success) {
        setSoftwares(result.data)
      } else {
        console.error('Failed to load softwares:', result.error)
      }
    } catch (error) {
      console.error('Error loading softwares:', error)
    } finally {
      setLoadingSoftwares(false)
    }
  }
  const fetchRequisition = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/requisitions/${id}`)
      const result = await response.json()
      
      if (result.success) {
        setFormData({
          fullName: result.data.fullName || '',
          employeeId: result.data.employeeId || '',
          emailAddress: result.data.emailAddress || '',
          department: result.data.department || '',
          purposeOfRequest: result.data.purposeOfRequest || '',
          software: result.data.software || ''
        })
        setIsApproved(result.data.status === 2)
        setRequisitionStatus(result.data.status || 1)
      } else {
        alert(`Error loading requisition: ${result.error}`)
        router.push('/requisitions')
      }
    } catch (error) {
      console.error('Error loading requisition:', error)
      alert('Error loading requisition. Redirecting back...')
      router.push('/requisitions')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({ ...prev, department }))
    if (errors.department) {
      setErrors(prev => ({ ...prev, department: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required'
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required'
    if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email Address is required'
    if (!formData.department) newErrors.department = 'Department is required'
    if (!formData.purposeOfRequest.trim()) newErrors.purposeOfRequest = 'Purpose of Request is required'
    if (!formData.software.trim()) newErrors.software = 'Software selection is required'
    
    // Basic email validation
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        const url = isEditMode ? `/api/requisitions/${editId}` : '/api/requisitions'
        const method = isEditMode ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        const result = await response.json()
        
        if (result.success) {
          const successMessage = isEditMode 
            ? 'Requisition updated successfully!' 
            : 'Requisition submitted successfully!'
          alert(successMessage)
          
          if (!isEditMode) {
            handleReset()
          }
          
          // Redirect to view requisitions page
          router.push('/requisitions')
        } else {
          alert(`Error: ${result.error}`)
        }
      } catch (error) {
        console.error('Error submitting requisition:', error)
        const errorMessage = isEditMode 
          ? 'Error updating requisition. Please try again.' 
          : 'Error submitting requisition. Please try again.'
        alert(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleReset = () => {
    setFormData({
      fullName: '',
      employeeId: '',
      emailAddress: '',
      department: '',
      purposeOfRequest: '',
      software: ''
    })
    setErrors({})
  }

  const handleApprove = async () => {
    if (!user?.name || !editId) return
    
    setIsApproving(true)
    try {
      const response = await fetch(`/api/requisitions/${editId}`, {
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

      const result = await response.json()
      
      if (result.success) {
        setIsApproved(true)
        setRequisitionStatus(2)
        alert('Requisition approved successfully!')
        // Redirect to requisitions view page after approval
        router.push('/requisitions')
      } else {
        alert(`Error approving requisition: ${result.error}`)
      }
    } catch (error) {
      console.error('Error approving requisition:', error)
      alert('Error approving requisition. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Requisition' : 'Create New Requisition'}
          </h1>
          {isApproved && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-green-700 bg-green-100">
                ✓ Approved
              </span>
              <p className="text-xs text-green-600">This requisition has been approved and cannot be modified.</p>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-600">
            {isEditMode 
              ? (isApproved 
                  ? 'View the requisition details below. This requisition cannot be modified as it has been approved.' 
                  : 'Update the requisition details below. Fields marked with * are required.') 
              : 'Fill out the form below to submit a new requisition request. Fields marked with * are required.'}
          </p>
        </div>
        
        <form onSubmit={user?.role?.toLowerCase() === 'hod' ? (e) => e.preventDefault() : handleSubmit} className="p-4 space-y-4">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gray-100 rounded-lg p-1">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-medium text-gray-900">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={true}  // Always disabled - pre-filled from logged user
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  } bg-gray-100 text-gray-500 cursor-not-allowed`}
                  placeholder="Sarah Johnson"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
              </div>
              
              <div>
                <label htmlFor="employeeId" className="block text-xs font-medium text-gray-700 mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  disabled={true}  // Always disabled - pre-filled from logged user
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.employeeId ? 'border-red-300' : 'border-gray-300'
                  } bg-gray-100 text-gray-500 cursor-not-allowed`}
                  placeholder="EMP001"
                />
                {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="emailAddress" className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  disabled={true}  // Always disabled - pre-filled from logged user
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.emailAddress ? 'border-red-300' : 'border-gray-300'
                  } bg-gray-100 text-gray-500 cursor-not-allowed`}
                  placeholder="sarah.johnson@company.com"
                />
                {errors.emailAddress && <p className="mt-1 text-xs text-red-600">{errors.emailAddress}</p>}
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gray-100 rounded-lg p-1">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-sm font-medium text-gray-900">POD Selection</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => !(isEditMode || isApproved) && handleDepartmentChange(dept)}
                  disabled={isEditMode || isApproved}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    formData.department === dept
                      ? 'bg-blue-600 text-white border-blue-600'
                      : (isEditMode || isApproved) 
                        ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            {errors.department && <p className="mt-2 text-xs text-red-600">{errors.department}</p>}
          </div>

          {/* Request Details */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gray-100 rounded-lg p-1">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-medium text-gray-900">Request Details</h2>
            </div>
            

            <div>
              <label htmlFor="software" className="block text-xs font-medium text-gray-700 mb-1">
                Software <span className="text-red-500">*</span>
              </label>
              {loadingSoftwares ? (
                <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-gray-500">Loading software options...</span>
                </div>
              ) : (
                <select
                  id="software"
                  name="software"
                  value={formData.software}
                  onChange={handleInputChange}
                  disabled={isEditMode || isApproved}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.software ? 'border-red-300' : 'border-gray-300'
                  } ${(isEditMode || isApproved) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Software...</option>
                  {softwares.map((software) => (
                    <option key={software.id} value={software.name}>
                      {software.name} {software.version && `(v${software.version})`}
                    </option>
                  ))}
                </select>
              )}
              {errors.software && (
                <p className="mt-1 text-xs text-red-600">{errors.software}</p>
              )}
            </div>
            <div></div>

                        <div>
              <label htmlFor="purposeOfRequest" className="block text-xs font-medium text-gray-700 mb-1">
                Purpose of Request <span className="text-red-500">*</span>
              </label>
              <textarea
                id="purposeOfRequest"
                name="purposeOfRequest"
                value={formData.purposeOfRequest}
                onChange={handleInputChange}
                disabled={isEditMode || isApproved}
                rows={3}
                className={`w-full px-2 py-1.5 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.purposeOfRequest ? 'border-red-300' : 'border-gray-300'
                } ${(isEditMode || isApproved) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                placeholder="Please describe the purpose of your request..."
              />
              {errors.purposeOfRequest && <p className="mt-1 text-xs text-red-600">{errors.purposeOfRequest}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        {/* Submit/Update button only for employees */}
            {!isApproved && user?.role?.toLowerCase() === 'employee' && (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-xs font-medium text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting 
                  ? (isEditMode ? 'Updating...' : 'Submitting...') 
                  : (isEditMode ? 'Update Requisition' : 'Submit Requisition')}
              </button>
            )}
            {user?.role?.toLowerCase() === 'hod' && isEditMode && requisitionStatus === 1 && !isApproved && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className={`px-6 py-2 text-xs font-medium text-white rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${
                  isApproving 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isApproving ? 'Approving...' : 'Approve Requisition'}
              </button>
            )}
            {/* Go Back button for employees in edit mode or HODs viewing requisitions */}
            {((user?.role?.toLowerCase() === 'employee') || (user?.role?.toLowerCase() === 'hod')) && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}