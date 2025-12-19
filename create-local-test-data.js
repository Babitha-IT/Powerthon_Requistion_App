const { Pool } = require('pg')

// Database configuration - using local storage for now since RDS has connectivity issues
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'requisitions_local',
  password: 'password',
  port: 5432,
})

async function createTestData() {
  const client = await pool.connect()
  
  try {
    console.log('Creating test users...')
    
    // First, let's create the users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_users (
        userid VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        emailid VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        userrole VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create requisitions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_requisitions (
        id SERIAL PRIMARY KEY,
        empployeename VARCHAR(100) NOT NULL,
        employeeid VARCHAR(20) NOT NULL,
        employeeemail VARCHAR(100) NOT NULL,
        pod VARCHAR(50) NOT NULL,
        purpose TEXT,
        statusid INTEGER DEFAULT 1,
        approvedby VARCHAR(100),
        approvedon TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Insert test users
    const users = [
      {
        userid: 'EMP001',
        name: 'John Doe',
        emailid: 'john@company.com',
        password: 'password@123',
        userrole: 'employee'
      },
      {
        userid: 'EMP002', 
        name: 'Jane Smith',
        emailid: 'jane@company.com',
        password: 'password@123',
        userrole: 'employee'
      },
      {
        userid: 'HOD001',
        name: 'Mike Johnson',
        emailid: 'hod@company.com',
        password: 'hod123',
        userrole: 'hod'
      }
    ]
    
    for (const user of users) {
      await client.query(`
        INSERT INTO pg_users (userid, name, emailid, password, userrole)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (emailid) DO NOTHING
      `, [user.userid, user.name, user.emailid, user.password, user.userrole])
    }
    
    // Insert test requisitions
    const requisitions = [
      {
        empployeename: 'John Doe',
        employeeid: 'EMP001',
        employeeemail: 'john@company.com',
        pod: 'Engineering',
        purpose: 'Laptop for development work'
      },
      {
        empployeename: 'John Doe',
        employeeid: 'EMP001',
        employeeemail: 'john@company.com',
        pod: 'Engineering',
        purpose: 'Software license for project'
      },
      {
        empployeename: 'Jane Smith',
        employeeid: 'EMP002',
        employeeemail: 'jane@company.com',
        pod: 'Marketing',
        purpose: 'Marketing materials for campaign'
      },
      {
        empployeename: 'Jane Smith',
        employeeid: 'EMP002',
        employeeemail: 'jane@company.com',
        pod: 'Marketing',
        purpose: 'Travel expenses for client meeting'
      }
    ]
    
    for (const req of requisitions) {
      await client.query(`
        INSERT INTO pg_requisitions (empployeename, employeeid, employeeemail, pod, purpose)
        VALUES ($1, $2, $3, $4, $5)
      `, [req.empployeename, req.employeeid, req.employeeemail, req.pod, req.purpose])
    }
    
    console.log('Test data created successfully!')
    
    // Display created data
    const userResult = await client.query('SELECT userid, name, emailid, userrole FROM pg_users ORDER BY userrole, name')
    console.log('\nUsers:')
    console.table(userResult.rows)
    
    const reqResult = await client.query('SELECT id, empployeename, employeeid, employeeemail, pod, purpose FROM pg_requisitions ORDER BY id')
    console.log('\nRequisitions:')
    console.table(reqResult.rows)
    
  } catch (error) {
    console.error('Error creating test data:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

createTestData()