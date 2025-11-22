const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres'
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('连接到数据库...');

    // 创建 students 表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log('✓ students 表创建成功');

    // 创建更新时间的自动更新触发器
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_students_timestamp ON students;
      CREATE TRIGGER update_students_timestamp
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `;

    await client.query(createTriggerQuery);
    console.log('✓ 自动更新时间触发器创建成功');

    // 创建索引以加快搜索
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
      CREATE INDEX IF NOT EXISTS idx_students_score ON students(score);
    `;

    await client.query(createIndexQuery);
    console.log('✓ 索引创建成功');

    // 插入示例数据
    const insertSampleDataQuery = `
      INSERT INTO students (name, score) VALUES
        ('张三', 85),
        ('李四', 92),
        ('王五', 78),
        ('赵六', 88),
        ('孙七', 95)
      ON CONFLICT (name) DO NOTHING;
    `;

    await client.query(insertSampleDataQuery);
    console.log('✓ 示例数据插入成功');

    // 查询验证
    const result = await client.query('SELECT * FROM students ORDER BY score DESC');
    console.log('\n✓ 数据库初始化完成！');
    console.log('\n当前学生数据：');
    console.table(result.rows);

  } catch (error) {
    console.error('✗ 数据库初始化失败:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

initializeDatabase();
