import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Header from './components/Header'
import LeaderboardCard from './components/LeaderboardCard'
import StudentLeaderboard from './components/StudentLeaderboard'
import TeamLeaderboard from './components/TeamLeaderboard'
import TeamTicker from './components/TeamTicker'
import ChallengeArenaCard from './components/ChallengeArenaCard'
import HonorBadgesCard from './components/HonorBadgesCard'
import PKBoardCard from './components/PKBoardCard'
import { Student, Team } from './types'
import { getTeams } from './services/sealosService'

// 自动检测 API 地址：开发环境用 localhost，生产环境用当前域名
const getApiBaseUrl = () => {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
  return `${protocol}//${host}/api`
}

const API_BASE_URL = getApiBaseUrl()

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [realPks, setRealPks] = useState<any[]>([])
  const [realChallenges, setRealChallenges] = useState<any[]>([])

  // 初始加载队伍数据
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const t = await getTeams()
        setTeams(t)
      } catch (error) {
        console.error('Failed to load teams:', error)
      }
    }
    loadTeams()
  }, [])

  // 加载真实 PK 数据
  useEffect(() => {
    const loadPks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pk-matches`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setRealPks(data.data.map((pk: any) => ({
            id: String(pk.id),
            student_a: String(pk.student_a),
            student_b: String(pk.student_b),
            topic: pk.topic,
            status: pk.status,
            winner_id: pk.winner_id ? String(pk.winner_id) : undefined,
            updated_at: new Date().toISOString()
          })))
        }
      } catch (error) {
        console.error('Failed to load PK data:', error)
      }
    }
    loadPks()
    const interval = setInterval(loadPks, 5000) // 每5秒刷新一次
    return () => clearInterval(interval)
  }, [])

  // 加载真实挑战数据
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/challenges`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setRealChallenges(data.data.map((c: any) => {
            // 状态映射：根据 status 和 result 确定显示状态
            let displayStatus = '进行中'
            if (c.status === 'active' || c.status === 'pending') {
              displayStatus = '进行中'
            } else if (c.status === 'completed') {
              // 如果已完成，根据 result 字段判断成功还是失败
              if (c.result === 'success') {
                displayStatus = '成功'
              } else if (c.result === 'fail') {
                displayStatus = '失败'
              } else {
                displayStatus = '成功' // 默认为成功（兼容旧数据）
              }
            }

            return {
              id: String(c.id),
              title: c.title,
              description: c.description,
              status: displayStatus,
              reward_points: c.reward_points,
              reward_exp: c.reward_exp,
              challenger: {
                name: c.challenger_name || '未知挑战者',
                avatar: c.challenger_avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=system&backgroundColor=ffffff'
              }
            }
          }))
        }
      } catch (error) {
        console.error('Failed to load challenge data:', error)
      }
    }
    loadChallenges()
    const interval = setInterval(loadChallenges, 5000) // 每5秒刷新一次
    return () => clearInterval(interval)
  }, [])

  // HTTP 轮询以获取实时更新
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let lastData = JSON.stringify([])

    const pollStudents = async () => {
      try {
        const studentsRes = await fetch(`${API_BASE_URL}/students`)
        const studentsData = await studentsRes.json()

        if (studentsData.success && Array.isArray(studentsData.data)) {
          const mappedStudents = studentsData.data.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            team_id: `t${s.team_id}`,
            total_exp: s.total_exp || 0,
            total_points: s.score || 0,
            avatar_url: s.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(s.name)}&backgroundColor=ffffff`,
            badges: (s.badges || []).map((b: any) => ({
              id: String(b.id),
              name: b.name,
              description: b.description || '',
              icon: b.icon || '🏆',
              image: s.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(s.name)}&backgroundColor=ffffff`,
              awardedDate: b.awarded_at
            }))
          }))

          // 比较数据是否改变
          const newData = JSON.stringify(mappedStudents)
          if (lastData !== newData) {
            lastData = newData
            setStudents(mappedStudents)
            setWsConnected(true)
          } else if (!wsConnected) {
            setWsConnected(true)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        setWsConnected(false)
      }
    }

    pollStudents()
    pollInterval = setInterval(pollStudents, 2000)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  const teamsMap = useMemo(() => new Map<string, Team>(teams.map(t => [t.id, t])), [teams])
  const sortedByExp = useMemo(() => [...students].sort((a, b) => b.total_exp - a.total_exp), [students])

  // 生成PK数据（按学生分数排序）
  const generatedPks = useMemo(() => {
    if (students.length < 2) return []

    const sortedStudents = [...students].sort((a, b) => b.total_points - a.total_points)
    const pksData = []

    for (let i = 0; i < Math.min(6, Math.floor(sortedStudents.length / 2)); i++) {
      const studentA = sortedStudents[i * 2]
      const studentB = sortedStudents[i * 2 + 1]

      pksData.push({
        id: `pk-${i}`,
        student_a: studentA.id,
        student_b: studentB.id,
        topic: ['背古诗', '速算', '英语拼写', '数学竞赛', '写作比赛', '创意思维'][i % 6],
        status: i % 3 === 0 ? 'finished' : 'pending',
        winner_id: i % 3 === 0 ? (Math.random() > 0.5 ? studentA.id : studentB.id) : undefined,
        updated_at: new Date().toISOString()
      })
    }

    return pksData
  }, [students])

  // 生成挑战数据（按学生分数排序）
  const generatedChallenges = useMemo(() => {
    if (students.length === 0) return []

    const sortedStudents = [...students].sort((a, b) => b.total_points - a.total_points)
    const challengeTypes = ['一周阅读挑战', '艺术创作', '数学速算', '英语演讲', '科学实验', '编程挑战']
    const statuses = ['进行中', '成功', '失败']
    const challenges = []

    for (let i = 0; i < Math.min(5, sortedStudents.length); i++) {
      const student = sortedStudents[i]
      challenges.push({
        id: `c-${i}`,
        title: challengeTypes[i % challengeTypes.length],
        description: `完成 ${[5, 10, 3, 2, 1, 8][i % 6]} 个任务`,
        challenger: {
          name: student.name,
          avatar: student.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${student.name}&backgroundColor=ffffff`
        },
        status: statuses[i % statuses.length]
      })
    }

    return challenges
  }, [students])

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col overflow-hidden">
      <Header wsConnected={wsConnected} />
      <main className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="lg:col-span-2 h-full min-h-0">
          <LeaderboardCard title="等级大厅" rightSlot={<TeamTicker students={students} teams={teams} sortBy="total_exp" unit="经验" />}>
            <StudentLeaderboard students={sortedByExp} teamsMap={teamsMap} onAvatarChange={() => {}} />
          </LeaderboardCard>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-shrink-0">
            <PKBoardCard pks={realPks.length > 0 ? realPks : generatedPks} teamsMap={teamsMap} students={students} />
          </div>
          <div className="flex-grow min-h-0">
            <ChallengeArenaCard challenges={realChallenges.length > 0 ? realChallenges : generatedChallenges} />
          </div>
        </div>
      </main>
      <div className="mt-4 grid grid-cols-1 gap-6 flex-shrink-0">
        <div className="col-span-1">
          <HonorBadgesCard students={students} />
        </div>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)