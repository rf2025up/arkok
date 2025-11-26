const { Pool } = require('pg');
require('dotenv').config({ path: '/home/devbox/project/arkok/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function updateClassNames() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  更新班级名称 - 数据库迁移脚本');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('数据库配置：');
  console.log(`  主机: ${process.env.DB_HOST}`);
  console.log(`  端口: ${process.env.DB_PORT}`);
  console.log(`  数据库: ${process.env.DB_NAME}`);
  console.log(`  用户: ${process.env.DB_USER}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 更新前的班级分布
    const beforeUpdate = await pool.query('SELECT class_name, COUNT(*) as count FROM students GROUP BY class_name ORDER BY class_name');
    console.log('📊 更新前的班级分布：');
    beforeUpdate.rows.forEach(row => {
      console.log(`  ${row.class_name}: ${row.count} 人`);
    });
    console.log('');

    // 执行更新
    const updateMap = {
      '三年一班': '黄老师班',
      '三年二班': '姜老师班',
      '三年三班': '龙老师班'
    };

    let totalUpdated = 0;
    for (const [oldName, newName] of Object.entries(updateMap)) {
      const result = await pool.query(
        'UPDATE students SET class_name = $1 WHERE class_name = $2',
        [newName, oldName]
      );
      console.log(`✅ ${oldName} → ${newName}: ${result.rowCount} 人`);
      totalUpdated += result.rowCount;
    }

    console.log('');
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`  总计更新: ${totalUpdated} 条记录`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    // 更新后的班级分布
    const afterUpdate = await pool.query('SELECT class_name, COUNT(*) as count FROM students GROUP BY class_name ORDER BY class_name');
    console.log('📊 更新后的班级分布：');
    afterUpdate.rows.forEach(row => {
      console.log(`  ${row.class_name}: ${row.count} 人`);
    });

    console.log('\n✅ 班级名称更新完成！');
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateClassNames();
