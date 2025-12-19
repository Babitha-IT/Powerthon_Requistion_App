const { Pool } = require('pg')

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'database-2.clflfpnvd9ek.ap-south-1.rds.amazonaws.com',
  database: 'requsitions',
  password: 'Welcome#123',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
})

async function createTestUsers() {
  const client = await pool.connect()
  
  try {
    console.log('Creating test users...')
    
    // Insert test users
    const users = [
      {
        userid: 'EMP001',
        name: 'John Doe',
        emailid: 'john@company.com',
        password: 'password123',
        userrole: 'employee'
      },
      {
        userid: 'EMP002',
        name: 'Jane Smith',
        emailid: 'jane@company.com',
        password: 'password123',
        userrole: 'employee'
      },
      {
        userid: 'HOD001',
        name: 'Mike Johnson',
        emailid: 'mike@company.com',
        password: 'password123',
        userrole: 'hod'
      },
      {
        userid: 'HOD002',
        name: 'Sarah Wilson',
        emailid: 'sarah@company.com',
        password: 'password123',
        userrole: 'hod'
      }
    ]
    
    for (const user of users) {
      await client.query(`
        INSERT INTO pg_users (userid, name, emailid, password, userrole, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (emailid) DO NOTHING
      `, [user.userid, user.name, user.emailid, user.password, user.userrole])
      
      console.log(`Created user: ${user.name} (${user.emailid}) - Role: ${user.userrole}`)
    }
    
    console.log('Test users created successfully!')
    
    // Display all users
    const result = await client.query('SELECT userid, name, emailid, userrole FROM pg_users ORDER BY userrole, name')
    console.log('\nAll users in database:')
    console.table(result.rows)
    
  } catch (error) {
    console.error('Error creating test users:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

createTestUsers()