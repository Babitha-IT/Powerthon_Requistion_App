import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requisitionId = searchParams.get('id') || '6'
    
    console.log('=== CHECKING ALL REQUISITIONS ===')
    
    const client = await pool.connect()
    
    try {
      // Check all requisitions
      const allRequisitions = await client.query(`
        SELECT id, empployeename, statusid, approvedby, approvedon
        FROM pg_requisitions 
        ORDER BY id
      `)
      
      console.log('All requisitions:', allRequisitions.rows)
      
      return NextResponse.json({
        success: true,
        message: 'All requisitions data',
        data: allRequisitions.rows
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database operation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}