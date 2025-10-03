import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrate() {
    try {
        // Read the schema file
        const schemaPath = path.join(__dirname, '../sql/00-database-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Connect to PostgreSQL
        const client = await pool.connect();
        try {
            // Begin transaction
            await client.query('BEGIN');

            // Execute schema
            await client.query(schema);

            // Commit transaction
            await client.query('COMMIT');
            
            console.log('Migration completed successfully');
        } catch (err) {
            // Rollback in case of error
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();