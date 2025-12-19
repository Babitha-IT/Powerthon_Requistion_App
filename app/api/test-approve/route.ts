import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase } from '../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()
    const { requisitionId, approvedBy } = body

    if (!requisitionId || !approvedBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Requisition ID and approved by are required' 
        },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      console.log('Test approve - Updating requisition ID:', requisitionId)
      console.log('Test approve - Approved by:', approvedBy)
      
      // First check if requisition exists
      const checkResult = await client.query('SELECT * FROM pg_requisitions WHERE id = $1', [requisitionId])
      console.log('Requisition found:', checkResult.rows)
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 })
      }

      const updateResult = await client.query(`
        UPDATE pg_requisitions 
        SET 
          statusid = 2, 
          approvedby = $1, 
          approvedon = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [approvedBy, requisitionId])
      
      console.log('Update result:', updateResult.rows)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test approve successful',
        data: updateResult.rows[0]
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Test approve error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test approve failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}