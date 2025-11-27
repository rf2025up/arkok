const { Pool } = require('pg');
require('dotenv').config();

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

const connectionString = DATABASE_URL ||
  (DB_HOST && DB_PORT && DB_USER && DB_PASSWORD && DB_NAME
    ? `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
    : undefined);

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: DB_HOST || 'entr-postgresql.ns-ll4yxeb3.svc',
      port: parseInt(DB_PORT || '5432', 10),
      user: DB_USER || 'postgres',
      password: DB_PASSWORD || '4z2hdw8n',
      database: DB_NAME || 'postgres',
    });

// 28 students from mobile/App.tsx
const students = [
  '庞子玮', '刘凡兮', '余沁妍', '吴逸桐', '刘润霖', '肖正楠', '王彦舒', '陈金锐',
  '宋子晨', '徐汇洋', '黄衍恺', '舒昱恺', '方景怡', '廖研曦', '廖一凡', '唐艺馨',
  '何泽昕', '陈笑妍', '彭柏成', '樊牧宸', '曾欣媛', '肖雨虹', '宁可歆', '廖潇然',
  '肖浩轩', '陈梓萌', '彭斯晟', '谭雨涵'
];

const classes = ['黄老师班', '姜老师班', '龙老师班'];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Step 0: Get team IDs and group IDs
    console.log('🔍 Fetching team IDs...');
    const teamsResult = await pool.query('SELECT id FROM teams ORDER BY id LIMIT 4');
    if (teamsResult.rows.length === 0) {
      throw new Error('No teams found in database. Please run create-schema.js first.');
    }
    const teamIds = teamsResult.rows.map(r => r.id);
    console.log(`✅ Found ${teamIds.length} teams: ${teamIds.join(', ')}`);

    console.log('🔍 Fetching group IDs...');
    const groupsResult = await pool.query('SELECT id FROM groups ORDER BY id LIMIT 3');
    if (groupsResult.rows.length === 0) {
      throw new Error('No groups found in database. Please run create-schema.js first.');
    }
    const groupIds = groupsResult.rows.map(r => r.id);
    console.log(`✅ Found ${groupIds.length} groups: ${groupIds.join(', ')}\n`);

    // Step 1: Clear existing students
    console.log('📋 Clearing existing students...');
    await pool.query('DELETE FROM students');
    console.log('✅ Cleared old data\n');

    // Step 2: Insert 28 students
    console.log('👥 Inserting 28 students...');
    for (let i = 0; i < students.length; i++) {
      const name = students[i];
      const group_id = groupIds[i % groupIds.length]; // rotate through group IDs
      const team_id = teamIds[i % teamIds.length]; // rotate through teams
      const score = Math.floor(Math.random() * 100) + 50; // Random score 50-150
      const total_exp = Math.floor(Math.random() * 500) + 100; // Random exp 100-600
      const level = Math.floor(total_exp / 100) + 1; // Calculate level
      const avatar_url = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffffff`;
      const class_idx = i % classes.length;
      const class_name = classes[class_idx];

      const query = `
        INSERT INTO students (name, score, group_id, team_id, total_exp, level, avatar_url, class_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        name,
        score,
        group_id,
        team_id,
        total_exp,
        level,
        avatar_url,
        class_name
      ]);

      console.log(`  ✅ Student ${i + 1}/28: ${name} (Score: ${score}, Exp: ${total_exp}, Level: ${level})`);
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`📊 Total students inserted: ${students.length}`);

    // Step 3: Verify
    const verification = await pool.query('SELECT COUNT(*) as total FROM students');
    console.log(`🔍 Verification: ${verification.rows[0].total} students in database\n`);

    // List all students
    const allStudents = await pool.query('SELECT id, name, score, team_id, class_name FROM students ORDER BY id');
    console.log('📋 Final Student List:');
    console.log('─'.repeat(80));
    allStudents.rows.forEach((s, idx) => {
      console.log(`${String(idx + 1).padStart(2, '0')}. ${s.name.padEnd(8)} | Score: ${String(s.score).padStart(3)} | Team: ${s.team_id} | Class: ${s.class_name}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
