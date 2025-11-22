const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4z2hdw8n@entr-postgresql.ns-ll4yxeb3.svc:5432/postgres'
});

async function createSchema() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始创建新的数据库 Schema...\n');

    // ==================== 1. Teams 表 ====================
    console.log('📋 创建 Teams 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#667eea',
        text_color VARCHAR(7) DEFAULT '#00d4ff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Teams 表创建成功\n');

    // ==================== 2. 扩展 Students 表 ====================
    console.log('📋 扩展 Students 表...');
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS total_exp INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(50);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_team_id ON students(team_id);
      CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
    `);
    console.log('✅ Students 表扩展成功\n');

    // ==================== 3. Groups 表 ====================
    console.log('📋 创建 Groups 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        color VARCHAR(7) DEFAULT '#667eea',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Groups 表创建成功\n');

    // ==================== 4. Challenges 表 ====================
    console.log('📋 创建 Challenges 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        result VARCHAR(20),
        challenger_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
        reward_points INTEGER DEFAULT 0,
        reward_exp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
    `);
    console.log('✅ Challenges 表创建成功\n');

    // ==================== 5. Challenge_Participants 表 ====================
    console.log('📋 创建 Challenge_Participants 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(challenge_id, student_id)
      );
    `);
    console.log('✅ Challenge_Participants 表创建成功\n');

    // ==================== 6. PKMatches 表 ====================
    console.log('📋 创建 PKMatches 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pk_matches (
        id SERIAL PRIMARY KEY,
        student_a_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        student_b_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        topic VARCHAR(200),
        status VARCHAR(20) DEFAULT 'pending',
        winner_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pk_matches_status ON pk_matches(status);
    `);
    console.log('✅ PKMatches 表创建成功\n');

    // ==================== 7. Tasks 表 ====================
    console.log('📋 创建 Tasks 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        exp_value INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tasks 表创建成功\n');

    // ==================== 8. Task_Assignments 表 ====================
    console.log('📋 创建 Task_Assignments 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, student_id)
      );
    `);
    console.log('✅ Task_Assignments 表创建成功\n');

    // ==================== 9. Badges 表 ====================
    console.log('📋 创建 Badges 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(20),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Badges 表创建成功\n');

    // ==================== 10. Student_Badges 表 ====================
    console.log('📋 创建 Student_Badges 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_badges (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, badge_id)
      );
    `);
    console.log('✅ Student_Badges 表创建成功\n');

    // ==================== 11. Habits 表 ====================
    console.log('📋 创建 Habits 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Habits 表创建成功\n');

    // ==================== 12. Habit_Checkins 表 ====================
    console.log('📋 创建 Habit_Checkins 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_checkins (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_habit_checkins_student_date
        ON habit_checkins(student_id, checked_in_at);
    `);
    console.log('✅ Habit_Checkins 表创建成功\n');

    // ==================== 13. Score_History 表 ====================
    console.log('📋 创建 Score_History 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS score_history (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        points_delta INTEGER,
        exp_delta INTEGER,
        reason VARCHAR(200),
        category VARCHAR(50),
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_score_history_student ON score_history(student_id);
      CREATE INDEX IF NOT EXISTS idx_score_history_date ON score_history(created_at);
    `);
    console.log('✅ Score_History 表创建成功\n');

    // ==================== 14. 插入默认数据 ====================
    console.log('📋 插入默认数据...');

    // 插入团队
    await client.query(`
      INSERT INTO teams (name, color, text_color) VALUES
        ('新星前锋', '#06b6d4', '#00d4ff'),
        ('旋涡毒蛇', '#a855f7', '#c084fc'),
        ('猩红守卫', '#ef4444', '#fca5a5'),
        ('翡翠哨兵', '#10b981', '#6ee7b7')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('  ✅ 团队数据插入成功');

    // 插入勋章
    await client.query(`
      INSERT INTO badges (name, icon, description) VALUES
        ('学霸之星', '⭐', '学习表现突出'),
        ('挑战先锋', '🛡️', '完成挑战最多'),
        ('阅读达人', '📖', '阅读书籍超过5本'),
        ('全勤奖', '🏃', '本月无缺席'),
        ('小画家', '🎨', '美术课表现优异'),
        ('小小科学家', '💡', '科学实验动手能力强')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('  ✅ 勋章数据插入成功');

    // 插入习惯
    await client.query(`
      INSERT INTO habits (name, icon) VALUES
        ('早起', '🌞'),
        ('阅读', '📖'),
        ('运动', '🏃'),
        ('思考', '💡'),
        ('卫生', '🧹'),
        ('助人', '🤝'),
        ('作业', '📝'),
        ('整理', '🧺'),
        ('礼仪', '🙏'),
        ('守时', '⏰'),
        ('专注', '🎯'),
        ('饮水', '💧'),
        ('午休', '😴'),
        ('阅读笔记', '📚'),
        ('口语练习', '🗣️'),
        ('体育锻炼', '⚽'),
        ('音乐练习', '🎵'),
        ('科学实验', '🔬')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('  ✅ 习惯数据插入成功');

    // 创建默认分组
    await client.query(`
      INSERT INTO groups (name, display_order, color) VALUES
        ('A班', 1, '#667eea'),
        ('B班', 2, '#764ba2'),
        ('C班', 3, '#f093fb')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('  ✅ 分组数据插入成功\n');

    // ==================== 15. 更新现有学生数据 ====================
    console.log('📋 更新现有学生数据...');
    const teamsResult = await client.query('SELECT id FROM teams LIMIT 4');
    const teams = teamsResult.rows;

    if (teams.length > 0) {
      // 为现有学生分配团队
      const studentsResult = await client.query('SELECT id FROM students');
      for (let i = 0; i < studentsResult.rows.length; i++) {
        const student = studentsResult.rows[i];
        const team = teams[i % teams.length];
        await client.query(
          'UPDATE students SET team_id = $1, total_exp = $2, level = $3, avatar_url = $4 WHERE id = $5',
          [
            team.id,
            Math.floor(Math.random() * 1000) + 50,
            Math.floor(Math.random() * 15) + 1,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            student.id
          ]
        );
      }
      console.log(`  ✅ 为 ${studentsResult.rows.length} 个学生更新数据成功\n`);
    }

    // ==================== 16. 验证数据 ====================
    console.log('📊 验证数据...');
    const tables = [
      'teams', 'students', 'groups', 'challenges', 'challenge_participants',
      'pk_matches', 'tasks', 'task_assignments', 'badges', 'student_badges',
      'habits', 'habit_checkins', 'score_history'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`  📊 ${table}: ${count} 行`);
    }

    console.log('\n✨ 数据库 Schema 创建完成！\n');
    console.log('📋 创建的表:');
    console.log('  1. teams - 团队表');
    console.log('  2. students (扩展) - 学生表');
    console.log('  3. groups - 分组表');
    console.log('  4. challenges - 挑战表');
    console.log('  5. challenge_participants - 挑战参与者表');
    console.log('  6. pk_matches - PK 比赛表');
    console.log('  7. tasks - 任务表');
    console.log('  8. task_assignments - 任务分配表');
    console.log('  9. badges - 勋章表');
    console.log('  10. student_badges - 学生勋章表');
    console.log('  11. habits - 习惯表');
    console.log('  12. habit_checkins - 习惯打卡表');
    console.log('  13. score_history - 积分历史表');

    console.log('\n🚀 下一步: 启动后端服务');
    console.log('   node server.js\n');

  } catch (error) {
    console.error('❌ 创建 Schema 失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

// 执行
createSchema();
