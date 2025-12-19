import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, mockRequisitions, getDatabaseStatus, setDatabaseStatus, getNextId } from '../../../lib/db'

// GET - Fetch all requisitions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const userRole = searchParams.get('role')
    
    // Try database first
    if (getDatabaseStatus()) {
      try {
        await initializeDatabase()
        const client = await pool.connect()
        
        try {
          let query = `
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
          `
          
          let queryParams: string[] = []
          
          // Filter by user email if the user is an employee (case-insensitive)
          if (userRole?.toLowerCase() === 'employee' && userEmail) {
            query += ' WHERE employeeemail = $1'
            queryParams.push(userEmail)
          }
          
          query += ' ORDER BY created_at DESC'
          
          const result = await client.query(query, queryParams)
          
          return NextResponse.json({ 
            success: true, 
            data: result.rows 
          })
        } finally {
          client.release()
        }
      } catch (error) {
        console.log('Database not available, falling back to mock data:', error.message)
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    console.log('Using mock data for requisitions')
    let filteredRequisitions = [...mockRequisitions]
    
    // Filter by user email if the user is an employee (case-insensitive)
    if (userRole?.toLowerCase() === 'employee' && userEmail) {
      filteredRequisitions = mockRequisitions.filter(req => req.employeeemail === userEmail)
    }
    
    // Transform to match expected format
    const transformedData = filteredRequisitions.map(req => ({
      id: req.id,
      fullName: req.empployeename,
      employeeId: req.employeeid,
      emailAddress: req.employeeemail,
      department: req.pod,
      purposeOfRequest: req.purpose,
      software: req.software,
      status: req.statusid,
      approvedBy: req.approvedby,
      approvedOn: req.approvedon,
      createdAt: req.created_at,
      updatedAt: req.updated_at
    }))
    
    return NextResponse.json({ 
      success: true, 
      data: transformedData 
    })
  } catch (error) {
    console.error('Error fetching requisitions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch requisitions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// POST - Create a new requisition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, employeeId, emailAddress, department, purposeOfRequest, software } = body

    // Validate required fields
    if (!fullName || !employeeId || !emailAddress || !department || !purposeOfRequest || !software) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        }, 
        { status: 400 }
      )
    }

    // Try database first
    if (getDatabaseStatus()) {
      try {
        await initializeDatabase()
        const client = await pool.connect()
        
        try {
          const result = await client.query(`
            INSERT INTO pg_requisitions (
              empployeename, employeeid, employeeemail, pod, purpose, software
            ) VALUES ($1, $2, $3, $4, $5, $6)
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
              created_at as "createdAt"
          `, [fullName, employeeId, emailAddress, department, purposeOfRequest, software])
          
          return NextResponse.json({ 
            success: true, 
            data: result.rows[0] 
          }, { status: 201 })
        } finally {
          client.release()
        }
      } catch (error) {
        console.log('Database not available, falling back to mock data:', error.message)
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    const newRequisition = {
      id: getNextId(),
      empployeename: fullName,
      employeeid: employeeId,
      employeeemail: emailAddress,
      pod: department,
      purpose: purposeOfRequest,
      software: software,
      statusid: 1,
      approvedby: null,
      approvedon: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    mockRequisitions.push(newRequisition)
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: newRequisition.id,
        fullName: newRequisition.empployeename,
        employeeId: newRequisition.employeeid,
        emailAddress: newRequisition.employeeemail,
        department: newRequisition.pod,
        purposeOfRequest: newRequisition.purpose,
        software: newRequisition.software,
        status: newRequisition.statusid,
        approvedBy: newRequisition.approvedby,
        approvedOn: newRequisition.approvedon,
        createdAt: newRequisition.created_at
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create requisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}