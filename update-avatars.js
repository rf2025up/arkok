const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'growark-postgresql.ns-bg6fgs6y.svc',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'kngwb5cb',
  database: process.env.DB_NAME || 'postgres',
});

async function updateAvatars() {
  try {
    console.log('🔄 Updating student avatars...\n');

    const result = await pool.query(`
      UPDATE students
      SET avatar_url = 'https://api.dicebear.com/7.x/notionists/svg?seed=' || name || '&backgroundColor=ffffff'
      WHERE avatar_url LIKE '%avataaars%' OR avatar_url = '' OR avatar_url IS NULL
      RETURNING id, name, avatar_url
    `);

    console.log(`✅ Updated ${result.rowCount} student avatars\n`);

    if (result.rows.length > 0) {
      console.log('Updated students:');
      result.rows.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.name} - ${s.avatar_url}`);
      });
    }

    console.log('\n✨ Avatar update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating avatars:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateAvatars();
