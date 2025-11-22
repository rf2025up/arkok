const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres'
});

async function migrateDatabase() {
  try {
    console.log('🔄 开始数据库迁移...');

    // 1. 创建 groups 表
    console.log('📋 创建 groups 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        color VARCHAR(7) DEFAULT '#667eea',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ groups 表创建成功');

    // 2. 为 students 表添加 group_id 字段
    console.log('📋 为 students 表添加 group_id 字段...');
    await pool.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;
    `);
    console.log('✅ group_id 字段添加成功');

    // 3. 创建默认分组
    console.log('📋 创建默认分组...');
    const defaultGroups = [
      { name: 'A班', order: 1, color: '#667eea' },
      { name: 'B班', order: 2, color: '#764ba2' },
      { name: 'C班', order: 3, color: '#f093fb' }
    ];

    for (const group of defaultGroups) {
      const checkResult = await pool.query(
        'SELECT id FROM groups WHERE name = $1',
        [group.name]
      );
      if (checkResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO groups (name, display_order, color) VALUES ($1, $2, $3)',
          [group.name, group.order, group.color]
        );
        console.log(`  ✅ 分组 "${group.name}" 创建成功`);
      }
    }

    // 4. 为现有学生分配默认分组
    console.log('📋 为现有学生分配默认分组...');
    const students = await pool.query('SELECT id FROM students ORDER BY id');
    const groups = await pool.query('SELECT id FROM groups ORDER BY display_order');

    students.rows.forEach((student, index) => {
      const groupId = groups.rows[index % groups.rows.length].id;
      pool.query(
        'UPDATE students SET group_id = $1 WHERE id = $2',
        [groupId, student.id]
      );
    });
    console.log(`✅ 为 ${students.rows.length} 个学生分配了分组`);

    console.log('\n✨ 数据库迁移完成！');
    console.log('📊 新增表: groups');
    console.log('📊 新增字段: students.group_id');
    console.log('\n可以运行: node server.js');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateDatabase();
