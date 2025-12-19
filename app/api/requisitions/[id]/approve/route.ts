import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, mockRequisitions, getDatabaseStatus, setDatabaseStatus } from '../../../../../lib/db'

// PUT - Approve a requisition
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase()
    const body = await request.json()
    const { approvedBy } = body
    const resolvedParams = await params
    const requisitionId = resolvedParams.id

    if (!approvedBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Approved by field is required' 
        },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      console.log('Updating requisition:', requisitionId, 'approved by:', approvedBy)
      
      const result = await client.query(`
        UPDATE pg_requisitions 
        SET 
          statusid = 2, 
          approvedby = $1,
          approvedon = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING 
          id,
          empployeename as "fullName",
          employeeid as "employeeId",
          employeeemail as "emailAddress",
          pod as "department",
          purpose as "purposeOfRequest",
          software,
          statusid as "status",
          approvedby as "approvedBy",
          approvedon as "approvedOn",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [approvedBy, requisitionId])
      
      console.log('Update result:', result.rows)
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Requisition not found' 
          },
          { status: 404 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Requisition approved successfully',
        data: result.rows[0] 
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error approving requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve requisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}