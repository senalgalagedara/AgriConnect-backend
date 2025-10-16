import database from '../src/config/database';

async function verifyData() {
  try {
    console.log('\n=== USERS ===');
    const users = await database.query(`
      SELECT email, role, first_name, last_name, contact_number 
      FROM users 
      WHERE email LIKE '%test.com' 
      ORDER BY role, email
    `);
    console.table(users.rows);

    console.log('\n=== DRIVERS (with user info) ===');
    const drivers = await database.query(`
      SELECT u.email, d.name, d.vehicle_type, d.capacity, d.availability_status
      FROM drivers d
      JOIN users u ON u.id = d.user_id
      ORDER BY d.name
    `);
    console.table(drivers.rows);

    console.log('\n=== FARMERS (with user info) ===');
    const farmers = await database.query(`
      SELECT u.email, f.name, f.registration_number, f.contact_number
      FROM farmers f
      JOIN users u ON u.id = f.user_id
      ORDER BY f.name
    `);
    console.table(farmers.rows);

    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyData();
