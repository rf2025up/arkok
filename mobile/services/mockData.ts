/**
 * Mock Data - 仅保留数据库中已有的真实数据的定义
 * 所有实际数据都应从 API 获取
 */

import { Badge, Habit } from "../types";

/**
 * 已弃用：MOCK_STUDENTS - 使用 API /students 替代
 * 已弃用：MOCK_TEAMS - 从学生班级数据动态生成
 * 已弃用：MOCK_CHALLENGES - 使用 API /challenges 替代
 * 已弃用：MOCK_TASKS - 使用 API /tasks 替代
 * 已弃用：MOCK_PK - 使用 API /pk-matches 替代
 */

/**
 * 徽章定义 - 对应数据库中的实际徽章
 * 注：建议从 API /badges 获取，此处仅为参考
 */
export const MOCK_BADGES: Badge[] = [
  { id: '1', name: '学霸之星', icon: '⭐', description: '本周学习表现最突出' },
  { id: '2', name: '挑战先锋', icon: '🛡️', description: '完成挑战最多的同学' },
  { id: '3', name: '阅读达人', icon: '📖', description: '阅读书籍超过5本' },
  { id: '4', name: '全勤奖', icon: '🏃', description: '本月无缺席' },
  { id: '5', name: '小画家', icon: '🎨', description: '美术课表现优异' },
  { id: '6', name: '小小科学家', icon: '💡', description: '科学实验动手能力强' },
];

/**
 * 习惯定义 - 对应数据库中的实际习惯 (ID 1-18)
 * 注：建议从 API /habits 获取，此处仅为参考
 */
export const MOCK_HABITS: Habit[] = [
  { id: '1', name: '早起', icon: '🌞' },
  { id: '2', name: '阅读', icon: '📖' },
  { id: '3', name: '运动', icon: '🏃' },
  { id: '4', name: '思考', icon: '💡' },
  { id: '5', name: '卫生', icon: '🧹' },
  { id: '6', name: '助人', icon: '🤝' },
  { id: '7', name: '作业', icon: '📝' },
  { id: '8', name: '整理', icon: '🧺' },
  { id: '9', name: '礼仪', icon: '🙏' },
  { id: '10', name: '守时', icon: '⏰' },
  { id: '11', name: '专注', icon: '🎯' },
  { id: '12', name: '饮水', icon: '💧' },
  { id: '13', name: '午休', icon: '😴' },
  { id: '14', name: '阅读笔记', icon: '📚' },
  { id: '15', name: '口语练习', icon: '🗣️' },
  { id: '16', name: '体育锻炼', icon: '⚽' },
  { id: '17', name: '音乐练习', icon: '🎵' },
  { id: '18', name: '科学实验', icon: '🔬' },
];