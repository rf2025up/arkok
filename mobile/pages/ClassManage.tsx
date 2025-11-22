import React, { useState } from 'react';
import { Plus, Trophy, Swords, Medal, X, CheckCircle, ScrollText, Edit2, UserPlus, Trash2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Challenge, PKMatch, Badge, Task, ScoreCategory, PointPreset } from '../types';
import { MOCK_HABITS, MOCK_TEAMS } from '../services/mockData';
import { BADGE_ICONS } from '../constants';
import StudentNameEditor from '../components/StudentNameEditor';

interface ClassManageProps {
  students: Student[];
  challenges: Challenge[];
  tasks: Task[];
  pkMatches: PKMatch[];
  badges: Badge[];
  scorePresets: PointPreset[];
  categoryNames: Record<string, string>;
  onUpdateScorePresets: (presets: PointPreset[]) => void;
  onUpdateCategoryNames: (names: Record<string, string>) => void;

  // New Handlers
  onAddCategory: (name: string) => void;
  onChallengeStatus: (id: string, result: 'success' | 'fail') => void;
  onPKWinner: (id: string, winnerId: string) => void;
  onGrantBadge: (badgeId: string, studentId: string) => void;
  onAddBadge: (badge: Badge) => void;
  
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  setPkMatches: React.Dispatch<React.SetStateAction<PKMatch[]>>;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onCompleteTask: (id: string) => void;
  setBadges: React.Dispatch<React.SetStateAction<Badge[]>>;
  classes: string[];
  identity?: 'teacher'|'principal';
  teacherClass?: string;
  setTeacherClass?: (c: string) => void;
}

const ClassManage: React.FC<ClassManageProps> = ({ 
  students, challenges, tasks, pkMatches, badges,
  scorePresets, categoryNames, 
  onUpdateScorePresets, onUpdateCategoryNames,
  onAddCategory, onChallengeStatus, onPKWinner, onGrantBadge, onAddBadge,
  setChallenges, setPkMatches, setStudents, setTasks, onCompleteTask, setBadges, classes, identity='teacher', teacherClass, setTeacherClass
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'score' | 'task' | 'challenge' | 'pk' | 'badges'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // -- Modals --
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditScoreOpen, setIsEditScoreOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  
  // -- Editing State --
  const [editingScoreItem, setEditingScoreItem] = useState<PointPreset | null>(null);
  const [editingCategoryTarget, setEditingCategoryTarget] = useState<string>('');
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  // -- Inline Form State for Score --
  const [newScoreForm, setNewScoreForm] = useState({
      category: '',
      label: '',
      value: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedScoreCategory, setSelectedScoreCategory] = useState<string>('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(-1);
  const [presetEditLabel, setPresetEditLabel] = useState('');
  const [presetEditValue, setPresetEditValue] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('');

  // -- Inline Form State for Challenge --
  const [newChallenge, setNewChallenge] = useState({ title: '', desc: '', participantIds: [] as string[], rewardPoints: '', rewardExp: '' });

  // -- Inline Form State for PK --
  const [newPK, setNewPK] = useState({ studentA: '', studentB: '', topic: '' });

  // -- Form State for Grant Badge (supports multi-select)
  const [grantBadgeForm, setGrantBadgeForm] = useState({ badgeId: '', studentIds: [] as string[] });
  const [badgeAssigneeSelectId, setBadgeAssigneeSelectId] = useState('');

  // -- Form State for New Badge --
  const [newBadgeForm, setNewBadgeForm] = useState({ name: '', desc: '' });
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('三年二班');
  const [newTaskForm, setNewTaskForm] = useState({ title: '', desc: '', expValue: '', assignees: [] as string[] });
  const [challengeSelectId, setChallengeSelectId] = useState('');
  const [taskAssigneeSelectId, setTaskAssigneeSelectId] = useState('');
  const [editBadgeId, setEditBadgeId] = useState('');
  const [editBadgeName, setEditBadgeName] = useState('');
  const [teams, setTeams] = useState<Array<{id: string, name: string}>>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [selectedAssignTeamId, setSelectedAssignTeamId] = useState('');
  const [selectedAssignStudentId, setSelectedAssignStudentId] = useState('');
  const [newStudentTeamId, setNewStudentTeamId] = useState('');
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showAllForAssign, setShowAllForAssign] = useState(false);
  const [isBulkSelect, setIsBulkSelect] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [habitPage, setHabitPage] = useState(0);
  const [badgePage, setBadgePage] = useState(0);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pkRewardForm, setPkRewardForm] = useState<Record<string, { points: string; exp: string }>>({});
  const [challengeHistoryTab, setChallengeHistoryTab] = useState<'current' | 'past'>('current');
  const teamPressTimerRef = React.useRef<number | null>(null);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // -- Logic for Detail Modal --
  const getStudentChallenges = (studentId: string) => {
      return challenges.filter(c => c.participants.includes(studentId));
  };

  const getStudentPKHistory = (studentId: string) => {
      return pkMatches.filter(pk => (pk.studentA === studentId || pk.studentB === studentId) && pk.status === 'finished');
  };

  const visibleStudents = identity==='principal' 
    ? students 
    : (showAllForAssign ? students : students.filter(s => s.className === (teacherClass || classes[0] || '')));

  const handleSelectStudentClass = (studentId: string, className: string) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, className } : s));
      setSelectedStudent(prev => prev ? { ...(prev as Student), className } : prev);
      setShowClassPicker(false);
  };

  const expForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.25, Math.max(0, lvl-1)));
  const getLevelProgressInfo = (totalExp: number, lvl: number) => {
      let acc = 0;
      for (let i = 1; i < lvl; i++) acc += expForLevel(i);
      const need = expForLevel(lvl);
      const cur = Math.max(0, totalExp - acc);
      const pct = need > 0 ? Math.min(100, Math.floor(cur * 100 / need)) : 0;
      return { cur, need, pct };
  };

  const chunk = <T,>(arr: T[], size: number) => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
  };

  // 同步 selectedStudent 与 students 的更新（包括 habitStats）
  React.useEffect(() => {
    if (selectedStudent) {
      const updatedStudent = students.find(s => s.id === selectedStudent.id);
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }
    }
  }, [students]);

  const toggleBulkSelectId = (id: string) => {
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMoveToTeacherClass = (ids: string[]) => {
    if (!teacherClass || ids.length === 0) return;
    setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, className: teacherClass } : s));
    setBulkSelectedIds(new Set());
  };

  // -- Handlers --
  const handleSaveScoreItem = (newItem: PointPreset) => {
      if (editingScoreItem) {
          // Update existing
          onUpdateScorePresets(scorePresets.map(p => p === editingScoreItem ? newItem : p));
      }
      setIsEditScoreOpen(false);
      setEditingScoreItem(null);
  };

  const handleAddInlineScoreItem = () => {
      if (newScoreForm.label && newScoreForm.value) {
          const val = parseInt(newScoreForm.value);
          if (!isNaN(val)) {
              let catKey = selectedScoreCategory || newScoreForm.category;
              const inputCat = newPresetCategory.trim();
              if (inputCat) {
                  const existing = Object.entries(categoryNames).find(([, v]) => v === inputCat);
                  if (existing) {
                      catKey = existing[0];
                  } else {
                      const newKey = `CAT_${Date.now()}`;
                      const newNames = { ...categoryNames, [newKey]: inputCat };
                      onUpdateCategoryNames(newNames);
                      catKey = newKey;
                      setSelectedScoreCategory(newKey);
                  }
              }
              onUpdateScorePresets([...scorePresets, {
                  label: newScoreForm.label,
                  value: val,
                  category: catKey
              }]);
              setNewScoreForm({ ...newScoreForm, label: '', value: '' });
              setNewPresetCategory('');
          }
      }
  };

  const handleCreateNewCategory = () => {
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setNewCategoryName('');
      }
  };

  const handleSaveCategoryName = () => {
      if (editingCategoryTarget && editingCategoryNewName.trim()) {
          onUpdateCategoryNames({
              ...categoryNames,
              [editingCategoryTarget]: editingCategoryNewName
          });
          setIsEditCategoryOpen(false);
      }
  };

  const openCategoryEdit = (originalKey: string) => {
      setEditingCategoryTarget(originalKey);
      setEditingCategoryNewName(categoryNames[originalKey] || originalKey);
      setIsEditCategoryOpen(true);
  };

  React.useEffect(() => {
      const keys = Object.keys(categoryNames);
      if (keys.length && !selectedScoreCategory) {
          setSelectedScoreCategory(keys[0]);
      }
  }, [categoryNames]);

  React.useEffect(() => {
      const presets = scorePresets.filter(p => p.category === selectedScoreCategory);
      if (presets.length) {
          const idx = selectedPresetIndex >= 0 && selectedPresetIndex < presets.length ? selectedPresetIndex : 0;
          setSelectedPresetIndex(idx);
          setPresetEditLabel(presets[idx].label);
          setPresetEditValue(String(presets[idx].value));
      } else {
          setSelectedPresetIndex(-1);
          setPresetEditLabel('');
          setPresetEditValue('');
      }
  }, [selectedScoreCategory, scorePresets]);

  const handleSavePresetEdit = () => {
      if (selectedScoreCategory === '' || selectedPresetIndex < 0) return;
      const presets = scorePresets.filter(p => p.category === selectedScoreCategory);
      if (!presets.length) return;
      const target = presets[selectedPresetIndex];
      const globalIndex = scorePresets.findIndex((p, i) => {
          if (p.category !== selectedScoreCategory) return false;
          let c = -1;
          for (let j = 0; j <= i; j++) {
              if (scorePresets[j].category === selectedScoreCategory) c++;
          }
          return c === selectedPresetIndex;
      });
      if (globalIndex < 0) return;
      const val = parseInt(presetEditValue);
      if (isNaN(val)) return;
      const next = [...scorePresets];
      next[globalIndex] = { ...next[globalIndex], label: presetEditLabel, value: val };
      onUpdateScorePresets(next);
  };

  const handleDeletePreset = (presetLabel: string) => {
      const filtered = scorePresets.filter(p => p.label !== presetLabel);
      onUpdateScorePresets(filtered);
      setSelectedPresetIndex(-1);
  };

  const handlePublishChallenge = async () => {
      if(newChallenge.title && newChallenge.desc) {
          const pts = parseInt(String((newChallenge as any).rewardPoints));
          const exp = parseInt(String((newChallenge as any).rewardExp));

          try {
              const protocol = window.location.protocol;
              const host = window.location.host;
              const apiUrl = `${protocol}//${host}/api`;

              const response = await fetch(`${apiUrl}/challenges`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      title: newChallenge.title,
                      description: newChallenge.desc,
                      status: 'active',
                      reward_points: isNaN(pts) ? 10 : pts,
                      reward_exp: isNaN(exp) ? 0 : exp
                  })
              });

              if (!response.ok) {
                  console.error('Failed to publish challenge:', response.statusText);
                  return;
              }

              const data = await response.json();
              if (data.success && data.data) {
                  // Add to frontend state using API response
                  setChallenges(prev => [...prev, {
                      id: String(data.data.id),
                      title: data.data.title,
                      desc: data.data.description,
                      status: data.data.status,
                      participants: (newChallenge.participantIds && newChallenge.participantIds.length>0) ? newChallenge.participantIds : [],
                      rewardPoints: data.data.reward_points,
                      rewardExp: data.data.reward_exp,
                      date: new Date().toISOString()
                  }]);
              }
          } catch (error) {
              console.error('Error publishing challenge:', error);
          }

          setNewChallenge({ title: '', desc: '', participantIds: [], rewardPoints: '', rewardExp: '' } as any);
      }
  };

  const handlePublishTask = async () => {
      if (newTaskForm.title && newTaskForm.expValue) {
          const exp = parseInt(String(newTaskForm.expValue));
          if (!isNaN(exp)) {
              try {
                  const protocol = window.location.protocol;
                  const host = window.location.host;
                  const apiUrl = `${protocol}//${host}/api`;

                  const response = await fetch(`${apiUrl}/tasks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          title: newTaskForm.title,
                          description: newTaskForm.desc,
                          exp_value: exp
                      })
                  });

                  if (!response.ok) {
                      console.error('Failed to publish task:', response.statusText);
                      return;
                  }

                  const data = await response.json();
                  if (data.success && data.data) {
                      const task: Task = {
                          id: String(data.data.id),
                          title: data.data.title,
                          desc: data.data.description,
                          expValue: data.data.exp_value,
                          createdAt: new Date().toISOString(),
                          assignedTo: newTaskForm.assignees
                      };
                      setTasks(prev => [task, ...prev]);
                  }
              } catch (error) {
                  console.error('Error publishing task:', error);
              }

              setNewTaskForm({ title: '', desc: '', expValue: '', assignees: [] });
          }
      }
  };

  const handleAddChallengeParticipant = () => {
      if (challengeSelectId) {
          const id = challengeSelectId;
          if (!(newChallenge.participantIds as string[]).includes(id)) {
              setNewChallenge({ ...(newChallenge as any), participantIds: [ ...(newChallenge.participantIds as string[]), id ] } as any);
          }
          setChallengeSelectId('');
      }
  };

  const handleRemoveChallengeParticipant = (id: string) => {
      setNewChallenge({ ...(newChallenge as any), participantIds: (newChallenge.participantIds as string[]).filter(x=>x!==id) } as any);
  };

  const handleAddTaskAssignee = () => {
      if (taskAssigneeSelectId) {
          const id = taskAssigneeSelectId;
          if (!newTaskForm.assignees.includes(id)) {
              setNewTaskForm({ ...newTaskForm, assignees: [ ...newTaskForm.assignees, id ] });
          }
          setTaskAssigneeSelectId('');
      }
  };

  const handleRemoveTaskAssignee = (id: string) => {
      setNewTaskForm({ ...newTaskForm, assignees: newTaskForm.assignees.filter(x=>x!==id) });
  };

  const handleCreatePK = async () => {
      if(newPK.studentA && newPK.studentB && newPK.topic) {
          try {
              const protocol = window.location.protocol;
              const host = window.location.host;
              const apiUrl = `${protocol}//${host}/api`;

              const response = await fetch(`${apiUrl}/pk-matches`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      student_a: newPK.studentA,
                      student_b: newPK.studentB,
                      topic: newPK.topic,
                      status: 'pending'
                  })
              });

              if (!response.ok) {
                  console.error('Failed to create PK match:', response.statusText);
                  return;
              }

              const data = await response.json();
              if (data.success && data.data) {
                  setPkMatches(prev => [...prev, {
                      id: String(data.data.id),
                      studentA: data.data.student_a,
                      studentB: data.data.student_b,
                      topic: data.data.topic,
                      status: data.data.status
                  }]);
              }
          } catch (error) {
              console.error('Error creating PK match:', error);
          }

          setNewPK({ studentA: '', studentB: '', topic: '' });
      }
  };

  const handlePKDraw = async (pkId: string) => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          const response = await fetch(`${apiUrl}/pk-matches/${pkId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  status: 'finished',
                  winner_id: null
              })
          });

          if (!response.ok) {
              console.error('Failed to mark PK as draw:', response.statusText);
              return;
          }

          // Mark PK as finished with draw result
          setPkMatches(prev => prev.map(pk =>
            pk.id === pkId ? { ...pk, status: 'finished', result: 'draw' } : pk
          ));
          // Deduct 50 points and add 200 exp to both students
          const pk = pkMatches.find(p => p.id === pkId);
          if (pk) {
              setStudents(prev => prev.map(s => {
                  if (s.id === pk.studentA || s.id === pk.studentB) {
                      return { ...s, points: Math.max(0, s.points - 50), exp: (s.exp || 0) + 200 };
                  }
                  return s;
              }));
          }
      } catch (error) {
          console.error('Error marking PK as draw:', error);
      }
  };

  const handlePKWinnerWithReward = async (pkId: string, winnerId: string, losererId: string) => {
      try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api`;

          const reward = pkRewardForm[pkId] || { points: '0', exp: '0' };
          const rewardPoints = parseInt(reward.points) || 0;
          const rewardExp = parseInt(reward.exp) || 0;

          const response = await fetch(`${apiUrl}/pk-matches/${pkId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  status: 'finished',
                  winner_id: winnerId
              })
          });

          if (!response.ok) {
              console.error('Failed to update PK match:', response.statusText);
              return;
          }

          // Mark PK as finished
          setPkMatches(prev => prev.map(pk =>
            pk.id === pkId ? { ...pk, status: 'finished', winnerId, result: 'win' } : pk
          ));

          // Update student scores and exp
          setStudents(prev => prev.map(s => {
              if (s.id === winnerId) {
                  // Winner: deduct 50, add reward + 200
                  return {
                      ...s,
                      points: Math.max(0, s.points - 50 + rewardPoints),
                      exp: (s.exp || 0) + 200 + rewardExp
                  };
              }
              if (s.id === losererId) {
                  // Loser: deduct 50 points, add 200 exp
                  return {
                      ...s,
                      points: Math.max(0, s.points - 50),
                      exp: (s.exp || 0) + 200
                  };
              }
              return s;
          }));

          // Clear reward form
          setPkRewardForm(prev => {
              const newForm = { ...prev };
              delete newForm[pkId];
              return newForm;
          });
      } catch (error) {
          console.error('Error updating PK winner:', error);
      }
  };

  const handleGrantBadgeSubmit = () => {
      if(grantBadgeForm.badgeId && grantBadgeForm.studentIds.length) {
          grantBadgeForm.studentIds.forEach(id => onGrantBadge(grantBadgeForm.badgeId, id));
          setGrantBadgeForm({ badgeId: '', studentIds: [] });
      }
  };

  const handleAddBadgeAssignee = () => {
      if (badgeAssigneeSelectId) {
          const id = badgeAssigneeSelectId;
          if (!(grantBadgeForm.studentIds as string[]).includes(id)) {
              setGrantBadgeForm({ ...grantBadgeForm, studentIds: [ ...(grantBadgeForm.studentIds as string[]), id ] });
          }
          setBadgeAssigneeSelectId('');
      }
  };

  const handleRemoveBadgeAssignee = (id: string) => {
      setGrantBadgeForm({ ...grantBadgeForm, studentIds: (grantBadgeForm.studentIds as string[]).filter(x=>x!==id) });
  };

  const handleCreateBadge = async () => {
      if (newBadgeForm.name) {
          try {
              const protocol = window.location.protocol;
              const host = window.location.host;
              const apiUrl = `${protocol}//${host}/api`;

              const icon = BADGE_ICONS[Math.floor(Math.random() * BADGE_ICONS.length)];

              // Note: The API doesn't have a badge creation endpoint yet
              // For now, we'll create it locally
              // TODO: Add POST /api/badges endpoint to backend when needed

              onAddBadge({
                  id: `b-${Date.now()}`,
                  name: newBadgeForm.name,
                  description: newBadgeForm.desc || '表现优异',
                  icon: icon
              });
              setNewBadgeForm({ name: '', desc: '' });
          } catch (error) {
              console.error('Error creating badge:', error);
          }
      }
  }

  const handleSaveBadgeRename = () => {
      if (editBadgeId && editBadgeName.trim()) {
          setBadges(prev => prev.map(b => b.id === editBadgeId ? { ...b, name: editBadgeName } : b));
          setEditBadgeId('');
          setEditBadgeName('');
      }
  };

  const handleTeamCapsulePressStart = (teamId: string, teamName: string) => {
      if (teamPressTimerRef.current) window.clearTimeout(teamPressTimerRef.current);
      teamPressTimerRef.current = window.setTimeout(() => {
          setEditTeamId(teamId);
          setEditTeamName(teamName);
      }, 600);
  };

  const handleTeamCapsulePressEnd = () => {
      if (teamPressTimerRef.current) {
          window.clearTimeout(teamPressTimerRef.current);
          teamPressTimerRef.current = null;
      }
  };

  const handleSelectStudentTeam = (studentId: string, teamId: string) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, teamId } : s));
      setSelectedStudent(prev => prev ? { ...(prev as Student), teamId } : prev);
      setShowTeamPicker(false);
  };

  const handleAddTeam = () => {
      if (newTeamName.trim()) {
          setTeams(prev => [...prev, { id: `team-${Date.now()}`, name: newTeamName.trim() }]);
          setNewTeamName('');
      }
  };

  const handleSaveTeamName = () => {
      if (editTeamId && editTeamName.trim()) {
          setTeams(prev => prev.map(t => t.id === editTeamId ? { ...t, name: editTeamName.trim() } : t));
          setEditTeamId('');
          setEditTeamName('');
      }
  };

  const handleAssignStudentToTeam = () => {
      if (selectedAssignTeamId && selectedAssignStudentId) {
          setStudents(prev => prev.map(s => s.id === selectedAssignStudentId ? { ...s, teamId: selectedAssignTeamId } : s));
          setSelectedAssignTeamId('');
          setSelectedAssignStudentId('');
      }
  };

  const [exportPeriod, setExportPeriod] = useState<'week'|'month'|'term'>('week');
  const [exportPickerOpen, setExportPickerOpen] = useState(false);
  const toDateStr = (iso: string) => { try { const d = new Date(iso); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; } catch { return iso; } };
  const getCurrentTermRange = () => {
      const now = new Date();
      const y = now.getFullYear();
      const springStart = new Date(y, 1, 15);
      const springEnd = new Date(y, 6, 20);
      const autumnStart = new Date(y, 7, 30);
      const autumnEnd = new Date(y + 1, 1, 10);
      if (now >= springStart && now <= springEnd) return { start: springStart, end: springEnd, label: '春季学期' };
      if (now >= autumnStart) return { start: autumnStart, end: autumnEnd, label: '秋季学期' };
      // Jan - before Feb 15: previous autumn to Feb 10
      const prevAutumnStart = new Date(y - 1, 7, 30);
      const prevAutumnEnd = new Date(y, 1, 10);
      return { start: prevAutumnStart, end: prevAutumnEnd, label: '秋季学期' };
  };
  const getRange = (p: 'week'|'month'|'term') => {
      const now = new Date();
      if (p === 'week') return { start: new Date(now.getTime() - 7*24*60*60*1000), end: now, label: '本周' };
      if (p === 'month') return { start: new Date(now.getTime() - 30*24*60*60*1000), end: now, label: '本月' };
      const t = getCurrentTermRange(); return { start: t.start, end: t.end, label: t.label };
  };
  const inRange = (iso?: string) => { if(!iso) return true; const d = new Date(iso); const { start, end } = getRange(exportPeriod); return d >= start && d <= end; };
  const handleExportStudentXlsx = (student: Student) => {
      const range = getRange(exportPeriod);
      const infoRows = [['字段','值'], ['姓名', student.name], ['班级', student.className], ['积分', String(student.points)], ['经验', String(student.exp)], ['战队', teams.find(t=>t.id===student.teamId)?.name || '未分队'], ['时间维度', range.label]];
      const badgeRows = [['荣誉名称','授予日期'], ...((student.badgeHistory||[]).filter(b=>inRange(b.date)).map(b=>[b.name, toDateStr(b.date)]))];
      const taskRows = [['任务名称','参与日期','完成','经验值'], ...((student.taskHistory||[]).filter(r=>inRange(r.date)).map(r=>[r.title, toDateStr(r.date), '是', String(r.exp||0)]))];
      const challengeRows = [['挑战名称','挑战日期','结果'], ...((student.challengeHistory||[]).filter(c=>inRange(c.date)).map(c=>[c.title, c.date?toDateStr(c.date):'', c.result||'']))];
      const pkRows = [['对手','主题','结果','日期'], ...((student.pkHistory||[]).filter(p=>inRange(p.date)).map(p=>[p.opponentName||p.opponentId, p.topic, p.result, toDateStr(p.date)]))];
      const habitRows = [['习惯名称','打卡天数'], ...(MOCK_HABITS.map(h=>[h.name, String(student.habitStats?.[h.id]||0)]))];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoRows), '个人信息');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(badgeRows), '荣誉数据');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskRows), '任务数据');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(challengeRows), '挑战数据');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pkRows), 'PK数据');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(habitRows), '习惯打卡');
      XLSX.writeFile(wb, `${student.name}-综合记录.xlsx`);
  };
  const handleExportStudentFull = (student: Student) => {
      const range = getRange(exportPeriod);
      const infoRows = [['姓名', student.name], ['班级', student.className], ['积分', String(student.points)], ['经验', String(student.exp)], ['战队', teams.find(t=>t.id===student.teamId)?.name || '未分队'], ['时间维度', range.label]];
      const badgeRows = (student.badgeHistory||[]).filter(b=>inRange(b.date)).map(b=>[b.name, toDateStr(b.date)]);
      const taskRows = (student.taskHistory||[]).filter(r=>inRange(r.date)).map(r=>[r.title, toDateStr(r.date), '是', String(r.exp||0)]);
      const challengeRows = (student.challengeHistory||[]).filter(c=>inRange(c.date)).map(c=>[c.title, c.date?toDateStr(c.date):'', c.result||'']);
      const pkRows = (student.pkHistory||[]).filter(p=>inRange(p.date)).map(p=>[p.opponentName||p.opponentId, p.topic, p.result, toDateStr(p.date)]);
      const habitRows = MOCK_HABITS.map(h=>[h.name, String(student.habitStats?.[h.id]||0)]);
      const esc = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const table = (title: string, headers: string[], rows: string[][]) => `
        <h3 style="font-weight:bold;">${esc(title)}</h3>
        <table border="1" cellspacing="0" cellpadding="4">
          <thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <br/>
      `;
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8" /></head>
        <body>
          ${table('个人信息', ['字段','值'], infoRows)}
          ${table('荣誉数据', ['荣誉名称','授予日期'], badgeRows)}
          ${table('任务数据', ['任务名称','参与日期','完成','经验值'], taskRows)}
          ${table('挑战数据', ['挑战名称','挑战日期','结果'], challengeRows)}
          ${table('PK 数据', ['对手','主题','结果','日期'], pkRows)}
          ${table('习惯打卡数据', ['习惯名称','打卡天数'], habitRows)}
        </body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${student.name}-综合记录.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleCreateStudent = async () => {
    const name = newStudentName.trim();
    if (!name) return;
    const cls = newStudentClass.trim() || '未知';
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    try {
      // 获取 API 地址
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      // 调用后端 API 创建学生
      const response = await fetch(`${apiUrl}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          class_name: cls,
          avatar_url: avatar,
          score: 0,
          total_exp: 0,
          level: 1
        })
      });

      if (!response.ok) {
        console.error('Failed to create student:', response.statusText);
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // 使用数据库返回的学生数据更新前端状态
        const newStudent = {
          id: String(data.data.id),
          name: data.data.name,
          avatar: data.data.avatar_url || avatar,
          points: data.data.score || 0,
          exp: data.data.total_exp || 0,
          level: data.data.level || 1,
          className: data.data.class_name || cls,
          teamId: newStudentTeamId || undefined
        };
        setStudents(prev => [...prev, newStudent]);
        setIsAddStudentOpen(false);
        setNewStudentName('');
        setNewStudentClass('三年二班');
        setNewStudentTeamId('');
      } else {
        console.error('Invalid response from server:', data);
      }
    } catch (error) {
      console.error('Error creating student:', error);
    }
  }

  const handleSaveStudentName = async (newName: string) => {
    if (!editingStudent) throw new Error('No student selected');
    try {
      // Get API URL
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      // Call API to update student name
      const response = await fetch(`${apiUrl}/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error(`Failed to update student name: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Update local state with API response
        setStudents(prev =>
          prev.map(s =>
            s.id === editingStudent.id ? { ...s, name: data.data.name } : s
          )
        );
        // Update selected student display if they have the detail modal open
        setSelectedStudent(prev =>
          prev && prev.id === editingStudent.id ? { ...prev, name: data.data.name } : prev
        );
        setEditingStudent(null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('保存失败：', error);
      throw error;
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      const response = await fetch(`${apiUrl}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('Failed to delete student:', response.statusText);
        return;
      }

      // Remove from frontend state
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('删除学生失败：', error);
    }
  }


  // -- Renderers --

  const renderStudentDetailModal = () => {
    if (!selectedStudent) return null;

    const allChallenges = getStudentChallenges(selectedStudent.id);
    const thisWeekChallenges = allChallenges.filter(c => {
        const date = c.date ? new Date(c.date) : new Date();
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
    });
    
    const studentPKs = getStudentPKHistory(selectedStudent.id);
    const studentBadges = badges.slice(0, 3 + Math.floor(Math.random() * 3)); // Mock random badges

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 no-scrollbar flex flex-col">
                {/* Header */}
                <div className="h-28 bg-gradient-to-br from-primary to-orange-300 relative flex-shrink-0">
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-white rounded-t-[2.5rem]"></div>
                    <button 
                        onClick={() => setSelectedStudent(null)}
                        className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full hover:bg-black/30 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Profile Content */}
                <div className="px-8 -mt-20 pb-8 flex-1 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img src={selectedStudent.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-gray-100 object-cover" alt="" />
                            <div className="absolute bottom-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">Lv.{selectedStudent.level}</div>
                            
                        </div>
                        <div className="mt-3 flex items-center gap-2 group">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                            <button
                                onClick={() => setEditingStudent(selectedStudent)}
                                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-lg"
                            >
                                <Edit2 size={18} className="text-primary" />
                            </button>
                        </div>
                        <div className="flex items-stretch gap-3 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center bg-orange-50 px-4 py-1 rounded-xl border border-orange-100 h-[56px]">
                                    <span className="text-xs text-orange-400 font-bold uppercase">积分</span>
                                    <span className="text-lg font-black text-orange-600">{selectedStudent.points}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-blue-50 px-4 py-1 rounded-xl border border-blue-100 h-[56px]">
                                    <span className="text-xs text-blue-400 font-bold uppercase">经验</span>
                                    <span className="text-lg font-black text-blue-600">{selectedStudent.exp}</span>
                                </div>
                            </div>
                            <div className="relative flex-1 h-[56px]">
                                <div className="grid grid-rows-2 gap-1 h-full">
                                    <div onClick={()=>{ setShowTeamPicker(v=>!v); setShowClassPicker(false); }} className="px-4 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold whitespace-nowrap overflow-x-auto no-scrollbar inline-flex items-center cursor-pointer">
                                        {teams.find(t=>t.id===selectedStudent.teamId)?.name || '未分队'}
                                    </div>
                                    <div onClick={()=>{ setShowClassPicker(v=>!v); setShowTeamPicker(false); }} className="px-4 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold whitespace-nowrap overflow-x-auto no-scrollbar inline-flex items-center cursor-pointer">
                                        {selectedStudent.className || '未分班'}
                                    </div>
                                </div>
                                {showTeamPicker && (
                                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border p-2">
                                    <select value={selectedStudent.teamId || ''} onChange={e=>handleSelectStudentTeam(selectedStudent.id, e.target.value)} className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none">
                                      <option value="">未分队</option>
                                      {teams.map(t=> (<option key={t.id} value={t.id}>{t.name}</option>))}
                                    </select>
                                  </div>
                                )}
                                {showClassPicker && (
                                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border p-2">
                                    <select value={selectedStudent.className || ''} onChange={e=>handleSelectStudentClass(selectedStudent.id, e.target.value)} className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none">
                                      <option value="">未分班</option>
                                      {(classes || []).map(c=> (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                  </div>
                                )}
                            </div>
                        </div>
                        

                        {/* Badges - Stacking UI */}
                        <div className="w-full mt-8">
                             <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center">
                                    <Medal size={16} className="mr-2 text-yellow-500"/> 所获勋章
                                </h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{studentBadges.length} 枚</span>
                             </div>
                             {(() => {
                               const badgePages = chunk(studentBadges, 12);
                               const bp = Math.min(badgePage, Math.max(0, badgePages.length - 1));
                               const badgeItems = badgePages[bp] || [];
                               return (
                                 <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                   {badgeItems.length > 0 ? (
                                     <div className="grid grid-cols-3 gap-2">
                                       {badgeItems.map((b, i) => (
                                         <span key={`${b.id}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-bold">
                                           <span>⭐</span>
                                           <span>{b.name}</span>
                                         </span>
                                       ))}
                                     </div>
                                   ) : (
                                     <span className="text-xs text-gray-400">暂无勋章，继续加油！</span>
                                   )}
                                   <div className="mt-2 flex items-center justify-between">
                                     <button onClick={()=> setBadgePage(p => Math.max(0, p-1))} className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold">上一页</button>
                                     <span className="text-[10px] text-gray-500">{badgePages.length>0 ? bp+1 : 0}/{badgePages.length}</span>
                                     <button onClick={()=> setBadgePage(p => Math.min(badgePages.length-1, p+1))} className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold">下一页</button>
                                   </div>
                                 </div>
                               );
                             })()}
                        </div>

                         {/* Habits */}
                         <div className="w-full mt-6">
                             <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                                 <CheckCircle size={16} className="mr-2 text-blue-500"/> 习惯统计
                             </h3>
                             {(() => {
                               const pages = chunk((MOCK_HABITS || []), 9);
                               const page = Math.min(habitPage, Math.max(0, pages.length-1));
                               const pageItems = pages[page] || [];
                               return (
                                 <div>
                                   <div className="grid grid-cols-3 gap-2">
                                     {pageItems.map(h => (
                                       <div key={h.id} className="bg-white border border-blue-100 p-2 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[64px]">
                                         <span className="text-sm text-gray-800 font-bold mb-0.5">{h.name}</span>
                                         <span className="text-lg font-black text-blue-600">{selectedStudent.habitStats?.[h.id] || 0}</span>
                                       </div>
                                     ))}
                                   </div>
                                   <div className="mt-2 flex items-center justify-between">
                                     <button onClick={()=> setHabitPage(p => Math.max(0, p-1))} className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">上一页</button>
                                     <span className="text-[10px] text-gray-500">{pages.length>0 ? page+1 : 0}/{pages.length}</span>
                                     <button onClick={()=> setHabitPage(p => Math.min(pages.length-1, p+1))} className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">下一页</button>
                                   </div>
                                 </div>
                               );
                             })()}
                        </div>

                        {/* Challenge History */}
                        <div className="w-full mt-6">
                             <div className="flex justify-between items-center mb-3">
                                 <h3 className="text-sm font-bold text-gray-800 flex items-center">
                                     <Trophy size={16} className="mr-2 text-orange-500"/> 挑战记录
                                 </h3>
                             </div>
                             
                             <div className="space-y-2.5">
                                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">本周</h4>
                                {((thisWeekChallenges || []).length > 0) ? (thisWeekChallenges || []).map(c => (
                                     <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                                         <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${c.result === 'success' ? 'bg-green-500' : (c.result === 'fail' ? 'bg-red-500' : 'bg-yellow-500')}`}></div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-800">{c.title}</div>
                                                <div className="text-[10px] text-gray-400">{c.desc}</div>
                                            </div>
                                         </div>
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                             c.result === 'success' ? 'bg-green-50 text-green-600' : (c.result === 'fail' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600')
                                         }`}>
                                             {c.result === 'success' ? '+积分' : (c.result === 'fail' ? '失败' : '进行中')}
                                         </span>
                                     </div>
                                 )) : (
                                     <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 rounded-xl border border-dashed">本周无挑战记录</div>
                                 )}

                                 {/* Past Challenges Link/Section */}
                                 <div className="pt-2">
                                     <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">过往记录</h4>
                                     </div>
                                     {((allChallenges || []).length > (thisWeekChallenges || []).length) ? (
                                         <div className="space-y-2 opacity-70">
                                             {(allChallenges || []).filter(c => !((thisWeekChallenges || []).includes(c))).map(c => (
                                                 <div key={c.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                     <span className="text-xs text-gray-600">{c.title}</span>
                                                     <span className="text-[10px] text-gray-400">{c.result === 'success' ? '已完成' : '未完成'}</span>
                                                 </div>
                                             ))}
                                         </div>
                                     ) : (
                                         <div className="text-[10px] text-gray-400 text-center italic">暂无更多历史记录</div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        {/* PK History */}
                        <div className="w-full mt-6 mb-6">
                             <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                                 <Swords size={16} className="mr-2 text-red-500"/> PK 对决记录
                             </h3>
                             <div className="space-y-2.5">
                                {((studentPKs || []).length > 0) ? (studentPKs || []).map(pk => {
                                     const opponentId = pk.studentA === selectedStudent.id ? pk.studentB : pk.studentA;
                                     const opponent = students.find(s => s.id === opponentId);
                                     const isWinner = pk.winnerId === selectedStudent.id;
                                     
                                     return (
                                         <div key={pk.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                                             <div className="flex items-center space-x-3">
                                                 <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isWinner ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                                                     {isWinner ? '胜' : '败'}
                                                 </span>
                                                 <div className="flex flex-col">
                                                     <span className="text-xs font-bold text-gray-700">vs {opponent?.name || '未知'}</span>
                                                     <span className="text-[10px] text-gray-400">{pk.topic}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 }) : (
                                     <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 rounded-xl border border-dashed">暂无PK记录</div>
                                 )}
                             </div>
                        </div>

                        <div className="w-full mt-6 mb-6">
                             <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-sm font-bold text-gray-800 flex items-center">
                                     <ScrollText size={16} className="mr-2 text-green-600"/> 任务记录
                                 </h3>
                             </div>
                             <div className="space-y-2.5">
                                 {(selectedStudent.taskHistory && selectedStudent.taskHistory.length>0) ? (
                                     selectedStudent.taskHistory.map(rec => (
                                         <div key={rec.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold text-gray-800">{rec.title}</span>
                                                 <span className="text-[10px] text-gray-400">{new Date(rec.date).toLocaleDateString()}</span>
                                             </div>
                                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">经验 + {rec.exp}</span>
                                         </div>
                                     ))
                                 ) : (
                                     <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 rounded-xl border border-dashed">暂无任务记录</div>
                                 )}
                             </div>
                        </div>
                        <div className="w-full mt-4 mb-8 flex justify-center">
                          <button onClick={()=>setExportPickerOpen(true)} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold">导出表格</button>
                        </div>
                        {exportPickerOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                            <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-xl">
                              <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">选择导出时间维度</h3>
                              <div className="grid grid-cols-3 gap-2">
                                <button onClick={()=>{ setExportPeriod('week'); handleExportStudentXlsx(selectedStudent!); setExportPickerOpen(false); }} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">本周</button>
                                <button onClick={()=>{ setExportPeriod('month'); handleExportStudentXlsx(selectedStudent!); setExportPickerOpen(false); }} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">本月</button>
                                <button onClick={()=>{ setExportPeriod('term'); handleExportStudentXlsx(selectedStudent!); setExportPickerOpen(false); }} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">本学期</button>
                              </div>
                              <div className="mt-3">
                                <button onClick={()=>setExportPickerOpen(false)} className="w-full p-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">取消</button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const renderAddStudentModal = () => {
      if (!isAddStudentOpen) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-xl animate-in slide-in-from-bottom-5">
                <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">新增学生</h3>
                <div className="space-y-3">
                    <select value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary">
                      <option value="">选择学生</option>
                      {students.map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                    <select value={newStudentClass} onChange={e=>setNewStudentClass(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary">
                      <option value="">选择班级</option>
                      {classes.map(c=> (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <select value={newStudentTeamId} onChange={e=>setNewStudentTeamId(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none">
                      <option value="">选择战队</option>
                      {teams.map(t=> (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsAddStudentOpen(false)}
                        className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                      >取消</button>
                      <button
                        onClick={handleCreateStudent}
                        className="flex-1 p-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:brightness-105"
                      >确定</button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {renderAddStudentModal()}
      {renderStudentDetailModal()}

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">班级管理</h1>
          <div className="flex gap-2 items-center">
            {identity==='teacher' && (
              <>
                <button onClick={()=>setShowAllForAssign(v=>!v)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${showAllForAssign?'bg-primary text-white':'bg-primary/10 text-primary'}`}>{showAllForAssign?'全校':'本班'}</button>
                {showAllForAssign && (
                  <>
                    <button onClick={()=>setIsBulkSelect(v=>!v)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${isBulkSelect?'bg-white text-primary border-primary':'bg-white text-gray-700'}`}>{isBulkSelect?'退出多选':'多选'}</button>
                    <button onClick={()=>handleMoveToTeacherClass(Array.from(bulkSelectedIds))} disabled={!teacherClass || bulkSelectedIds.size===0} className={`px-3 py-1.5 rounded-full text-xs font-bold ${(!teacherClass || bulkSelectedIds.size===0)?'bg-gray-200 text-gray-500 cursor-not-allowed':'bg-primary text-white'}`}>移入</button>
                  </>
                )}
              </>
            )}
            {!(identity==='teacher' && showAllForAssign) && (
              <button onClick={() => setIsAddStudentOpen(true)} className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold flex items-center">
                <UserPlus size={16} className="mr-1" /> 新增学生
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 px-4">
          <div className="w-full overflow-x-auto whitespace-nowrap no-scrollbar">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
              <button onClick={() => setActiveTab('students')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='students'?'bg-primary text-white':'bg-white text-gray-700'}`}>学生</button>
              <button onClick={() => setActiveTab('score')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='score'?'bg-primary text-white':'bg-white text-gray-700'}`}>积分</button>
              <button onClick={() => setActiveTab('task')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='task'?'bg-primary text-white':'bg-white text-gray-700'}`}>任务</button>
              <button onClick={() => setActiveTab('challenge')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='challenge'?'bg-primary text-white':'bg-white text-gray-700'}`}>挑战</button>
              <button onClick={() => setActiveTab('pk')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='pk'?'bg-primary text-white':'bg-white text-gray-700'}`}>PK</button>
              <button onClick={() => setActiveTab('badges')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='badges'?'bg-primary text-white':'bg-white text-gray-700'}`}>勋章</button>
            </div>
          </div>
        </div>

        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {visibleStudents.map(s => {
                const selected = bulkSelectedIds.has(s.id);
                return (
                  <div key={s.id} className={`flex flex-col items-center p-2 rounded-xl ${selected?'bg-orange-50 ring-2 ring-primary':''} hover:bg-gray-50`}>
                    <button onClick={() => {
                      if (isBulkSelect) {
                        toggleBulkSelectId(s.id);
                      } else {
                        setSelectedStudent(s);
                      }
                    }} className="flex flex-col items-center w-full">
                      <img src={s.avatar} onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/><circle cx=%2232%22 cy=%2224%22 r=%2212%22 fill=%22%23cbd5e1%22/><rect x=%2216%22 y=%2240%22 width=%2232%22 height=%2216%22 rx=%228%22 fill=%22%23cbd5e1%22/></svg>'; }} alt={s.name} className={`w-14 h-14 rounded-full object-cover border-2 ${selected?'border-primary':'border-gray-100'} cursor-pointer hover:opacity-80 transition-opacity`} title="点击查看学生信息" />
                      <span className={`mt-2 text-xs font-bold ${selected?'text-primary':'text-gray-700'}`}>{s.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{s.points} 积分</span>
                    </button>

                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-center text-xs text-gray-500">{identity==='principal' ? '全校学生' : (teacherClass || classes[0] || '本班级')}：{visibleStudents.length} 位</div>
            <div className="fixed bottom-24 left-0 right-0 px-4 z-30">
              <div className="bg-white rounded-2xl shadow-lg p-3 border border-gray-100">
                <div className="mt-1 flex flex-wrap gap-2">
                  <button onMouseDown={()=>handleTeamCapsulePressStart('new','新增战队')} onMouseUp={handleTeamCapsulePressEnd} onMouseLeave={handleTeamCapsulePressEnd} onClick={()=>{setEditTeamId('new'); setEditTeamName('');}} className="px-2 py-1 rounded-full bg-primary text-white text-[10px]">+ 新增战队</button>
                  {teams.map(t => (
                    <span
                      key={t.id}
                      onMouseDown={()=>handleTeamCapsulePressStart(t.id, t.name)}
                      onMouseUp={handleTeamCapsulePressEnd}
                      onMouseLeave={handleTeamCapsulePressEnd}
                      className="px-2 py-1 rounded-full bg-primary text-white text-[10px] select-none"
                    >{t.name}</span>
                  ))}
                </div>
                {editTeamId !== '' && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input value={editTeamName} onChange={e=>setEditTeamName(e.target.value)} placeholder="战队名称" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                    <button onClick={()=>{ if(editTeamId==='new'){ if(editTeamName.trim()){ setTeams(prev=>[...prev,{id:`team-${Date.now()}`, name: editTeamName.trim()}]); setEditTeamId(''); setEditTeamName(''); } } else { handleSaveTeamName(); } }} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">保存</button>
                    <button onClick={()=>{ setEditTeamId(''); setEditTeamName(''); }} className="p-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold">取消</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="mb-3"><span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">积分大类管理</span></div>
              <div className="grid grid-cols-3 gap-3 items-center mt-2">
                <div className="col-span-2">
                  <select value={selectedScoreCategory} onChange={e=>setSelectedScoreCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none border">
                    {Object.keys(categoryNames).map(k => (
                      <option key={k} value={k}>{categoryNames[k]}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <button onClick={()=>openCategoryEdit(selectedScoreCategory)} className="w-full px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/30">重命名</button>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-3"><span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">积分预设</span></div>
                <div className="relative">
                  <button
                    onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600">
                      {scorePresets.filter(p=>p.category===selectedScoreCategory).length > 0 ? '选择积分预设' : '暂无预设'}
                    </span>
                    <span className={`text-xs transition-transform ${showPresetDropdown ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {showPresetDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-48 overflow-y-auto">
                      {scorePresets.filter(p=>p.category===selectedScoreCategory).map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => {
                            setSelectedPresetIndex(idx);
                            setShowPresetDropdown(false);
                          }}
                        >
                          <span className="text-sm text-gray-700 font-medium">{p.label}</span>
                          <span className="text-lg font-black text-red-600">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPresetIndex>=0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-primary/20">
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-600 mb-1">积分名称</label>
                      <input value={presetEditLabel} onChange={e=>setPresetEditLabel(e.target.value)} placeholder="项目名称" className="w-full p-2 rounded-lg bg-white text-sm outline-none border border-gray-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">积分值</label>
                        <input value={presetEditValue} onChange={e=>setPresetEditValue(e.target.value)} placeholder="分值" type="number" className="w-full p-2 rounded-lg bg-white text-sm outline-none border border-gray-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">经验值</label>
                        <input placeholder="经验值" type="number" className="w-full p-2 rounded-lg bg-white text-sm outline-none border border-gray-200" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={handleSavePresetEdit} className="col-span-2 p-2 rounded-lg bg-primary text-white text-sm font-bold hover:brightness-105 transition-all">保存修改</button>
                      <button onClick={() => handleDeletePreset(presetEditLabel)} className="p-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:brightness-105 transition-all">删除</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isEditCategoryOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                <div className="bg-white w-full max-w-xs rounded-2xl p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">编辑类别名称</h3>
                  <input value={editingCategoryNewName} onChange={e=>setEditingCategoryNewName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" />
                  <div className="flex gap-3 pt-3">
                    <button onClick={()=>setIsEditCategoryOpen(false)} className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">取消</button>
                    <button onClick={handleSaveCategoryName} className="flex-1 p-2.5 rounded-xl bg-primary text-white text-sm font-medium">保存</button>
                  </div>
                </div>
              </div>
            )}

            <div className="fixed bottom-24 left-0 right-0 px-4 z-30">
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">积分大类名称（可选）</label>
                    <input value={newPresetCategory} onChange={e=>setNewPresetCategory(e.target.value)} placeholder="如：表现优异、积极参与..." className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">项目名称</label>
                      <input value={newScoreForm.label} onChange={e=>setNewScoreForm({...newScoreForm, label: e.target.value})} placeholder="如：主动发言" className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">分值</label>
                      <input value={newScoreForm.value} onChange={e=>setNewScoreForm({...newScoreForm, value: e.target.value})} placeholder="分值" type="number" className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddInlineScoreItem} className="flex-1 p-2 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-105">新增预设</button>
                  </div>
                  <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg">新增到：<span className="font-bold text-primary">{newPresetCategory.trim() || categoryNames[selectedScoreCategory] || selectedScoreCategory}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'task' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="mb-3"><span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">发布新任务</span></div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newTaskForm.title} onChange={e=>setNewTaskForm({...newTaskForm, title: e.target.value})} placeholder="任务名称" className="col-span-2 p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <input value={newTaskForm.desc} onChange={e=>setNewTaskForm({...newTaskForm, desc: e.target.value})} placeholder="任务说明..." className="col-span-2 p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <div className="col-span-2 flex items-center gap-2">
                  <select value={taskAssigneeSelectId} onChange={e=>setTaskAssigneeSelectId(e.target.value)} className="flex-1 p-2 rounded-xl bg-gray-50 text-sm outline-none">
                    <option value="">选择学生</option>
                    {visibleStudents.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <button onClick={handleAddTaskAssignee} className="px-3 py-2 rounded-xl bg-primary text-white text-[10px]">添加</button>
                </div>
                <div className="col-span-2 flex flex-wrap gap-2">
                  {newTaskForm.assignees.map(id => (
                    <button key={id} onClick={()=>handleRemoveTaskAssignee(id)} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px]">
                      {students.find(s=>s.id===id)?.name || id} ×
                    </button>
                  ))}
                </div>
                <input value={newTaskForm.expValue} onChange={e=>setNewTaskForm({...newTaskForm, expValue: e.target.value})} placeholder="经验奖励" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <button onClick={handlePublishTask} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">发布任务</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">进行中的任务</h3>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-800">{t.title}</div>
                      <div className="text-[10px] text-gray-500">{t.desc}</div>
                      {t.assignedTo && t.assignedTo.length>0 && (
                        <div className="mt-1 text-[10px] text-gray-600">{t.assignedTo.map(id=>students.find(s=>s.id===id)?.name || id).join('、')}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">经验 + {t.expValue}</span>
                      <button onClick={()=>onCompleteTask(t.id)} className="px-2 py-1 rounded-lg bg-primary text-white text-[10px]">完成</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenge' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">发布挑战</h3>
              <div className="grid grid-cols-2 gap-2">
                <input value={newChallenge.title} onChange={e=>setNewChallenge({...newChallenge, title: e.target.value})} placeholder="标题" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <div className="flex items-center gap-2">
                  <select value={challengeSelectId} onChange={e=>setChallengeSelectId(e.target.value)} className="flex-1 p-2 rounded-xl bg-gray-50 text-sm outline-none">
                    <option value="">选择学生</option>
                    {visibleStudents.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <button onClick={handleAddChallengeParticipant} className="px-3 py-2 rounded-xl bg-primary text-white text-[10px]">添加</button>
                </div>
                <div className="col-span-2 flex flex-wrap gap-2">
                  {(newChallenge.participantIds as string[]).map(id=> (
                    <button key={id} onClick={()=>handleRemoveChallengeParticipant(id)} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px]">
                      {students.find(s=>s.id===id)?.name || id} ×
                    </button>
                  ))}
                </div>
                <input value={newChallenge.desc} onChange={e=>setNewChallenge({...newChallenge, desc: e.target.value})} placeholder="描述" className="col-span-2 p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <input value={(newChallenge as any).rewardPoints} onChange={e=>setNewChallenge({...newChallenge, rewardPoints: e.target.value} as any)} placeholder="积分奖励" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <input value={(newChallenge as any).rewardExp} onChange={e=>setNewChallenge({...newChallenge, rewardExp: e.target.value} as any)} placeholder="经验值奖励" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <button onClick={handlePublishChallenge} className="col-span-2 p-2 rounded-xl bg-primary text-white text-sm font-bold">发布</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setChallengeHistoryTab('current')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold ${challengeHistoryTab === 'current' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  进行中
                </button>
                <button
                  onClick={() => setChallengeHistoryTab('past')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold ${challengeHistoryTab === 'past' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  过往挑战
                </button>
              </div>
              <div className="space-y-2">
                {challengeHistoryTab === 'current' ? (
                  challenges.filter(c => c.status === 'active').map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{c.title}</div>
                        <div className="text-[10px] text-gray-400">{c.desc}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{students.find(s=>s.id===c.participants[0])?.name || '未指定'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>onChallengeStatus(c.id,'success')} className="px-2 py-1 rounded-lg bg-primary text-white text-[10px]">成功</button>
                        <button onClick={()=>onChallengeStatus(c.id,'fail')} className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px]">失败</button>
                      </div>
                    </div>
                  ))
                ) : (
                  challenges.filter(c => c.status !== 'active').map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl opacity-75">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{c.title}</div>
                        <div className="text-[10px] text-gray-400">{c.desc}</div>
                        <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                          <span>{students.find(s=>s.id===c.participants[0])?.name || '未指定'}</span>
                          {c.date && <span>{new Date(c.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.result === 'success' ? '已完成' : '未完成'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pk' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">创建 PK</h3>
              <div className="grid grid-cols-2 gap-2">
                <select value={newPK.studentA} onChange={e=>setNewPK({...newPK, studentA: e.target.value})} className="p-2 rounded-xl bg-gray-50 text-sm outline-none">
                  <option value="">选择学生 A</option>
                  {visibleStudents.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <select value={newPK.studentB} onChange={e=>setNewPK({...newPK, studentB: e.target.value})} className="p-2 rounded-xl bg-gray-50 text-sm outline-none">
                  <option value="">选择学生 B</option>
                  {visibleStudents.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <input value={newPK.topic} onChange={e=>setNewPK({...newPK, topic: e.target.value})} placeholder="主题" className="col-span-2 p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <button onClick={handleCreatePK} className="col-span-2 p-2 rounded-xl bg-primary text-white text-sm font-bold">创建</button>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">PK 列表</h3>
              <div className="space-y-2">
                {pkMatches.filter(pk=>pk.status==='pending').map(pk => {
                  const nameA = students.find(s=>s.id===pk.studentA)?.name || pk.studentA;
                  const nameB = students.find(s=>s.id===pk.studentB)?.name || pk.studentB;
                  const losererId = pk.studentA === (pkRewardForm[pk.id]?.winnerId || '') ? pk.studentB : pk.studentA;
                  return (
                    <div key={pk.id} className="bg-gray-50 rounded-xl p-3 mb-3">
                      <div className="grid grid-cols-5 items-center gap-2 mb-2">
                        <button onClick={()=>handlePKWinnerWithReward(pk.id, pk.studentA, pk.studentB)} className="col-span-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold whitespace-nowrap hover:bg-primary/20">
                          {nameA}
                        </button>
                        <div className="col-span-3 text-center px-2">
                          <div className="text-sm font-bold text-gray-800 whitespace-normal break-words leading-5">{pk.topic}</div>
                        </div>
                        <button onClick={()=>handlePKWinnerWithReward(pk.id, pk.studentB, pk.studentA)} className="col-span-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold whitespace-nowrap hover:bg-primary/20">
                          {nameB}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={()=>handlePKDraw(pk.id)} className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold whitespace-nowrap border border-yellow-200">平</button>
                        <div className="col-span-2 flex gap-2">
                          <input
                            type="number"
                            placeholder="奖励积分"
                            value={pkRewardForm[pk.id]?.points || ''}
                            onChange={(e)=>setPkRewardForm(prev => ({
                              ...prev,
                              [pk.id]: { ...( prev[pk.id] || { points: '', exp: '' }), points: e.target.value }
                            }))}
                            className="flex-1 px-2 py-1 rounded-lg bg-white text-xs outline-none border border-gray-200"
                          />
                          <input
                            type="number"
                            placeholder="奖励经验"
                            value={pkRewardForm[pk.id]?.exp || ''}
                            onChange={(e)=>setPkRewardForm(prev => ({
                              ...prev,
                              [pk.id]: { ...(prev[pk.id] || { points: '', exp: '' }), exp: e.target.value }
                            }))}
                            className="flex-1 px-2 py-1 rounded-lg bg-white text-xs outline-none border border-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">新增勋章</h3>
              <div className="grid grid-cols-2 gap-2">
                <input value={newBadgeForm.name} onChange={e=>setNewBadgeForm({...newBadgeForm, name: e.target.value})} placeholder="名称" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <input value={newBadgeForm.desc} onChange={e=>setNewBadgeForm({...newBadgeForm, desc: e.target.value})} placeholder="描述" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <button onClick={handleCreateBadge} className="col-span-2 p-2 rounded-xl bg-primary text-white text-sm font-bold">创建勋章</button>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">授予勋章</h3>
              <div className="grid grid-cols-3 gap-2">
                <select value={grantBadgeForm.badgeId} onChange={e=>setGrantBadgeForm({...grantBadgeForm, badgeId: e.target.value})} className="p-2 rounded-xl bg-gray-50 text-sm outline-none">
                  <option value="">选择勋章</option>
                  {badges.map(b=> (<option key={b.id} value={b.id}>{b.icon} {b.name}</option>))}
                </select>
                <div className="col-span-2 flex items-center gap-2">
                  <select value={badgeAssigneeSelectId} onChange={e=>setBadgeAssigneeSelectId(e.target.value)} className="flex-1 p-2 rounded-xl bg-gray-50 text-sm outline-none">
                    <option value="">选择学生</option>
                    {visibleStudents.map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <button onClick={handleAddBadgeAssignee} className="px-3 py-2 rounded-xl bg-primary text-white text-[10px]">添加</button>
                </div>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {(grantBadgeForm.studentIds as string[]).map(id => (
                    <button key={id} onClick={()=>handleRemoveBadgeAssignee(id)} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px]">
                      {students.find(s=>s.id===id)?.name || id} ×
                    </button>
                  ))}
                </div>
                <div className="col-span-3">
                  <button onClick={handleGrantBadgeSubmit} className="w-full p-2 rounded-xl bg-primary text-white text-sm font-bold">批量授予</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">勋章库</h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((b)=> (
                  <div key={b.id} className="px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-700 border flex items-center gap-2">
                    <span className="text-lg">{b.icon}</span>
                    <span>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">勋章名称修改</h3>
              <div className="grid grid-cols-3 gap-2">
                <select value={editBadgeId} onChange={e=>setEditBadgeId(e.target.value)} className="p-2 rounded-xl bg-gray-50 text-sm outline-none">
                  <option value="">选择勋章</option>
                  {badges.map(b=> (<option key={b.id} value={b.id}>{b.icon} {b.name}</option>))}
                </select>
                <input value={editBadgeName} onChange={e=>setEditBadgeName(e.target.value)} placeholder="新名称" className="p-2 rounded-xl bg-gray-50 text-sm outline-none" />
                <button onClick={handleSaveBadgeRename} className="p-2 rounded-xl bg-primary text-white text-sm font-bold">保存</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">编辑类别名称</h3>
            <input value={editingCategoryNewName} onChange={e=>setEditingCategoryNewName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" />
            <div className="flex gap-3 pt-3">
              <button onClick={()=>setIsEditCategoryOpen(false)} className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">取消</button>
              <button onClick={handleSaveCategoryName} className="flex-1 p-2.5 rounded-xl bg-primary text-white text-sm font-medium">保存</button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <StudentNameEditor
          student={editingStudent}
          onSave={handleSaveStudentName}
          onCancel={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}

export default ClassManage;