
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ClassManage from './pages/ClassManage';
import Habits from './pages/Habits';
import Settings from './pages/Settings';

import { POINT_PRESETS as INITIAL_PRESETS } from './constants';
import { Student, Habit, PointPreset, ScoreCategory, Challenge, PKMatch, Badge, Task } from './types';

function App() {
  const cartoonAvatar = (seed: string) => {
    const s = Array.from(seed).reduce((a,c)=>a+c.charCodeAt(0),0);
    const hue = s % 360;
    const skin = `hsl(${(hue+30)%360},70%,85%)`;
    const hair = `hsl(${(hue+200)%360},60%,35%)`;
    const shirt = `hsl(${(hue+120)%360},60%,70%)`;
    const bag = `hsl(${(hue+180)%360},30%,40%)`;
    const sky1 = `hsl(${(hue+180)%360},80%,92%)`;
    const sky2 = `hsl(${(hue+180)%360},80%,85%)`;
    const grass = `hsl(${(hue+90)%360},50%,85%)`;
    const building = `#ffedd5`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='${sky1}'/>
          <stop offset='100%' stop-color='${sky2}'/>
        </linearGradient>
      </defs>
      <rect width='64' height='64' fill='url(#g)'/>
      <rect x='0' y='46' width='64' height='18' fill='${grass}'/>
      <rect x='18' y='28' width='28' height='12' fill='${building}' rx='2'/>
      <rect x='24' y='30' width='16' height='8' fill='#ffffff' rx='1'/>
      <circle cx='14' cy='40' r='5' fill='#86efac'/>
      <circle cx='50' cy='40' r='5' fill='#86efac'/>
      <circle cx='40' cy='12' r='3' fill='#ffffff' opacity='0.8'/>
      <circle cx='44' cy='14' r='2' fill='#ffffff' opacity='0.8'/>
      <circle cx='22' cy='13' r='2' fill='#ffffff' opacity='0.8'/>
      <circle cx='32' cy='24' r='12' fill='${skin}'/>
      <path d='M20 20 C24 15,40 15,44 20 L44 22 C40 18,24 18,20 22 Z' fill='${hair}'/>
      <circle cx='27' cy='24' r='2' fill='#111827'/>
      <circle cx='37' cy='24' r='2' fill='#111827'/>
      <path d='M28 30 C32 33,36 33,36 30' stroke='#111827' stroke-width='2' fill='none' stroke-linecap='round'/>
      <rect x='22' y='36' width='20' height='14' rx='7' fill='${shirt}'/>
      <path d='M24 36 L24 50' stroke='${bag}' stroke-width='2'/>
      <path d='M40 36 L40 50' stroke='${bag}' stroke-width='2'/>
    </svg>`;
    return `data:image/svg+xml;utf8,${svg.replace(/#/g,'%23')}`;
  };
  const expForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.25, Math.max(0, lvl-1)));
  const calcLevelFromExp = (totalExp: number) => {
    let acc = 0;
    let lvl = 1;
    while (totalExp - acc >= expForLevel(lvl)) {
      acc += expForLevel(lvl);
      lvl += 1;
    }
    return lvl;
  };
  // Global State
  const [students, setStudents] = useState<Student[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Lifted State for Class Management Features
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [pkMatches, setPkMatches] = useState<PKMatch[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [identity, setIdentity] = useState<'teacher'|'principal'>('teacher');
  const [teacherClass, setTeacherClass] = useState<string>('');

  // Lifted Score State for Synchronization
  const [scorePresets, setScorePresets] = useState<PointPreset[]>(INITIAL_PRESETS);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  // Initialize Category Names
  useEffect(() => {
    const initialNames: Record<string, string> = {};
    initialNames[ScoreCategory.ONE] = '学习成果';
    initialNames[ScoreCategory.TWO] = '午托管理';
    initialNames[ScoreCategory.THREE] = '自主性';
    initialNames[ScoreCategory.FOUR] = '学习效率';
    initialNames[ScoreCategory.FIVE] = '学习质量';
    initialNames[ScoreCategory.SIX] = '违纪扣分';
    setCategoryNames(initialNames);
  }, []);

  useEffect(() => {
    // Fetch students and habits from backend API
    const fetchData = async () => {
      try {
        // 自动检测 API 地址：开发环境用 localhost，生产环境用当前域名
        const apiUrl = process.env.REACT_APP_API_URL || (() => {
          const protocol = window.location.protocol;
          const host = window.location.host;
          return `${protocol}//${host}/api`;
        })();

        // 并行获取学生和习惯数据
        const [studentsRes, habitsRes] = await Promise.all([
          fetch(`${apiUrl}/students`),
          fetch(`${apiUrl}/habits`)
        ]);

        const studentsData = await studentsRes.json();
        const habitsData = await habitsRes.json();

        if (studentsData.success && Array.isArray(studentsData.data)) {
          // Map API response to Student type
          const arr: Student[] = studentsData.data.map((apiStudent: any) => ({
            id: String(apiStudent.id),
            name: apiStudent.name,
            avatar: apiStudent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(apiStudent.name)}`,
            points: apiStudent.score || 0,
            exp: apiStudent.total_exp || 0,
            level: apiStudent.level || 1,
            className: apiStudent.class_name || '未分配',
            habitStats: apiStudent.habit_stats || {}
          }));
          setStudents(arr);

          // 从学生数据中提取所有班级，自动设置班级列表
          const uniqueClasses = Array.from(new Set(arr.map(s => s.className))).sort();
          if (uniqueClasses.length > 0) {
            setClasses(uniqueClasses);
            setTeacherClass(uniqueClasses[0]);
          }
        } else {
          console.error('Failed to fetch students:', studentsData);
        }

        // 获取习惯数据
        if (habitsData.success && Array.isArray(habitsData.data)) {
          const fetchedHabits: Habit[] = habitsData.data.map((apiHabit: any) => ({
            id: String(apiHabit.id),
            name: apiHabit.name,
            icon: apiHabit.icon
          }));
          setHabits(fetchedHabits);
        } else {
          console.error('Failed to fetch habits:', habitsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    setPkMatches([]);
    setChallenges([]);
    setTasks([]);
  }, []);

  // 班级已在初始 fetchStudents 中自动设置，无需额外处理

  const handleUpdateScore = async (ids: string[], points: number, reason: string, exp?: number) => {
    try {
      // 自动检测 API 地址
      const apiUrl = process.env.REACT_APP_API_URL || (() => {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
      })();

      // 更新所有选中的学生
      for (const id of ids) {
        const response = await fetch(`${apiUrl}/students/${id}/adjust-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta: points, exp_delta: exp || 0 })
        });

        if (!response.ok) {
          console.error(`Failed to update student ${id}:`, response.statusText);
          continue;
        }

        const data = await response.json();
      }

      // 刷新学生列表以获取最新数据
      let refreshSucceeded = false;
      try {
        const refreshResponse = await fetch(`${apiUrl}/students`);
        if (!refreshResponse.ok) {
          console.error('Failed to refresh students:', refreshResponse.statusText);
        } else {
          const refreshData = await refreshResponse.json();

          if (refreshData.success && Array.isArray(refreshData.data)) {
            const arr = refreshData.data.map((apiStudent: any) => ({
              id: String(apiStudent.id),
              name: apiStudent.name,
              avatar: apiStudent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(apiStudent.name)}`,
              points: apiStudent.score || 0,
              exp: apiStudent.total_exp || 0,
              level: apiStudent.level || 1,
              className: apiStudent.class_name || '未分配',
              habitStats: apiStudent.habit_stats || {}
            }));
            setStudents(arr);
            refreshSucceeded = true;
          } else {
            console.error('Invalid response format:', refreshData);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing students:', refreshError);
      }

      // 如果刷新失败，至少在前端更新受影响学生的分数
      if (!refreshSucceeded) {
        setStudents(prevStudents =>
          prevStudents.map(s => {
            if (ids.includes(s.id)) {
              return {
                ...s,
                points: s.points + points,
                exp: (s.exp || 0) + (exp || 0),
                level: exp ? calcLevelFromExp((s.exp || 0) + exp) : s.level
              };
            }
            return s;
          })
        );
      }
    } catch (error) {
      console.error('Error updating scores:', error);
    }
  };

  const handleHabitCheckIn = async (studentIds: string[], habitId: string) => {
      try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const apiUrl = `${protocol}//${host}/api`;

        // 对每个学生进行打卡
        for (const studentId of studentIds) {
          const response = await fetch(`${apiUrl}/habits/${habitId}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId })
          });

          if (!response.ok) {
            console.error(`Failed to check in student ${studentId}:`, response.statusText);
          }
        }

        // 更新打卡数据到前端状态
        setStudents(prevStudents =>
          prevStudents.map(s => {
            if (studentIds.includes(s.id)) {
              return {
                ...s,
                habitStats: {
                  ...s.habitStats,
                  [habitId]: (s.habitStats?.[habitId] || 0) + 1
                }
              };
            }
            return s;
          })
        );

        // 同时更新积分
        handleUpdateScore(studentIds, 5, '习惯打卡');
      } catch (error) {
        console.error('Error during habit check-in:', error);
      }
  };
  
  const handleUpdateHabits = (newHabits: Habit[]) => {
      setHabits(newHabits);
  };

  const handleUpdateScorePresets = (newPresets: PointPreset[]) => {
      setScorePresets(newPresets);
  };

  const handleUpdateCategoryNames = (newNames: Record<string, string>) => {
      setCategoryNames(newNames);
  };

  // New Handler: Add a fresh category
  const handleAddCategory = (categoryName: string) => {
      const newKey = `CAT_${Date.now()}`;
      setCategoryNames(prev => ({
          ...prev,
          [newKey]: categoryName
      }));
  };

  // New Handler: Update Challenge Status (Success/Fail)
  const handleChallengeStatus = async (id: string, result: 'success' | 'fail') => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          // Call API to update challenge status
          const response = await fetch(`${apiUrl}/challenges/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed', result })
          });

          if (!response.ok) {
              console.error('Failed to update challenge status:', response.statusText);
              return;
          }

          setChallenges(prev => prev.map(c => {
              if (c.id === id) {
                  if (result === 'success' && c.status === 'active') {
                      handleUpdateScore(c.participants, c.rewardPoints, `挑战成功: ${c.title}`, c.rewardExp);
                  }
                  return { ...c, status: 'completed', result };
              }
              return c;
          }));
          const ch = challenges.find(c => c.id === id);
          if (ch) {
            setStudents(prev => prev.map(s => {
              if (ch.participants.includes(s.id)) {
                const rec = {
                  id: ch.id,
                  title: ch.title,
                  result,
                  points: result === 'success' ? ch.rewardPoints : 0,
                  exp: result === 'success' ? ch.rewardExp : undefined,
                  date: new Date().toISOString()
                };
                const bonusMin = Math.floor((ch.rewardExp || 0) * 0.10);
                const bonusMax = Math.floor((ch.rewardExp || 0) * 0.30);
                const bonus = result === 'success' ? Math.floor(Math.random() * (bonusMax - bonusMin + 1)) + bonusMin : 0;
                const newExp = s.exp + bonus;
                const newLevel = calcLevelFromExp(newExp);
                return { ...s, exp: newExp, level: newLevel, challengeHistory: [ ...(s.challengeHistory || []), rec ] };
              }
              return s;
            }));
          }
      } catch (error) {
          console.error('Error updating challenge status:', error);
      }
  };

  // New Handler: Update PK Winner
  const handlePKWinner = async (id: string, winnerId: string) => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          // Call API to update PK winner
          const response = await fetch(`${apiUrl}/pk-matches/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'finished', winner_id: winnerId })
          });

          if (!response.ok) {
              console.error('Failed to update PK winner:', response.statusText);
              return;
          }

          setPkMatches(prev => prev.map(pk => {
              if (pk.id === id) {
                  const loserId = pk.studentA === winnerId ? pk.studentB : pk.studentA;
                  handleUpdateScore([winnerId], 20, `PK获胜: ${pk.topic}`);
                  handleUpdateScore([loserId], 5, `PK参与: ${pk.topic}`); // Consolation points
                  return { ...pk, status: 'finished', winnerId };
              }
              return pk;
          }));

          const pk = pkMatches.find(p => p.id === id);
          if (pk) {
            const date = new Date().toISOString();
            setStudents(prev => prev.map(s => {
              if (s.id === pk.studentA || s.id === pk.studentB) {
                const opponentId = s.id === pk.studentA ? pk.studentB : pk.studentA;
                const opponentName = prev.find(x => x.id === opponentId)?.name;
                const result: 'win' | 'lose' = s.id === winnerId ? 'win' : 'lose';
                const rec = { id: `${id}-${s.id}`, pkId: id, topic: pk.topic, opponentId, opponentName, result, date };
                const need = expForLevel(s.level);
                const pkExp = Math.floor(need * 0.05);
                const newExp = s.exp + pkExp;
                const newLevel = calcLevelFromExp(newExp);
                return { ...s, exp: newExp, level: newLevel, pkHistory: [ ...(s.pkHistory || []), rec ] };
              }
              return s;
            }));
          }
      } catch (error) {
          console.error('Error updating PK winner:', error);
      }
  };

  const handleCompleteTask = async (id: string) => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          // Call API to delete/complete task
          const response = await fetch(`${apiUrl}/tasks/${id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
              console.error('Failed to complete task:', response.statusText);
              return;
          }

          const task = tasks.find(t => t.id === id);
          if (!task) return;
          const date = new Date().toISOString();
          // award exp and record history
          setStudents(prev => prev.map(s => {
              if (task.assignedTo?.includes(s.id)) {
                  const newExp = s.exp + task.expValue;
                  const newLevel = calcLevelFromExp(newExp);
                  const rec = { id: `${id}-${s.id}`, taskId: id, title: task.title, exp: task.expValue, date };
                  return { ...s, exp: newExp, level: newLevel, taskHistory: [ ...(s.taskHistory || []), rec ] };
              }
              return s;
          }));
          // remove from active tasks
          setTasks(prev => prev.filter(t => t.id !== id));
      } catch (error) {
          console.error('Error completing task:', error);
      }
  };

  // New Handler: Grant Badge
  const handleBadgeGrant = async (badgeId: string, studentId: string) => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          // Call API to award badge
          const response = await fetch(`${apiUrl}/students/${studentId}/badges/${badgeId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
              console.error('Failed to award badge:', response.statusText);
              return;
          }

          const badge = badges.find(b => b.id === badgeId);
          if (badge) {
              handleUpdateScore([studentId], 50, `获得勋章: ${badge.name}`, 200);
              const date = new Date().toISOString();
              setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                  const rec = { id: `${badgeId}-${date}`, badgeId, name: badge.name, date };
                  return { ...s, badgeHistory: [ ...(s.badgeHistory || []), rec ] };
                }
                return s;
              }));
          }
      } catch (error) {
          console.error('Error awarding badge:', error);
      }
  };

  // New Handler: Add Badge
  const handleAddBadge = (newBadge: Badge) => {
      setBadges(prev => [...prev, newBadge]);
  }

  return (
    <Router>
      <div className="antialiased text-gray-800 max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                students={students} 
                onUpdateScore={handleUpdateScore} 
                scorePresets={scorePresets}
                categoryNames={categoryNames}
                identity={identity}
                classes={classes}
                teacherClass={teacherClass}
              />
            } 
          />
          <Route 
            path="/class" 
            element={
              <ClassManage
                students={students}
                challenges={challenges}
                tasks={tasks}
                pkMatches={pkMatches}
                badges={badges}
                habits={habits}
                scorePresets={scorePresets}
                categoryNames={categoryNames}
                onUpdateScorePresets={handleUpdateScorePresets}
                onUpdateCategoryNames={handleUpdateCategoryNames}
                
                onAddCategory={handleAddCategory}
                onChallengeStatus={handleChallengeStatus}
                onPKWinner={handlePKWinner}
                 onGrantBadge={handleBadgeGrant}
                 onAddBadge={handleAddBadge}
                 
                 setChallenges={setChallenges}
                 setPkMatches={setPkMatches}
                 setStudents={setStudents}
                 onCompleteTask={handleCompleteTask}
                 setTasks={setTasks}
                 setBadges={setBadges}
                 identity={identity}
                 teacherClass={teacherClass}
                 setTeacherClass={setTeacherClass}
                classes={classes}
              />
            } 
          />
          <Route 
            path="/habit" 
            element={
                <Habits 
                    habits={habits} 
                    students={students} 
                    onCheckIn={handleHabitCheckIn}
                    onUpdateHabits={handleUpdateHabits}
                    identity={identity}
                    teacherClass={teacherClass}
                />
            } 
          />
          <Route path="/settings" element={<Settings classes={classes} setClasses={setClasses} identity={identity} setIdentity={setIdentity} teacherClass={teacherClass} setTeacherClass={setTeacherClass} />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
