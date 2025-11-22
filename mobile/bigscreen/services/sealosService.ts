import { Team } from '../types'

const teams: Team[] = [
  { id: 't1', name: '超能英雄', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { id: 't2', name: '天才少年', color: 'bg-purple-500', textColor: 'text-purple-400' },
  { id: 't3', name: '学霸无敌', color: 'bg-red-500', textColor: 'text-red-400' },
]

export const getTeams = async (): Promise<Team[]> => teams