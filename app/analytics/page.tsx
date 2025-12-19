'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  Filler
)

interface AnalyticsData {
  budgetUtilization?: any[]
  softwareDetails?: any[]
  categoryBreakdown?: any[]
  podAnalysis?: any[]
  monthlyTrends?: any[]
  varianceAnalysis?: any[]
  categoryTrends?: any[]
  growthRates?: any[]
  overview?: any
  budgetSummary?: any[]
  summary?: any
  insights?: any
  topSpender?: any
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState<{[key: string]: any}>({})

  useEffect(() => {
    if (user) {
      fetchAllAnalytics()
    }
  }, [user])

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all analytics data types
      const analyticsTypes = ['overview', 'budget-utilization', 'software-cost-analysis', 'pod-spending', 'budget-variance']
      const fetchPromises = analyticsTypes.map(async (type) => {
        const response = await fetch(`/api/analytics?type=${type}`)
        const result = await response.json()
        return { type, data: result.success ? result.data : {} }
      })
      
      const results = await Promise.all(fetchPromises)
      const combinedData = results.reduce((acc, { type, data }) => {
        acc[type] = data
        return acc
      }, {} as {[key: string]: any})
      
      console.log('Analytics Data:', combinedData)
      console.log('Recent Requisitions:', combinedData['overview']?.recentRequisitions)
      
      setAllData(combinedData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Budget Utilization Chart
  const getBudgetUtilizationChart = () => {
    const budgetData = allData['budget-utilization']?.budgetUtilization
    if (!budgetData) return null

    const data = {
      labels: budgetData.map((item: any) => item.pod),
      datasets: [
        {
          label: 'Allocated Budget',
          data: budgetData.map((item: any) => item.allocated_amount),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Spent Amount',
          data: budgetData.map((item: any) => item.total_spent),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: 'Budget Allocation vs Spending by POD' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }

    return <Bar data={data} options={options} />
  }

  // Software Cost Distribution
  const getSoftwareCostChart = () => {
    const categoryData = allData['software-cost-analysis']?.categoryBreakdown
    if (!categoryData) return null

    const data = {
      labels: categoryData.map((item: any) => item.category),
      datasets: [
        {
          data: categoryData.map((item: any) => item.total_cost),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ],
          borderWidth: 2
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Software Cost Distribution by Category' },
        legend: { position: 'right' as const }
      }
    }

    return <Doughnut data={data} options={options} />
  }



  // Budget Variance Chart
  const getBudgetVarianceChart = () => {
    const varianceData = allData['budget-variance']?.varianceAnalysis
    if (!varianceData) return null

    const data = {
      labels: varianceData.map((item: any) => item.pod),
      datasets: [
        {
          label: 'Budget Variance Amount',
          data: varianceData.map((item: any) => item.variance_amount),
          backgroundColor: varianceData.map((item: any) => 
            item.variance_amount >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
          ),
          borderColor: varianceData.map((item: any) => 
            item.variance_amount >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
          ),
          borderWidth: 1
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Budget Variance Analysis' },
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Variance Amount (Positive = Under Budget)' }
        }
      }
    }

    return <Bar data={data} options={options} />
  }

  // POD Budget Distribution Pie Chart
  const getPODBudgetPieChart = () => {
    const budgetData = allData['budget-utilization']?.budgetUtilization
    if (!budgetData) return null

    const allocatedData = budgetData.map((item: any) => ({
      pod: item.pod,
      allocated: parseFloat(item.allocated_amount)
    }))
    
    const spentData = budgetData.map((item: any) => ({
      pod: item.pod,
      spent: parseFloat(item.total_spent)
    }))

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
      '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ]

    const allocatedChart = {
      labels: allocatedData.map((item:any) => `${item.pod} (Allocated)`),
      datasets: [{
        data: allocatedData.map((item :any)=> item.allocated),
        backgroundColor: colors,
        borderWidth: 2
      }]
    }

    const spentChart = {
      labels: spentData.map(item => `${item.pod} (Spent)`),
      datasets: [{
        data: spentData.map(item => item.spent),
        backgroundColor: colors.map(color => color + '80'), // Semi-transparent
        borderWidth: 2
      }]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: { 
          position: 'right' as const,
          labels: { boxWidth: 15, font: { size: 11 } }
        }
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium mb-4 text-center">Allocated Budget Distribution</h4>
          <Doughnut data={allocatedChart} options={options} />
        </div>
        <div>
          <h4 className="text-lg font-medium mb-4 text-center">Spent Budget Distribution</h4>
          <Doughnut data={spentChart} options={options} />
        </div>
      </div>
    )
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const overviewData = allData['overview']?.overview
  const budgetSummary = allData['budget-utilization']?.summary
  const varianceSummary = allData['budget-variance']?.summary

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive analysis of budgets, software costs, and POD performance
        </p>
      </div>

      {/* Overview Statistics */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Total Requisitions</h3>
            <p className="text-3xl font-bold">{overviewData.total_requisitions}</p>
            <p className="text-sm opacity-80">
              {overviewData.approved_requisitions} approved
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Total Spending</h3>
            <p className="text-3xl font-bold">₹{parseFloat(overviewData.total_approved_cost || 0).toLocaleString()}</p>
            <p className="text-sm opacity-80">Approved costs</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Active PODs</h3>
            <p className="text-3xl font-bold">{overviewData.total_pods}</p>
            <p className="text-sm opacity-80">Departments</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Software Types</h3>
            <p className="text-3xl font-bold">{overviewData.unique_software_requested}</p>
            <p className="text-sm opacity-80">Unique software</p>
          </div>
        </div>
      )}

      {/* Budget Analysis Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">💰 Budget Analysis</h2>
        
        {budgetSummary && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Budget Summary</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{parseFloat(budgetSummary.totalAllocated || 0).toLocaleString()}
                </p>
                <p className="text-gray-600">Total Allocated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  ₹{parseFloat(budgetSummary.totalSpent || 0).toLocaleString()}
                </p>
                <p className="text-gray-600">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(budgetSummary.averageUtilization || 0)}%
                </p>
                <p className="text-gray-600">Avg Utilization</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Budget vs Spending</h3>
          {getBudgetUtilizationChart()}
        </div>
      </div>

      {/* POD Budget Distribution Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">🏢 POD Budget Distribution</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Budget Allocation vs Spending Distribution</h3>
          {getPODBudgetPieChart()}
        </div>
      </div>

      {/* Detailed Data Tables */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-4">Detailed Budget Data</h3>
        <div className="overflow-x-auto">
          {allData['budget-utilization']?.budgetUtilization && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">POD</th>
                  <th className="px-4 py-2 text-right">Allocated</th>
                  <th className="px-4 py-2 text-right">Spent</th>
                  <th className="px-4 py-2 text-right">Remaining</th>
                  <th className="px-4 py-2 text-right">Utilization %</th>
                  <th className="px-4 py-2 text-right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {allData['budget-utilization'].budgetUtilization.map((item: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 font-medium">{item.pod}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.allocated_amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.total_spent).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.remaining_budget).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{item.utilization_percentage}%</td>
                    <td className="px-4 py-2 text-right">{item.total_requisitions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-4">Software Cost Details</h3>
        <div className="overflow-x-auto">
          {allData['software-cost-analysis']?.softwareDetails && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Software</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                  <th className="px-4 py-2 text-right">Requests</th>
                  <th className="px-4 py-2 text-right">Approved</th>
                  <th className="px-4 py-2 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {allData['software-cost-analysis'].softwareDetails.slice(0, 10).map((item: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 font-medium">{item.software_name}</td>
                    <td className="px-4 py-2">{item.license_type}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.cost).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{item.request_count}</td>
                    <td className="px-4 py-2 text-right">{item.approved_count}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.total_approved_cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Requisitions Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">View Requisitions</h3>
          <Link 
            href="/requisitions" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View All
          </Link>
        </div>

      </div>
    </div>
  )
}