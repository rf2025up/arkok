/**
 * 清理数据库中的模拟数据
 * 保留真实的学生数据
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres'
});

async function cleanMockData() {
  const client = await pool.connect();

  try {
    console.log('🧹 开始清理模拟数据...\n');

    // 1. 清理模拟学生数据（这些是最初创建的 mock 数据）
    // 模拟数据：张三、李四、王五（ID: 1, 2, 3）
    console.log('📋 正在清理模拟学生数据...');
    const mockStudentIds = [1, 2, 3];

    for (const id of mockStudentIds) {
      // 先删除关联的数据
      await client.query('DELETE FROM student_badges WHERE student_id = $1', [id]);
      await client.query('DELETE FROM habit_checkins WHERE student_id = $1', [id]);
      await client.query('DELETE FROM task_assignments WHERE student_id = $1', [id]);
      await client.query('DELETE FROM challenge_participants WHERE student_id = $1', [id]);
      await client.query('DELETE FROM score_history WHERE student_id = $1', [id]);

      // 删除学生记录
      await client.query('DELETE FROM students WHERE id = $1', [id]);
      console.log(`  ✅ 删除模拟学生: ID ${id}`);
    }

    // 2. 统计清理后的数据
    console.log('\n📊 验证数据清理...');
    const countResult = await client.query('SELECT COUNT(*) FROM students');
    const studentCount = countResult.rows[0].count;
    console.log(`  ✅ 剩余学生数: ${studentCount}`);

    // 3. 显示当前的学生列表
    console.log('\n📝 当前数据库中的学生列表:');
    const studentsResult = await client.query(
      'SELECT id, name, score, level, class_name FROM students ORDER BY score DESC LIMIT 10'
    );

    studentsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name} (ID: ${row.id}, 分数: ${row.score}, 等级: ${row.level}, 班级: ${row.class_name})`);
    });

    if (studentCount > 10) {
      console.log(`  ... 还有 ${studentCount - 10} 名学生`);
    }

    console.log('\n✨ 清理完成！');
    console.log(`📊 最终统计: 共 ${studentCount} 名学生`);

  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

cleanMockData();
