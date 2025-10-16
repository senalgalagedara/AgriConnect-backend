// Quick database verification script
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function verifyTables() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432')
  });

  await client.connect();
  console.log('✓ Connected to database\n');

  try {
    // Check all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tables = await client.query(tablesQuery);
    
    console.log('📊 Database Tables:');
    console.log('==================');
    tables.rows.forEach((row, idx) => {
      console.log(`${(idx + 1).toString().padStart(2, '0')}. ${row.table_name}`);
    });
    console.log(`\nTotal: ${tables.rows.length} tables\n`);

    // Check counts
    const expectedTables = ['carts', 'cart_items', 'orders', 'order_items', 'payments', 'drivers', 'assignments'];
    
    console.log('📈 Record Counts:');
    console.log('=================');
    
    for (const table of expectedTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`${table.padEnd(20)} → ${count} records`);
      } catch (err) {
        console.log(`${table.padEnd(20)} → ❌ Table not found`);
      }
    }

    // Check drivers specifically
    console.log('\n🚗 Sample Drivers:');
    console.log('=================');
    const drivers = await client.query('SELECT name, location, vehicle_type, availability_status FROM drivers LIMIT 5');
    drivers.rows.forEach(d => {
      console.log(`- ${d.name} (${d.location}) - ${d.vehicle_type} - ${d.availability_status}`);
    });

  } finally {
    await client.end();
    console.log('\n✓ Verification complete');
  }
}

verifyTables().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
