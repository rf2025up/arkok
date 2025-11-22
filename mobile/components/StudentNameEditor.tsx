import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StudentNameEditorProps {
  student: {
    id: string;
    name: string;
    avatar: string;
  };
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

const StudentNameEditor: React.FC<StudentNameEditorProps> = ({ student, onSave, onCancel }) => {
  const [name, setName] = useState(student.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('姓名不能为空');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(trimmedName);
      setLoading(false);
    } catch (err) {
      console.error('保存失败：', err);
      setError('保存失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">编辑学生姓名</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-16 h-16 rounded-full border-2 border-primary/20 object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/><circle cx=%2232%22 cy=%2224%22 r=%2212%22 fill=%22%23cbd5e1%22/><rect x=%2216%22 y=%2240%22 width=%2232%22 height=%2216%22 rx=%228%22 fill=%22%23cbd5e1%22/></svg>';
            }}
          />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">当前姓名</label>
            <p className="text-lg font-bold text-gray-800">{student.name}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">新姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            placeholder="输入新姓名"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-105 font-medium transition-all disabled:bg-gray-400"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentNameEditor;
