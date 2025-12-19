import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    const client = await pool.connect()
    
    try {
      // Test basic connection
      const result = await client.query('SELECT NOW() as current_time')
      console.log('Database connection test successful:', result.rows[0])
      
      // Test if pg_requisitions table exists and get current data
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'pg_requisitions'
        )
      `)
      
      console.log('Table exists:', tableCheck.rows[0].exists)
      
      if (tableCheck.rows[0].exists) {
        const requisitions = await client.query(`
          SELECT id, empployeename, statusid, approvedby, approvedon 
          FROM pg_requisitions 
          ORDER BY id
        `)
        console.log('Current requisitions in database:', requisitions.rows)
        
        return NextResponse.json({
          success: true,
          message: 'Database connection successful',
          data: {
            connectionTime: result.rows[0].current_time,
            tableExists: tableCheck.rows[0].exists,
            requisitions: requisitions.rows
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Database connected but table does not exist',
          data: {
            connectionTime: result.rows[0].current_time,
            tableExists: false
          }
        })
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}