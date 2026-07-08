import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  onnotice: () => {}
});

async function test() {
  try {
    console.log('Testing database connection...');

    // Check if tracking table exists
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    console.log('Tables in database:', tables.map(t => t.table_name));

    // Check tracking table structure
    if (tables.some(t => t.table_name === 'tracking')) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tracking'
        ORDER BY ordinal_position
      `;

      console.log('\nTracking table columns:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('ERROR: tracking table does not exist!');
    }

  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

test();
