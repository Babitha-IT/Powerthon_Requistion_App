import { Pool } from 'pg'

// Mock in-memory storage for when database is not available
let mockUsers: any[] = [
  {
    userid: 'EMP001',
    name: 'John Doe',
    emailid: 'john@company.com',
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

let mockRequisitions: any[] = [
  {
    id: 1,
    empployeename: 'John Doe',
    employeeid: 'EMP001',
    employeeemail: 'john@company.com',
    pod: 'Engineering',
    purpose: 'Laptop for development work',
    software: 'Visual Studio Code',
    software_id: 1,
    statusid: 1,
    approvedby: null,
    approvedon: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    empployeename: 'John Doe',
    employeeid: 'EMP001',
    employeeemail: 'john@company.com',
    pod: 'Engineering',
    purpose: 'Software license for project',
    software: 'Microsoft Office',
    software_id: 2,
    statusid: 1,
    approvedby: null,
    approvedon: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    empployeename: 'Mike Johnson',
    employeeid: 'HOD001',
    employeeemail: 'hod@company.com',
    pod: 'Management',
    purpose: 'Office supplies for department',
    software: 'Adobe Photoshop',
    software_id: 3,
    statusid: 1,
    approvedby: null,
    approvedon: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

let nextRequisitionId = 4

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

let isUsingDatabase = true

export { pool, mockUsers, mockRequisitions, nextRequisitionId }

export function getNextId() {
  return nextRequisitionId++
}

export function setDatabaseStatus(status: boolean) {
  isUsingDatabase = status
}

export function getDatabaseStatus() {
  return isUsingDatabase
}

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect()
  try {
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_users (
        userid VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        emailid VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        userrole VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default test users if no users exist
    const userCount = await client.query('SELECT COUNT(*) FROM pg_users')
    if (parseInt(userCount.rows[0].count) === 0) {
      const testUsers = [
        {
          userid: 'EMP001',
          name: 'John Doe',
          emailid: 'john@company.com',
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
      
      for (const user of testUsers) {
        await client.query(`
          INSERT INTO pg_users (userid, name, emailid, password, userrole) 
          VALUES ($1, $2, $3, $4, $5)
        `, [user.userid, user.name, user.emailid, user.password, user.userrole])
      }
    }

    // Create requisitions table if it doesn't exist (matching existing schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_requisitions (
        id SERIAL PRIMARY KEY,
        empployeename VARCHAR(255) NOT NULL,
        employeeid VARCHAR(100) NOT NULL,
        employeeemail VARCHAR(255) NOT NULL,
        pod VARCHAR(100) NOT NULL,
        purpose TEXT NOT NULL,
        software VARCHAR(255),
        statusid INTEGER DEFAULT 1,
        approvedby VARCHAR(255),
        approvedon TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Add software columns if they don't exist (for existing tables)
    try {
      await client.query(`
        ALTER TABLE pg_requisitions 
        ADD COLUMN IF NOT EXISTS software VARCHAR(255)
      `)
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Software column already exists or error adding it:', error.message)
    }
    
    try {
      await client.query(`
        ALTER TABLE pg_requisitions 
        ADD COLUMN IF NOT EXISTS software_id INTEGER
      `)
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Software_id column already exists or error adding it:', error.message)
    }

    // Create softwares table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_softwares (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(100),
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create budgets table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pg_budgets (
        id SERIAL PRIMARY KEY,
        pod VARCHAR(100) NOT NULL,
        allocated_amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        fiscal_year VARCHAR(10) DEFAULT '2024-25',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pod, fiscal_year)
      )
    `)
    
    // Insert budget data if none exist
    const budgetCount = await client.query('SELECT COUNT(*) FROM pg_budgets')
    if (parseInt(budgetCount.rows[0].count) === 0) {
      const testBudgets = [
        {
          pod: 'Engineering',
          allocated_amount: 500000.00,
          currency: 'INR'
        },
        {
          pod: 'Management',
          allocated_amount: 200000.00,
          currency: 'INR'
        },
        {
          pod: 'Procure',
          allocated_amount: 300000.00,
          currency: 'INR'
        },
        {
          pod: 'Finance',
          allocated_amount: 150000.00,
          currency: 'INR'
        },
        {
          pod: 'HR',
          allocated_amount: 100000.00,
          currency: 'INR'
        }
      ]
      
      for (const budget of testBudgets) {
        await client.query(`
          INSERT INTO pg_budgets (pod, allocated_amount, currency)
          VALUES ($1, $2, $3)
        `, [budget.pod, budget.allocated_amount, budget.currency])
      }
    }
    
    // Add cost and license_type columns if they don't exist
    try {
      await client.query(`
        ALTER TABLE pg_softwares 
        ADD COLUMN IF NOT EXISTS software_id INTEGER GENERATED ALWAYS AS IDENTITY,
        ADD COLUMN IF NOT EXISTS software_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS license_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS currencycode VARCHAR(10) DEFAULT 'INR'
      `)
    } catch (error) {
      console.log('Software columns already exist or error adding them:', error.message)
    }
    
    // Insert test software data if none exist - first check if we have data using software_name column
    const softwareCountResult = await client.query('SELECT COUNT(*) FROM pg_softwares WHERE software_name IS NOT NULL')
    if (parseInt(softwareCountResult.rows[0].count) === 0) {
      const testSoftware = [
        {
          software_name: 'Visual Studio Code',
          license_type: 'Development Tools',
          cost: 0.00,
          currencycode: 'INR'
        },
        {
          software_name: 'Microsoft Office',
          license_type: 'Office Suite',
          cost: 8000.00,
          currencycode: 'INR'
        },
        {
          software_name: 'Adobe Photoshop',
          license_type: 'Graphics Design',
          cost: 15000.00,
          currencycode: 'INR'
        },
        {
          software_name: 'AutoCAD',
          license_type: 'Design',
          cost: 120000.00,
          currencycode: 'INR'
        },
        {
          software_name: 'Slack Pro',
          license_type: 'Communication',
          cost: 2500.00,
          currencycode: 'INR'
        },
        {
          software_name: 'Figma Pro',
          license_type: 'Design',
          cost: 1200.00,
          currencycode: 'INR'
        },
        {
          software_name: 'Jira Software',
          license_type: 'Project Management',
          cost: 5000.00,
          currencycode: 'INR'
        },
        {
          software_name: 'GitHub Copilot',
          license_type: 'Development Tools',
          cost: 800.00,
          currencycode: 'INR'
        }
      ]
      
      for (const software of testSoftware) {
        await client.query(`
          INSERT INTO pg_softwares (software_name, license_type, cost, currencycode)
          VALUES ($1, $2, $3, $4)
        `, [software.software_name, software.license_type, software.cost, software.currencycode])
      }
    }
    
    // Insert test requisitions if none exist
    const reqCount = await client.query('SELECT COUNT(*) FROM pg_requisitions')
    if (parseInt(reqCount.rows[0].count) === 0) {
      const testRequisitions = [
        {
          empployeename: 'John Doe',
          employeeid: 'EMP001',
          employeeemail: 'john@company.com',
          pod: 'Engineering',
          purpose: 'Laptop for development work',
          software: 'Visual Studio Code',
          software_id: 1
        },
        {
          empployeename: 'John Doe',
          employeeid: 'EMP001',
          employeeemail: 'john@company.com',
          pod: 'Engineering',
          purpose: 'Software license for project',
          software: 'Microsoft Office',
          software_id: 2
        },
        {
          empployeename: 'Mike Johnson',
          employeeid: 'HOD001',
          employeeemail: 'hod@company.com',
          pod: 'Management',
          purpose: 'Office supplies for department',
          software: 'Adobe Photoshop',
          software_id: 3
        }
      ]
      
      for (const req of testRequisitions) {
        await client.query(`
          INSERT INTO pg_requisitions (empployeename, employeeid, employeeemail, pod, purpose, software, software_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [req.empployeename, req.employeeid, req.employeeemail, req.pod, req.purpose, req.software, req.software_id])
      }
    }
    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  } finally {
    client.release()
  }
}