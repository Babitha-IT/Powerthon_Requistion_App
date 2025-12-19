import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, mockRequisitions, getDatabaseStatus, setDatabaseStatus } from '../../../../lib/db'

// GET - Fetch a specific requisition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Try database first
    if (getDatabaseStatus()) {
      try {
        await initializeDatabase()
        const client = await pool.connect()
        
        try {
          const result = await client.query(`
            SELECT 
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
            FROM pg_requisitions 
            WHERE id = $1
          `, [resolvedParams.id])
          
          client.release()
          
          if (result.rows.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Requisition not found' },
              { status: 404 }
            )
          }
          
          return NextResponse.json({ 
            success: true, 
            data: result.rows[0] 
          })
        } catch (error) {
          client.release()
          throw error
        }
      } catch (error) {
        console.log('Database not available, falling back to mock data')
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    const requisition = mockRequisitions.find(req => req.id === parseInt(resolvedParams.id))
    
    if (!requisition) {
      return NextResponse.json(
        { success: false, error: 'Requisition not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: requisition.id,
        fullName: requisition.empployeename,
        employeeId: requisition.employeeid,
        emailAddress: requisition.employeeemail,
        department: requisition.pod,
        purposeOfRequest: requisition.purpose,
        software: requisition.software,
        status: requisition.statusid,
        approvedBy: requisition.approvedby,
        approvedOn: requisition.approvedon,
        createdAt: requisition.created_at,
        updatedAt: requisition.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch requisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// PUT - Update a requisition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { fullName, employeeId, emailAddress, department, purposeOfRequest, software, status, approvedBy, approvedOn } = body

    console.log('=== DETAILED REQUEST LOGGING ===')
    console.log('PUT request body:', JSON.stringify(body, null, 2))
    console.log('Requisition ID:', resolvedParams.id)
    console.log('Status received:', status, '(type:', typeof status, ')')
    console.log('ApprovedBy received:', approvedBy, '(type:', typeof approvedBy, ')')
    console.log('Full body keys:', Object.keys(body))
    console.log('Status comparison check:', status === 2, 'AND approvedBy check:', !!approvedBy)
    console.log('Database status:', getDatabaseStatus())

    // Force database to be enabled for testing
    setDatabaseStatus(true)

    // Try database first
    if (getDatabaseStatus()) {
      try {
        await initializeDatabase()
        const client = await pool.connect()
        
        try {
          // Check if this is an approval request (status = 2 and approvedBy provided)
          if (status === 2 && approvedBy) {
            console.log('=== APPROVAL REQUEST DETECTED ===')
            console.log('Processing database approval for requisition:', resolvedParams.id, 'by:', approvedBy)
            
            // First, get the HOD user ID from the database
            const userResult = await client.query(`
              SELECT userid, name, userrole 
              FROM pg_users 
              WHERE userrole ILIKE 'hod'
              LIMIT 1
            `)
            
            if (userResult.rows.length === 0) {
              throw new Error('HOD user not found in database')
            }
            
            const hodUserId = userResult.rows[0].userid
            console.log('HOD user found:', userResult.rows[0], 'Using ID:', hodUserId)
            
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
            `, [hodUserId, resolvedParams.id])
            
            console.log('=== DATABASE APPROVAL RESULT ===')
            console.log('Rows affected:', result.rowCount)
            console.log('Updated data:', result.rows)
            
            if (result.rows.length === 0) {
              console.log('ERROR: No requisition found with ID:', resolvedParams.id)
              return NextResponse.json(
                { success: false, error: 'Requisition not found' },
                { status: 404 }
              )
            }
            
            console.log('=== APPROVAL SUCCESS ===')
            console.log('Final status:', result.rows[0].status)
            console.log('Final approvedBy:', result.rows[0].approvedBy)
            
            return NextResponse.json({ 
              success: true,
              message: 'Requisition approved successfully in database', 
              data: result.rows[0] 
            })
          } else {
            console.log('=== REGULAR UPDATE REQUEST ===')
            // Regular update
            const result = await client.query(`
              UPDATE pg_requisitions 
              SET 
                empployeename = COALESCE($1, empployeename),
                employeeid = COALESCE($2, employeeid),
                employeeemail = COALESCE($3, employeeemail),
                pod = COALESCE($4, pod),
                purpose = COALESCE($5, purpose),
                software = COALESCE($6, software),
                statusid = COALESCE($7, statusid),
                approvedby = COALESCE($8, approvedby),
                approvedon = COALESCE($9, approvedon),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $10
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
            `, [fullName, employeeId, emailAddress, department, purposeOfRequest, software, status, approvedBy, approvedOn, resolvedParams.id])
            
            console.log('Regular update result:', result.rows)
            
            if (result.rows.length === 0) {
              return NextResponse.json(
                { success: false, error: 'Requisition not found' },
                { status: 404 }
              )
            }
            
            return NextResponse.json({ 
              success: true, 
              data: result.rows[0] 
            })
          }
        } finally {
          client.release()
        }
      } catch (error) {
        console.log('=== DATABASE ERROR ===')
        console.log('Database error details:', error.message)
        console.log('Falling back to mock data')
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    const requisitionIndex = mockRequisitions.findIndex(req => req.id === parseInt(resolvedParams.id))
    
    if (requisitionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Requisition not found' },
        { status: 404 }
      )
    }
    
    // Check if this is an approval request
    if (status === 2 && approvedBy) {
      console.log('Processing mock approval for requisition:', resolvedParams.id, 'by:', approvedBy)
      
      // Update the mock data
      mockRequisitions[requisitionIndex] = {
        ...mockRequisitions[requisitionIndex],
        statusid: 2,
        approvedby: approvedBy,
        approvedon: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Mock approval update result:', mockRequisitions[requisitionIndex])
      
      return NextResponse.json({ 
        success: true,
        message: 'Requisition approved successfully (mock)', 
        data: {
          id: mockRequisitions[requisitionIndex].id,
          fullName: mockRequisitions[requisitionIndex].empployeename,
          employeeId: mockRequisitions[requisitionIndex].employeeid,
          emailAddress: mockRequisitions[requisitionIndex].employeeemail,
          department: mockRequisitions[requisitionIndex].pod,
          purposeOfRequest: mockRequisitions[requisitionIndex].purpose,
          software: mockRequisitions[requisitionIndex].software,
          status: mockRequisitions[requisitionIndex].statusid,
          approvedBy: mockRequisitions[requisitionIndex].approvedby,
          approvedOn: mockRequisitions[requisitionIndex].approvedon,
          createdAt: mockRequisitions[requisitionIndex].created_at,
          updatedAt: mockRequisitions[requisitionIndex].updated_at
        }
      })
    } else {
      // Regular update for mock data
      mockRequisitions[requisitionIndex] = {
        ...mockRequisitions[requisitionIndex],
        empployeename: fullName || mockRequisitions[requisitionIndex].empployeename,
        employeeid: employeeId || mockRequisitions[requisitionIndex].employeeid,
        employeeemail: emailAddress || mockRequisitions[requisitionIndex].employeeemail,
        pod: department || mockRequisitions[requisitionIndex].pod,
        purpose: purposeOfRequest || mockRequisitions[requisitionIndex].purpose,
        software: software || mockRequisitions[requisitionIndex].software,
        statusid: status ?? mockRequisitions[requisitionIndex].statusid,
        approvedby: approvedBy ?? mockRequisitions[requisitionIndex].approvedby,
        approvedon: approvedOn ?? mockRequisitions[requisitionIndex].approvedon,
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json({ 
        success: true, 
        data: {
          id: mockRequisitions[requisitionIndex].id,
          fullName: mockRequisitions[requisitionIndex].empployeename,
          employeeId: mockRequisitions[requisitionIndex].employeeid,
          emailAddress: mockRequisitions[requisitionIndex].employeeemail,
          department: mockRequisitions[requisitionIndex].pod,
          purposeOfRequest: mockRequisitions[requisitionIndex].purpose,
          software: mockRequisitions[requisitionIndex].software,
          status: mockRequisitions[requisitionIndex].statusid,
          approvedBy: mockRequisitions[requisitionIndex].approvedby,
          approvedOn: mockRequisitions[requisitionIndex].approvedon,
          createdAt: mockRequisitions[requisitionIndex].created_at,
          updatedAt: mockRequisitions[requisitionIndex].updated_at
        }
      })
    }
  } catch (error) {
    console.error('Error updating requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update requisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// DELETE - Delete a requisition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const resolvedParams = await params
    const client = await pool.connect()
    
    try {
      const result = await client.query(
        'DELETE FROM pg_requisitions WHERE id = $1 RETURNING id',
        [resolvedParams.id]
      )
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Requisition not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Requisition deleted successfully' 
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error deleting requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete requisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}