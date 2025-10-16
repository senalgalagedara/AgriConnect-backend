const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agriconnect',
  password: 'password',
  port: 5432
});

async function checkAndCreateUser() {
  try {
    // Check for users
    const users = await pool.query('SELECT id, email, role, first_name, last_name FROM users ORDER BY id LIMIT 10');
    console.log('\nUsers in database:', users.rows.length);
    users.rows.forEach(u => console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.first_name} ${u.last_name}, Role: ${u.role}`));
    
    if (users.rows.length === 0) {
      console.log('\n⚠️  No users found! Creating test user...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      
      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, contact_number, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, email, role, first_name, last_name`,
        ['test@example.com', hash, 'consumer', 'Test', 'User', '0771234567', 'active']
      );
      console.log('✅ Created user:', newUser.rows[0]);
    } else {
      console.log('\n✅ Users exist in database');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAndCreateUser();
