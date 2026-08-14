const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query('DELETE FROM "Integration"');
  console.log('All integrations deleted');
  await pool.end();
}

main().catch(console.error);
