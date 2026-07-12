import pool from './api/config/db';

async function main() {
  console.log("Connecting directly to remote Hostinger database...");
  try {
    const [users]: any = await pool.query('SELECT COUNT(*) AS count FROM users');
    console.log(`Success: Direct MySQL connection established.`);
    console.log(`User records in DB: ${users[0].count}`);

    const [vehicles]: any = await pool.query('SELECT * FROM vehicles LIMIT 3');
    console.log(`Vehicle records retrieved: ${vehicles.length}`);
    vehicles.forEach((v: any) => {
      console.log(`  * [${v.registrationNumber}] - ${v.model} - Status: ${v.status}`);
    });
  } catch (error) {
    console.error("Direct connection validation failed:", error);
  } finally {
    await pool.end();
  }
}

main();
