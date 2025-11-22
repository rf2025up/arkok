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
import { Student, Team, Challenge } from './types'
import { getStudents, getTeams, getChallenges, getBadges, getPKs, getRecentTasks, initializeWebSocket, subscribeToStudentChanges, subscribeToStudentCreate, subscribeToChallengeChanges } from './services/sealosService'
import { getConnectionStatus } from './services/websocket'

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [pks, setPks] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')

  useEffect(() => {
    let unsubscribeStudent: (() => void) | null = null
    let unsubscribeStudentCreate: (() => void) | null = null
    let unsubscribeChallenge: (() => void) | null = null
    let statusCheckInterval: NodeJS.Timeout | null = null

    const initialize = async () => {
      try {
        // Initialize WebSocket connection
        setConnectionStatus('connecting')
        await initializeWebSocket()
        setConnectionStatus('connected')

        // Load initial data
        const [s, c, p, tk] = await Promise.all([
          getStudents(),
          getChallenges(),
          getPKs(7),
          getRecentTasks(7)
        ])

        setStudents(s)
        setChallenges(c)
        setPks(p)
        setTasks(tk)

        // 从学生数据中提取班级信息，转换为 Team 格式
        const classColors: Record<string, { color: string; textColor: string }> = {
          '黄老师班': { color: 'bg-yellow-500', textColor: 'text-yellow-400' },
          '姜老师班': { color: 'bg-red-500', textColor: 'text-red-400' },
          '龙老师班': { color: 'bg-blue-500', textColor: 'text-blue-400' }
        }

        const uniqueClasses = Array.from(new Set(s.map(student => student.class_name || '未分配')))
        const generatedTeams: Team[] = uniqueClasses.map((className, idx) => {
          const colorKey = Object.keys(classColors)[idx] || className
          const colorSet = classColors[colorKey] || { color: 'bg-gray-500', textColor: 'text-gray-400' }
          return {
            id: className,
            name: className,
            color: colorSet.color,
            textColor: colorSet.textColor
          }
        })
        setTeams(generatedTeams)

        // Subscribe to real-time updates
        unsubscribeStudent = subscribeToStudentChanges((updatedStudents) => {
          setStudents(updatedStudents)
        })

        unsubscribeStudentCreate = subscribeToStudentCreate((newStudent) => {
          setStudents((prev) => [...prev, newStudent])
        })

        unsubscribeChallenge = subscribeToChallengeChanges((updatedChallenges) => {
          setChallenges(updatedChallenges)
        })

        // Monitor connection status every 2 seconds
        statusCheckInterval = setInterval(() => {
          const status = getConnectionStatus()
          setConnectionStatus(status)
        }, 2000)
      } catch (error) {
        console.error('Failed to initialize:', error)
        setConnectionStatus('disconnected')
      }
    }

    initialize()

    // Cleanup
    return () => {
      if (unsubscribeStudent) unsubscribeStudent()
      if (unsubscribeStudentCreate) unsubscribeStudentCreate()
      if (unsubscribeChallenge) unsubscribeChallenge()
      if (statusCheckInterval) clearInterval(statusCheckInterval)
    }
  }, [])

  const teamsMap = useMemo(() => new Map<string, Team>(teams.map(t => [t.id, t])), [teams])
  const sortedByExp = useMemo(() => [...students].sort((a, b) => b.total_exp - a.total_exp), [students])

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col overflow-hidden">
      <Header connectionStatus={connectionStatus} />
      <main className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="lg:col-span-2 h-full min-h-0">
          <LeaderboardCard title="等级大厅" rightSlot={<TeamTicker students={students} teams={teams} sortBy="total_exp" unit="经验" />}>
            <StudentLeaderboard students={sortedByExp} teamsMap={teamsMap} onAvatarChange={() => {}} />
          </LeaderboardCard>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-shrink-0">
            <PKBoardCard pks={pks} teamsMap={teamsMap} />
          </div>
          <div className="flex-grow min-h-0">
            <ChallengeArenaCard challenges={challenges} />
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