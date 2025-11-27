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
    console.log('🔄 更新学生头像为自定义图片...\n');

    const result = await pool.query(`
      UPDATE students
      SET avatar_url = '/assets/student-avatar.jpg'
      RETURNING id, name, avatar_url
    `);

    console.log(`✅ 已更新 ${result.rowCount} 个学生的头像\n`);

    if (result.rows.length > 0) {
      console.log('已更新的学生：');
      result.rows.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.name} - ${s.avatar_url}`);
      });
    }

    console.log('\n✨ 头像更新完成！');
  } catch (error) {
    console.error('❌ 更新头像时出错:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateAvatars();
