/**
 * API 服务层 - 连接到后端服务器
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// 请求拦截器
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
};

/**
 * 学生管理 API
 */
export const studentAPI = {
  // 创建学生
  async createStudent(data: { name: string; className?: string; teamId?: string }) {
    return fetchWithAuth(`${API_BASE_URL}/students`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 获取所有学生
  async getAllStudents(sort?: string, order?: string) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (order) params.append('order', order);
    return fetchWithAuth(`${API_BASE_URL}/students?${params.toString()}`);
  },

  // 获取单个学生
  async getStudent(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`);
  },

  // 更新学生
  async updateStudent(studentId: string, data: any) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 删除学生
  async deleteStudent(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
  },

  // 调整分数
  async adjustScore(studentId: string, delta: number) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}/adjust-score`, {
      method: 'POST',
      body: JSON.stringify({ delta })
    });
  }
};

/**
 * 积分 API
 */
export const scoreAPI = {
  // 添加积分 (多学生)
  async addScore(studentIds: string[], points: number, reason: string, exp?: number) {
    return fetchWithAuth(`${API_BASE_URL}/students/scores/add`, {
      method: 'POST',
      body: JSON.stringify({
        studentIds,
        points,
        exp,
        reason,
        category: 'manual'
      })
    });
  },

  // 获取积分历史
  async getScoreHistory(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/scores/history/${studentId}`);
  }
};

/**
 * 挑战 API
 */
export const challengeAPI = {
  async createChallenge(data: any) {
    return fetchWithAuth(`${API_BASE_URL}/challenges`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAllChallenges() {
    return fetchWithAuth(`${API_BASE_URL}/challenges`);
  },

  async updateChallengeStatus(challengeId: string, result: 'success' | 'fail') {
    return fetchWithAuth(`${API_BASE_URL}/challenges/${challengeId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ result })
    });
  }
};

/**
 * PK 比赛 API
 */
export const pkAPI = {
  async createPK(data: any) {
    return fetchWithAuth(`${API_BASE_URL}/pk-matches`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAllPKs() {
    return fetchWithAuth(`${API_BASE_URL}/pk-matches`);
  },

  async submitPKResult(pkId: string, winnerId: string) {
    return fetchWithAuth(`${API_BASE_URL}/pk-matches/${pkId}/result`, {
      method: 'PUT',
      body: JSON.stringify({ winnerId })
    });
  }
};

/**
 * 任务 API
 */
export const taskAPI = {
  async createTask(data: any) {
    return fetchWithAuth(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAllTasks() {
    return fetchWithAuth(`${API_BASE_URL}/tasks`);
  },

  async completeTask(taskId: string) {
    return fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }
};

/**
 * 勋章 API
 */
export const badgeAPI = {
  async getAllBadges() {
    return fetchWithAuth(`${API_BASE_URL}/badges`);
  },

  async awardBadge(studentId: string, badgeId: string) {
    return fetchWithAuth(`${API_BASE_URL}/students/${studentId}/badges`, {
      method: 'POST',
      body: JSON.stringify({ badgeId })
    });
  }
};

/**
 * 习惯 API
 */
export const habitAPI = {
  async getAllHabits() {
    return fetchWithAuth(`${API_BASE_URL}/habits`);
  },

  async checkIn(studentId: string, habitId: string) {
    return fetchWithAuth(`${API_BASE_URL}/habits/${habitId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  },

  async getStats(studentId: string) {
    return fetchWithAuth(`${API_BASE_URL}/habits/stats/${studentId}`);
  }
};
