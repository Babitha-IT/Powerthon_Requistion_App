import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, mockUsers, getDatabaseStatus, setDatabaseStatus } from '../../../lib/db'

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      )
    }

    // Try database first
    if (getDatabaseStatus()) {
      try {
        // Initialize database tables if they don't exist
        await initializeDatabase()
        
        const client = await pool.connect()
        
        try {
          const result = await client.query(`
            SELECT 
              userid,
              name,
              emailid,
              userrole,
              employeeid,
              created_at as "createdAt"
            FROM pg_users 
            WHERE emailid = $1 AND password = $2
          `, [email, password])
          
          if (result.rows.length === 0) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Invalid email or password' 
              },
              { status: 401 }
            )
          }

          const user = result.rows[0]
          
          return NextResponse.json({ 
            success: true, 
            message: 'Login successful',
            data: {
              id: user.userid,
              email: user.emailid,
              name: user.name,
              role: user.userrole,
              employeeId: user.employeeid  // Fix property name to match frontend
            }
          })
        } finally {
          client.release()
        }
      } catch (error) {
        console.log('Database not available for login, falling back to mock data:')
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    const user = mockUsers.find(u => u.emailid === email && u.password === password)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login successful (mock)',
      data: {
        id: user.userid,
        email: user.emailid,
        name: user.name,
        role: user.userrole,
        employeeId: user.employeeid || 'EMP001'  // Add employeeId for mock users
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}