import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Team } from '../types'
import { PKMatch } from '../services/sealosService'

interface PKBoardCardProps {
  pks: PKMatch[]
  teamsMap: Map<string, Team>
  students?: any[]
}

const Stamp: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={`absolute right-2 top-2 px-2 py-0.5 text-xs font-black tracking-wider rounded-md opacity-85 rotate-12 ${className}`}>{text}</span>
)

const shortName = (n: string) => n.length > 4 ? n.slice(0,4) : n

const PKBoardCard: React.FC<PKBoardCardProps> = ({ pks, teamsMap, students = [] }) => {
  // Create a map of students for quick lookup
  const studentsMap = useMemo(() => {
    const map = new Map()
    students.forEach(s => map.set(String(s.id), s))
    return map
  }, [students])
  const containerRef = useRef<HTMLDivElement>(null)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [page, setPage] = useState(0)

  const pages = useMemo(() => {
    const arr: PKMatch[][] = []
    for (let i = 0; i < pks.length; i += itemsPerPage) arr.push(pks.slice(i, i + itemsPerPage))
    return arr.length > 0 ? arr : [[]]
  }, [pks, itemsPerPage])

  // 当pks改变时重置page
  useEffect(() => {
    setPage(0)
  }, [pks])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = el.clientHeight
      const itemH = 54
      const gap = 8
      const per = Math.max(3, Math.floor(h / (itemH + gap)))
      setItemsPerPage(per)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (pages.length <= 1) return
    const t = setInterval(() => setPage(p => {
      // 到达最后一页后停止，不再循环
      if (p >= pages.length - 1) return p
      return p + 1
    }), 3000) // 每页固定3秒
    return () => clearInterval(t)
  }, [pages.length])

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold text-center p-3 border-b border-slate-700/50">PK榜</h2>
      <div ref={containerRef} className="p-3 flex-grow min-h-0 overflow-hidden">
        {pks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">暂无 PK 数据</div>
        ) : (
          <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${page * 100}%)` }}>
            {pages.map((group, idx) => (
              <ul key={idx} className="w-full flex-shrink-0 h-full space-y-2">
                {group.map(item => {
                  const studentA = studentsMap.get(String(item.student_a))
                  const studentB = studentsMap.get(String(item.student_b))
                  const aTeam = teamsMap.get(item.student_a)
                  const bTeam = teamsMap.get(item.student_b)
                  const isFinished = item.status === 'finished'
                  const isDraw = isFinished && !item.winner_id
                  const isAWin = isFinished && item.winner_id === item.student_a
                  const isBWin = isFinished && item.winner_id === item.student_b
                  const nameA = studentA?.name || `学生${item.student_a}`
                  const nameB = studentB?.name || `学生${item.student_b}`
                  const avatarA = studentA?.avatar_url || `https://i.pravatar.cc/60?u=${item.student_a}`
                  const avatarB = studentB?.avatar_url || `https://i.pravatar.cc/60?u=${item.student_b}`

                  return (
                    <li key={item.id} className="relative p-2 rounded-lg border border-slate-700/50 bg-slate-800/30">
                      <div className="grid grid-cols-3 items-center">
                        <div className="flex items-center gap-2">
                          <img src={avatarA} className="w-8 h-8 rounded-full border border-slate-600" />
                          <span className={`text-sm font-semibold ${isAWin ? 'text-emerald-400' : isBWin ? 'text-red-400' : 'text-white'}`}>{shortName(nameA)}</span>
                          {isAWin && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/80 text-white rounded">胜</span>
                          )}
                          {isBWin && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/70 text-white rounded">负</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center flex-col">
                          {isDraw ? (
                            <span className="text-xs font-bold text-yellow-400">平局</span>
                          ) : !isFinished ? (
                            <span className="text-xs font-bold text-blue-400">PK中</span>
                          ) : (
                            <span className="text-xs text-slate-500">VS</span>
                          )}
                          <span className="mt-1 text-[11px] text-slate-400 truncate max-w-[140px]">{item.topic}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          {isBWin && (
                            <span className="mr-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/80 text-white rounded">胜</span>
                          )}
                          {isAWin && (
                            <span className="mr-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/70 text-white rounded">负</span>
                          )}
                          <span className={`text-sm font-semibold ${isBWin ? 'text-emerald-400' : isAWin ? 'text-red-400' : 'text-white'}`}>{shortName(nameB)}</span>
                          <img src={avatarB} className="w-8 h-8 rounded-full border border-slate-600" />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PKBoardCard