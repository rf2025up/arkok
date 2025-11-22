import { Student, Team, Challenge, Badge } from '../types'
import { connectWebSocket, subscribe, disconnect, isConnected } from './websocket'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

// 缓存数据
let cachedData = {
  students: [] as Student[],
  teams: [] as Team[],
  challenges: [] as Challenge[],
  badges: [] as Badge[],
  lastUpdated: 0
}

/**
 * 获取所有学生 - 从真实后端
 */
export const getStudents = async (): Promise<Student[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    // 映射 API 返回的学生数据到 Student 类型
    cachedData.students = (result.data || []).map((s: any) => ({
      id: String(s.id),
      name: s.name,
      team_id: s.team_id,
      class_name: s.class_name || '未分配',
      total_exp: s.total_exp || 0,
      total_points: s.score || 0,
      avatar_url: s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
      badges: s.badges || []
    }))
    return cachedData.students
  } catch (error) {
    console.error('Failed to get students:', error)
    return cachedData.students // 返回缓存数据
  }
}

/**
 * 获取所有团队 - 从真实后端
 */
export const getTeams = async (): Promise<Team[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    cachedData.teams = result.data || []
    return cachedData.teams
  } catch (error) {
    console.error('Failed to get teams:', error)
    return cachedData.teams
  }
}

/**
 * 获取所有挑战 - 从真实后端
 */
export const getChallenges = async (): Promise<Challenge[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/challenges`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    cachedData.challenges = result.data || []
    return cachedData.challenges
  } catch (error) {
    console.error('Failed to get challenges:', error)
    return cachedData.challenges
  }
}

/**
 * 获取所有勋章
 */
export const getBadges = async (): Promise<Record<string, Badge[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/badges`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    cachedData.badges = result.data || []

    const badgeMap: Record<string, Badge[]> = {}
    cachedData.students.forEach(s => {
      badgeMap[s.id] = cachedData.badges
    })
    return badgeMap
  } catch (error) {
    console.error('Failed to get badges:', error)
    return {}
  }
}

/**
 * 获取 PK 比赛
 */
export const getPKs = async (sinceDays = 7): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pk-matches`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Failed to get PKs:', error)
    return []
  }
}

/**
 * 获取最近的任务
 */
export const getRecentTasks = async (sinceDays = 7): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Failed to get tasks:', error)
    return []
  }
}

/**
 * 订阅学生变化
 */
export const subscribeToStudentChanges = (callback: (students: Student[]) => void) => {
  return subscribe('student:updated', (payload) => {
    // 如果是数组，则是全量更新
    if (Array.isArray(payload)) {
      cachedData.students = payload
    } else {
      // 单个学生更新
      const index = cachedData.students.findIndex(s => s.id === payload.id)
      if (index >= 0) {
        cachedData.students[index] = payload
      } else {
        cachedData.students.push(payload)
      }
    }
    callback(cachedData.students)
  })
}

/**
 * 订阅学生创建
 */
export const subscribeToStudentCreate = (callback: (student: Student) => void) => {
  return subscribe('student:created', (payload) => {
    cachedData.students.push(payload)
    callback(payload)
  })
}

/**
 * 订阅挑战变化
 */
export const subscribeToChallengeChanges = (callback: (challenges: Challenge[]) => void) => {
  return subscribe('challenge:updated', (payload) => {
    if (Array.isArray(payload)) {
      cachedData.challenges = payload
    } else {
      const index = cachedData.challenges.findIndex(c => c.id === payload.id)
      if (index >= 0) {
        cachedData.challenges[index] = payload
      } else {
        cachedData.challenges.push(payload)
      }
    }
    callback(cachedData.challenges)
  })
}

/**
 * 订阅 PK 变化
 */
export const subscribeToPKChanges = (callback: (pks: any[]) => void) => {
  return subscribe('pk:finished', (payload) => {
    callback(Array.isArray(payload) ? payload : [payload])
  })
}

/**
 * 订阅任务完成
 */
export const subscribeToTaskChanges = (callback: (tasks: any[]) => void) => {
  return subscribe('task:completed', (payload) => {
    callback(Array.isArray(payload) ? payload : [payload])
  })
}

/**
 * 初始化 WebSocket
 */
export const initializeWebSocket = async (token?: string) => {
  try {
    console.log('🔗 正在初始化 WebSocket...')
    await connectWebSocket()
    console.log('✅ WebSocket 初始化成功')
  } catch (error) {
    console.error('❌ WebSocket 初始化失败:', error)
    throw error
  }
}

/**
 * 断开 WebSocket
 */
export const disconnectWebSocket = () => {
  disconnect()
}

/**
 * 检查 WebSocket 连接状态
 */
export const checkConnectionStatus = () => {
  return isConnected()
}

export type { PKMatch } from './websocket'
export type { StudentTask } from './websocket'
