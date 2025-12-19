import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, getDatabaseStatus } from '../../../lib/db'

// GET - Advanced Analytics Data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisType = searchParams.get('type') || 'overview'

    if (!getDatabaseStatus()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available' 
      })
    }

    await initializeDatabase()
    const client = await pool.connect()

    try {
      let result: any = {}

      switch (analysisType) {
        case 'budget-utilization':
          result = await getBudgetUtilizationData(client)
          break
        
        case 'software-cost-analysis':
          result = await getSoftwareCostAnalysis(client)
          break
        
        case 'pod-spending':
          result = await getPODSpendingAnalysis(client)
          break
        
        case 'budget-variance':
          result = await getBudgetVarianceAnalysis(client)
          break
        
        case 'software-category-trends':
          result = await getSoftwareCategoryTrends(client)
          break
        
        case 'overview':
        default:
          result = await getOverviewAnalytics(client)
          break
      }

      return NextResponse.json({ 
        success: true, 
        data: result 
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Budget Utilization Analysis
async function getBudgetUtilizationData(client: any) {
  const query = `
    WITH budget_spending AS (
      SELECT 
        p1.pod,
        SUM(p2.cost) as total_spent,
        b.allocated_amount,
        b.currency,
        COUNT(p1.id) as total_requisitions,
        COUNT(CASE WHEN p1.statusid = 2 THEN 1 END) as approved_requisitions
      FROM pg_requisitions p1
      JOIN pg_softwares p2 ON p1.software = p2.software_name
      LEFT JOIN pg_budgets b ON b.pod = p1.pod
      WHERE p1.statusid = 2
      GROUP BY p1.pod, b.allocated_amount, b.currency
    )
    SELECT 
      pod,
      COALESCE(allocated_amount, 0) as allocated_amount,
      currency,
      COALESCE(total_spent, 0) as total_spent,
      COALESCE(allocated_amount, 0) - COALESCE(total_spent, 0) as remaining_budget,
      CASE 
        WHEN allocated_amount > 0 THEN ROUND((total_spent / allocated_amount) * 100, 2)
        ELSE 0 
      END as utilization_percentage,
      total_requisitions,
      approved_requisitions
    FROM budget_spending
    ORDER BY utilization_percentage DESC
  `
  
  const result = await client.query(query)
  return {
    budgetUtilization: result.rows,
    summary: {
      totalAllocated: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.allocated_amount), 0),
      totalSpent: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_spent), 0),
      averageUtilization: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.utilization_percentage), 0) / result.rows.length
    }
  }
}

// Software Cost Analysis
async function getSoftwareCostAnalysis(client: any) {
  const query = `
    SELECT 
      s.software_name,
      s.license_type,
      s.cost,
      s.currencycode,
      COUNT(r.id) as request_count,
      COUNT(CASE WHEN r.statusid = 2 THEN 1 END) as approved_count,
      COUNT(CASE WHEN r.statusid = 1 THEN 1 END) as pending_count,
      COALESCE(SUM(CASE WHEN r.statusid = 2 THEN s.cost ELSE 0 END), 0) as total_approved_cost
    FROM pg_softwares s
    LEFT JOIN pg_requisitions r ON s.software_name = r.software
    GROUP BY s.software_name, s.license_type, s.cost, s.currencycode
    ORDER BY total_approved_cost DESC
  `
  
  const result = await client.query(query)
  
  // Category-wise breakdown
  const categoryQuery = `
    SELECT 
      s.license_type as category,
      COUNT(r.id) as request_count,
      COUNT(CASE WHEN r.statusid = 2 THEN 1 END) as approved_count,
      COALESCE(SUM(CASE WHEN r.statusid = 2 THEN s.cost ELSE 0 END), 0) as total_cost,
      COALESCE(AVG(s.cost), 0) as average_cost
    FROM pg_softwares s
    LEFT JOIN pg_requisitions r ON s.software_name = r.software
    GROUP BY s.license_type
    ORDER BY total_cost DESC
  `
  
  const categoryResult = await client.query(categoryQuery)
  
  return {
    softwareDetails: result.rows,
    categoryBreakdown: categoryResult.rows,
    insights: {
      mostExpensiveSoftware: result.rows[0],
      totalUniqueSoftware: result.rows.length,
      totalCostApproved: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_approved_cost), 0)
    }
  }
}

// POD Spending Analysis
async function getPODSpendingAnalysis(client: any) {
  const query = `
    WITH pod_analysis AS (
      SELECT 
        p1.pod,
        SUM(p2.cost) as total_spending,
        b.allocated_amount,
        b.currency,
        COUNT(p1.id) as total_requests,
        COUNT(CASE WHEN p1.statusid = 2 THEN 1 END) as approved_requests,
        COUNT(CASE WHEN p1.statusid = 1 THEN 1 END) as pending_requests,
        COUNT(DISTINCT p1.software) as unique_software_requested,
        CASE 
          WHEN COUNT(CASE WHEN p1.statusid = 2 THEN 1 END) > 0 
          THEN SUM(p2.cost) / COUNT(CASE WHEN p1.statusid = 2 THEN 1 END)
          ELSE 0 
        END as average_cost_per_approval,
        CASE 
          WHEN b.allocated_amount > 0 THEN ROUND((SUM(p2.cost) / b.allocated_amount) * 100, 2)
          ELSE 0 
        END as budget_utilization
      FROM pg_requisitions p1
      JOIN pg_softwares p2 ON p1.software = p2.software_name
      LEFT JOIN pg_budgets b ON b.pod = p1.pod
      WHERE p1.statusid = 2
      GROUP BY p1.pod, b.allocated_amount, b.currency
    )
    SELECT * FROM pod_analysis
    ORDER BY total_spending DESC
  `
  
  const result = await client.query(query)
  
  // Monthly trend analysis
  const trendQuery = `
    SELECT 
      r.pod,
      DATE_TRUNC('month', r.created_at) as month,
      COUNT(r.id) as monthly_requests,
      COALESCE(SUM(s.cost), 0) as monthly_spending
    FROM pg_requisitions r
    LEFT JOIN pg_softwares s ON r.software = s.software_name
    WHERE r.created_at >= CURRENT_DATE - INTERVAL '6 months'
      AND r.statusid = 2
    GROUP BY r.pod, DATE_TRUNC('month', r.created_at)
    ORDER BY month DESC, monthly_spending DESC
  `
  
  const trendResult = await client.query(trendQuery)
  
  return {
    podAnalysis: result.rows,
    monthlyTrends: trendResult.rows,
    topSpender: result.rows[0],
    totalPODs: result.rows.length
  }
}

// Budget Variance Analysis
async function getBudgetVarianceAnalysis(client: any) {
  const query = `
    WITH variance_analysis AS (
      SELECT 
        p1.pod,
        SUM(p2.cost) as actual_spending,
        b.allocated_amount,
        b.currency,
        (b.allocated_amount - SUM(p2.cost)) as variance_amount,
        CASE 
          WHEN b.allocated_amount > 0 THEN 
            ROUND(((b.allocated_amount - SUM(p2.cost)) / b.allocated_amount) * 100, 2)
          ELSE 0 
        END as variance_percentage,
        CASE 
          WHEN SUM(p2.cost) > b.allocated_amount THEN 'Over Budget'
          WHEN SUM(p2.cost) = b.allocated_amount THEN 'On Budget'
          ELSE 'Under Budget'
        END as budget_status
      FROM pg_requisitions p1
      JOIN pg_softwares p2 ON p1.software = p2.software_name
      LEFT JOIN pg_budgets b ON b.pod = p1.pod
      WHERE p1.statusid = 2
      GROUP BY p1.pod, b.allocated_amount, b.currency
    )
    SELECT 
      pod,
      COALESCE(allocated_amount, 0) as allocated_amount,
      currency,
      COALESCE(actual_spending, 0) as actual_spending,
      COALESCE(variance_amount, 0) as variance_amount,
      COALESCE(variance_percentage, 0) as variance_percentage,
      budget_status
    FROM variance_analysis
    ORDER BY variance_percentage DESC
  `
  
  const result = await client.query(query)
  
  return {
    varianceAnalysis: result.rows,
    summary: {
      overBudgetPODs: result.rows.filter((row: any) => row.budget_status === 'Over Budget').length,
      underBudgetPODs: result.rows.filter((row: any) => row.budget_status === 'Under Budget').length,
      onBudgetPODs: result.rows.filter((row: any) => row.budget_status === 'On Budget').length,
      totalVariance: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.variance_amount), 0)
    }
  }
}

// Software Category Trends
async function getSoftwareCategoryTrends(client: any) {
  const query = `
    SELECT 
      s.license_type as category,
      DATE_TRUNC('month', r.created_at) as month,
      COUNT(r.id) as requests,
      COUNT(CASE WHEN r.statusid = 2 THEN 1 END) as approved,
      COALESCE(SUM(CASE WHEN r.statusid = 2 THEN s.cost ELSE 0 END), 0) as monthly_cost
    FROM pg_requisitions r
    JOIN pg_softwares s ON r.software_id = s.software_id
    WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY s.license_type, DATE_TRUNC('month', r.created_at)
    ORDER BY month DESC, monthly_cost DESC
  `
  
  const result = await client.query(query)
  
  // Growth rate calculation
  const growthQuery = `
    WITH monthly_totals AS (
      SELECT 
        DATE_TRUNC('month', r.created_at) as month,
        s.license_type as category,
        COUNT(r.id) as requests,
        COALESCE(SUM(CASE WHEN r.statusid = 2 THEN s.cost ELSE 0 END), 0) as spending
      FROM pg_requisitions r
      JOIN pg_softwares s ON r.software_id = s.software_id
      WHERE r.created_at >= CURRENT_DATE - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', r.created_at), s.license_type
    ),
    growth_calc AS (
      SELECT 
        category,
        spending,
        LAG(spending) OVER (PARTITION BY category ORDER BY month) as prev_spending,
        month
      FROM monthly_totals
    )
    SELECT 
      category,
      CASE 
        WHEN prev_spending > 0 THEN ROUND(((spending - prev_spending) / prev_spending) * 100, 2)
        ELSE 0 
      END as growth_rate
    FROM growth_calc
    WHERE prev_spending IS NOT NULL
    ORDER BY growth_rate DESC
  `
  
  const growthResult = await client.query(growthQuery)
  
  return {
    categoryTrends: result.rows,
    growthRates: growthResult.rows
  }
}

// Overview Analytics
async function getOverviewAnalytics(client: any) {
  // Get basic stats
  const overviewQuery = `
    SELECT 
      COUNT(r.id) as total_requisitions,
      COUNT(CASE WHEN r.statusid = 2 THEN 1 END) as approved_requisitions,
      COUNT(CASE WHEN r.statusid = 1 THEN 1 END) as pending_requisitions,
      COUNT(DISTINCT r.pod) as total_pods,
      COUNT(DISTINCT r.software) as unique_software_requested,
      COALESCE(SUM(CASE WHEN r.statusid = 2 THEN s.cost ELSE 0 END), 0) as total_approved_cost
    FROM pg_requisitions r
    LEFT JOIN pg_softwares s ON r.software = s.software_name
  `
  
  const overviewResult = await client.query(overviewQuery)
  
  // Get budget summary
  const budgetQuery = `
    SELECT 
      SUM(allocated_amount) as total_allocated,
      COUNT(*) as total_budgets,
      currency
    FROM pg_budgets
    GROUP BY currency
  `
  
  const budgetResult = await client.query(budgetQuery)
  
  // Get last 5 requisitions
  const recentRequisitionsQuery = `
    SELECT 
      r.id,
      r.software,
      r.purpose,
      r.pod,
      r.requested_by,
      r.created_at,
      r.statusid,
      COALESCE(s.cost, 0) as cost,
      COALESCE(s.currencycode, 'INR') as currencycode,
      CASE 
        WHEN r.statusid = 1 THEN 'Pending'
        WHEN r.statusid = 2 THEN 'Approved'
        WHEN r.statusid = 3 THEN 'Rejected'
        ELSE 'Unknown'
      END as status
    FROM pg_requisitions r
    LEFT JOIN pg_softwares s ON r.software = s.software_name
    ORDER BY r.created_at DESC
    LIMIT 5
  `
  
  const recentRequisitionsResult = await client.query(recentRequisitionsQuery)
  
  console.log('Recent Requisitions Query Result:', recentRequisitionsResult.rows)
  
  return {
    overview: overviewResult.rows[0],
    budgetSummary: budgetResult.rows,
    recentRequisitions: recentRequisitionsResult.rows
  }
}