const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agriconnect',
  password: 'password',
  port: 5432
});

async function checkProducts() {
  try {
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('Products table structure:');
    columns.rows.forEach(c => {
      const type = c.character_maximum_length 
        ? `${c.data_type}(${c.character_maximum_length})` 
        : c.data_type;
      const nullable = c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
      const def = c.column_default ? `DEFAULT ${c.column_default}` : '';
      console.log(`  ${c.column_name}: ${type} ${nullable} ${def}`);
    });

    // Get row count
    const count = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('\nTotal products:', count.rows[0].count);

    // Get sample data
    const products = await pool.query('SELECT * FROM products LIMIT 5');
    console.log('\nSample products:');
    console.log(JSON.stringify(products.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkProducts();
