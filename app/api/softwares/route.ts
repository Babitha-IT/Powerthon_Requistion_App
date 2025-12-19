import { NextRequest, NextResponse } from 'next/server'
import { pool, initializeDatabase, getDatabaseStatus, setDatabaseStatus } from '../../../lib/db'

// Mock software data as fallback
const mockSoftwares = [
  { id: 1, name: 'Microsoft Office 365', category: 'Productivity' },
  { id: 2, name: 'Adobe Creative Suite', category: 'Design' },
  { id: 3, name: 'Slack', category: 'Communication' },
  { id: 4, name: 'Zoom', category: 'Communication' },
  { id: 5, name: 'AutoCAD', category: 'Design' },
  { id: 6, name: 'Visual Studio Code', category: 'Development' },
  { id: 7, name: 'Figma', category: 'Design' },
  { id: 8, name: 'Teams', category: 'Communication' }
]

// GET - Fetch all softwares
export async function GET() {
  try {
    // Try database first
    if (getDatabaseStatus()) {
      try {
        await initializeDatabase()
        const client = await pool.connect()
        
        try {
          // Use the actual database schema
          const result = await client.query(`
            SELECT 
              software_id as id,
              software_name as name,
              license_type as category,
              cost,
              currencycode,
              created_at as "createdAt"
            FROM pg_softwares
            ORDER BY software_name
          `)
          
          return NextResponse.json({ 
            success: true, 
            data: result.rows 
          })
        } finally {
          client.release()
        }
      } catch (error) {
        console.log('Database not available for softwares, falling back to mock data:')
        setDatabaseStatus(false)
      }
    }
    
    // Fallback to mock data
    console.log('Using mock data for softwares')
    return NextResponse.json({ 
      success: true, 
      data: mockSoftwares 
    })
  } catch (error) {
    console.error('Error fetching softwares:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch softwares',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}