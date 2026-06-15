import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, FileText, DollarSign, PlusCircle, 
  Trash2, Edit, Download, Printer, Home, CheckCircle, XCircle, Clock, TrendingUp
} from 'lucide-react';

// --- الثوابت ---
const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

// --- دوال المساعدة ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getLocalYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getSalaryPeriod = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDate();
  let startMonth = d.getMonth();
  let startYear = d.getFullYear();
  let endMonth = d.getMonth();
  let endYear = d.getFullYear();

  if (day <= 25) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  } else {
    endMonth += 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
  }

  const start = new Date(startYear, startMonth, 26, 0, 0, 0, 0);
  const end = new Date(endYear, endMonth, 25, 23, 59, 59, 999);
  return { start, end };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// --- التطبيق الأساسي ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // --- التحميل الآمن من LocalStorage ---
  const [levelPrices, setLevelPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingLevelPrices');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { Q1: 110, Q2: 110, Q3: 120 }; 
  });

  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingGroups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingSessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingSchedules');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // --- الحفظ في LocalStorage ---
  useEffect(() => {
    localStorage.setItem('teachingLevelPrices', JSON.stringify(levelPrices));
  }, [levelPrices]);

  useEffect(() => {
    localStorage.setItem('teachingGroups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('teachingSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('teachingSchedules', JSON.stringify(schedules));
  }, [schedules]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- البيانات المشتقة ---
  const currentPeriod = useMemo(() => getSalaryPeriod(), []);
  
  const currentPeriodSessions = useMemo(() => {
    return sessions.filter(session => {
      const d = new Date(session.date);
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [sessions, currentPeriod]);

  // حساب الراتب المتوقع بناءً على الجدول الزمني
  const projectedStats = useMemo(() => {
    // 1. حساب عدد تكرار كل يوم في فترة الراتب الحالية
    const dayCounts = {};
    const jsDaysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    DAYS_OF_WEEK.forEach(d => dayCounts[d] = 0);

    let currentDate = new Date(currentPeriod.start);
    currentDate.setHours(12, 0, 0, 0); // أمان من فرق التوقيت
    const endDate = new Date(currentPeriod.end);
    endDate.setHours(12, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayName = jsDaysMap[currentDate.getDay()];
      if (dayCounts[dayName] !== undefined) {
        dayCounts[dayName] += 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 2. حساب إجمالي الحصص المتوقعة والراتب المتوقع
    let targetSessions = 0;
    let targetSalary = 0;

    schedules.forEach(schedule => {
      const occurrences = dayCounts[schedule.day] || 0;
      const group = groups.find(g => g.id === schedule.groupId);
      if (group) {
        targetSessions += occurrences;
        targetSalary += (occurrences * group.price);
      }
    });

    return { targetSessions, targetSalary };
  }, [currentPeriod, schedules, groups]);

  // --- الإجراءات (Actions) ---
  const addGroup = (groupData) => {
    if (groups.some(g => g.code.toLowerCase() === groupData.code.toLowerCase())) {
      showToast('Group code already exists!', 'error');
      return;
    }
    setGroups([...groups, { ...groupData, id: generateId() }]);
    showToast('Group added successfully');
  };

  const updateGroup = (id, updatedData) => {
    setGroups(groups.map(g => g.id === id ? { ...g, ...updatedData } : g));
    showToast('Group updated successfully');
  };

  const deleteGroup = (id) => {
    if (sessions.some(s => s.groupId === id)) {
      showToast('Cannot delete group with existing sessions.', 'error');
      return;
    }
    setSchedules(schedules.filter(s => s.groupId !== id));
    setGroups(groups.filter(g => g.id !== id));
    showToast('Group deleted');
  };

  const addSchedule = (scheduleData) => {
    if (schedules.some(s => s.groupId === scheduleData.groupId && s.day === scheduleData.day && s.time === scheduleData.time)) {
      showToast('This exact schedule already exists!', 'error');
      return;
    }
    setSchedules([...schedules, { ...scheduleData, id: generateId() }]);
    showToast('Schedule added successfully');
  };

  const updateSchedule = (id, updatedData) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, ...updatedData } : s));
    showToast('Schedule updated successfully');
  };

  const deleteSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
    showToast('Schedule deleted');
  };

  const addSessionByCode = (inputString, manualDateStr) => {
    const codeStr = inputString.trim();
    if (!codeStr) return false;

    let sessionDate = new Date();
    if (manualDateStr) {
      const [y, m, d] = manualDateStr.split('-');
      sessionDate = new Date(y, m - 1, d, 12, 0, 0, 0); 
    } else {
      sessionDate.setHours(12, 0, 0, 0);
    }

    let level = 'Q1'; 
    let isSmartCode = codeStr.includes('.');
    let parsedTime = null;

    if (isSmartCode) {
      const parts = codeStr.split('.');
      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        if (['q1', 'q2', 'q3'].includes(lowerPart)) {
          level = lowerPart.toUpperCase();
        } else if (/^\d{1,2}(am|pm)$/.test(lowerPart) || lowerPart === 'am' || lowerPart === 'pm') {
          parsedTime = lowerPart; 
        }
      });

      if (parsedTime) {
        const isPM = parsedTime.endsWith('pm');
        let hour = parseInt(parsedTime.replace(/a|p|m/g, ''), 10);
        if (!isNaN(hour)) {
          if (isPM && hour < 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          sessionDate.setHours(hour, 0, 0, 0);
        }
      }
    }

    const finalGroupCode = codeStr; 
    let group = groups.find(g => g.code.toLowerCase() === finalGroupCode.toLowerCase());
    
    if (!group) {
      if (isSmartCode) {
        group = {
          id: generateId(),
          name: finalGroupCode,
          code: finalGroupCode,
          level: level,
          price: levelPrices[level] || 110 
        };
        setGroups(prev => [...prev, group]);
      } else {
        showToast('Group not found! Create it first or use a smart code.', 'error');
        return false;
      }
    } else if (isSmartCode) {
      group = { ...group, level: level, price: levelPrices[level] || 110 };
    }

    const newSession = {
      id: generateId(),
      groupId: group.id,
      groupCode: finalGroupCode,
      groupName: group.name,
      level: group.level,
      price: group.price,
      date: sessionDate.toISOString(),
      originalCode: codeStr
    };

    setSessions(prev => [newSession, ...prev]);
    showToast(isSmartCode ? 'Smart session added successfully!' : 'Session added successfully!');
    return true;
  };

  const updateSession = (id, updatedData) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, ...updatedData } : s));
    showToast('Session updated');
  };

  const deleteSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
    showToast('Session deleted');
  };

  // --- الواجهات (Views) ---
  const renderDashboard = () => {
    const totalSalary = currentPeriodSessions.reduce((sum, s) => sum + s.price, 0);
    const sessionsByLevel = currentPeriodSessions.reduce((acc, s) => {
      acc[s.level] = (acc[s.level] || 0) + 1;
      return acc;
    }, {});

    // نسبة التقدم
    const progressPercent = projectedStats.targetSalary > 0 
      ? Math.min(100, Math.round((totalSalary / projectedStats.targetSalary) * 100)) 
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Overview & Projections</h2>
          <span className="text-sm font-medium bg-white px-3 py-1 border border-gray-200 rounded-full text-gray-600 shadow-sm">
            {formatDate(currentPeriod.start)} - {formatDate(currentPeriod.end)}
          </span>
        </div>

        {/* كروت التوقعات (Projections) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <h3 className="text-slate-300 font-medium mb-1">Target Salary (From Schedules)</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{projectedStats.targetSalary}</span>
              <span className="text-lg text-slate-400 mb-1">EGP</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Based on {projectedStats.targetSessions} scheduled sessions this period.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <h3 className="text-gray-500 font-medium mb-1">Current Earned Salary</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-emerald-600">{totalSalary}</span>
              <span className="text-lg text-gray-400 mb-1">EGP</span>
            </div>
            
            {/* شريط التقدم */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>{progressPercent}% Achieved</span>
              <span>{projectedStats.targetSalary > totalSalary ? `${projectedStats.targetSalary - totalSalary} EGP left` : 'Target Met! 🎉'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed Sessions</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{currentPeriodSessions.length}</p>
                <p className="text-xs text-gray-400">/ {projectedStats.targetSessions} expected</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-2">Sessions Breakdown</p>
            <div className="space-y-2">
              {Object.keys(levelPrices).map(level => (
                <div key={level} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{level}</span>
                  <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                    {sessionsByLevel[level] || 0} sessions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Add Session</h3>
          <QuickAddSession onAdd={addSessionByCode} />
        </div>
      </div>
    );
  };

  const renderGroups = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Groups & Levels</h2>
        
        {/* إعدادات أسعار المستويات */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Default Level Prices</h3>
          <div className="flex flex-wrap gap-4">
            {Object.keys(levelPrices).map(level => (
              <div key={level} className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">{level} Price (EGP)</label>
                <input
                  type="number"
                  value={levelPrices[level]}
                  onChange={(e) => setLevelPrices({ ...levelPrices, [level]: Number(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">* Changes here will automatically apply to newly added sessions and groups.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Group</h3>
          <AddGroupForm onAdd={addGroup} levelPrices={levelPrices} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <GroupTable groups={groups} onDelete={deleteGroup} onUpdate={updateGroup} levelPrices={levelPrices} />
        </div>
      </div>
    );
  };

  const renderSchedules = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Weekly Schedules</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Schedule</h3>
          <AddScheduleForm groups={groups} onAdd={addSchedule} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <InteractiveScheduleView schedules={schedules} groups={groups} onDelete={deleteSchedule} onUpdate={updateSchedule} />
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Session History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <SessionTable sessions={sessions} onDelete={deleteSession} onUpdate={updateSession} levelPrices={levelPrices} />
        </div>
      </div>
    );
  };

  const renderReport = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Salary Report</h2>
          <div className="flex space-x-3 print:hidden">
            <button 
              onClick={() => exportCSV(currentPeriodSessions, currentPeriod)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Download size={18} />
              <span>Excel (CSV)</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
            >
              <Printer size={18} />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teaching Salary Report</h1>
            <p className="text-lg text-gray-600 mt-2">
              Period: {formatDate(currentPeriod.start)} to {formatDate(currentPeriod.end)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg print:border print:border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="font-bold text-gray-900">{currentPeriodSessions.length}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-800 font-semibold">Total Salary:</span>
                  <span className="font-bold text-emerald-600">
                    {currentPeriodSessions.reduce((sum, s) => sum + s.price, 0)} EGP
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg print:border print:border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Breakdown by Level</h3>
              <div className="space-y-2">
                {Object.keys(levelPrices).map(level => {
                  const count = currentPeriodSessions.filter(s => s.level === level).length;
                  const sum = currentPeriodSessions.filter(s => s.level === level).reduce((acc, s) => acc + s.price, 0);
                  return (
                    <div key={level} className="flex justify-between text-sm">
                      <span className="text-gray-600">{level}:</span>
                      <span className="font-medium text-gray-900">{count} sessions = {sum} EGP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-4">Session Log</h3>
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...currentPeriodSessions].sort((a,b) => new Date(a.date) - new Date(b.date)).map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{formatDate(s.date)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{s.groupName}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{s.level}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{s.price} EGP</td>
                </tr>
              ))}
              {currentPeriodSessions.length === 0 && (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No sessions recorded in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <nav className="bg-white shadow-sm border-b border-gray-200 print:hidden sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Users size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">TeachFlow</span>
            </div>
            
            <div className="flex space-x-1 sm:space-x-4 items-center overflow-x-auto no-scrollbar">
              <NavButton icon={<Home size={18} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavButton icon={<PlusCircle size={18} />} label="Groups" isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
              <NavButton icon={<Clock size={18} />} label="Schedules" isActive={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')} />
              <NavButton icon={<Calendar size={18} />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              <NavButton icon={<FileText size={18} />} label="Report" isActive={activeTab === 'report'} onClick={() => setActiveTab('report')} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'groups' && renderGroups()}
        {activeTab === 'schedules' && renderSchedules()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'report' && renderReport()}
      </main>

      {toast && (
        <div className={`fixed bottom-4 right-4 flex items-center space-x-2 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in-up print:hidden ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900'
        }`}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// --- المكونات الفرعية ---
const NavButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      isActive 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const AddGroupForm = ({ onAdd, levelPrices }) => {
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('Q1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) return;
    onAdd({
      name: code.trim(), 
      code: code.trim(),
      level,
      price: levelPrices[level] || 110
    });
    setCode('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Group Code / Name</label>
        <input 
          type="text" required
          value={code} onChange={e => setCode(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
          placeholder="e.g., 3C.SR.PRI.Q2..."
        />
      </div>
      <div className="w-full sm:w-32">
        <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
        <select 
          value={level} onChange={e => setLevel(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          {Object.keys(levelPrices).map(l => (
            <option key={l} value={l}>{l} ({levelPrices[l]})</option>
          ))}
        </select>
      </div>
      <button 
        type="submit"
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
      >
        Add Group
      </button>
    </form>
  );
};

const GroupTable = ({ groups, onDelete, onUpdate, levelPrices }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditData({ ...group });
  };

  const saveEdit = () => {
    onUpdate(editingId, editData);
    setEditingId(null);
  };

  if (groups.length === 0) {
    return <div className="p-8 text-center text-gray-500">No groups added yet.</div>;
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Session</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {groups.map(g => (
          <tr key={g.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {editingId === g.id ? (
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={e => setEditData({...editData, name: e.target.value, code: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm font-mono w-full"
                />
              ) : (
                <span className="font-mono text-blue-600 font-bold">{g.name}</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {editingId === g.id ? (
                <select 
                  value={editData.level} 
                  onChange={e => setEditData({...editData, level: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                >
                  {Object.keys(levelPrices).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              ) : (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{g.level}</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === g.id ? (
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={editData.price} 
                    onChange={e => setEditData({...editData, price: Number(e.target.value)})}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20 mr-1"
                  />
                  <span className="text-gray-500 text-xs">EGP</span>
                </div>
              ) : (
                `${g.price} EGP`
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {editingId === g.id ? (
                <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-900 mr-4 font-bold">Save</button>
              ) : (
                <button onClick={() => startEdit(g)} className="text-blue-600 hover:text-blue-900 mr-4">
                  <Edit size={18} />
                </button>
              )}
              <button onClick={() => onDelete(g.id)} className="text-red-600 hover:text-red-900">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const AddScheduleForm = ({ groups, onAdd }) => {
  const [groupId, setGroupId] = useState('');
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupId || !day || !time) return;
    onAdd({ groupId, day, time });
    setTime(''); 
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
        <select 
          required
          value={groupId} 
          onChange={e => setGroupId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="" disabled>-- Choose a Group --</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
        <select 
          value={day} 
          onChange={e => setDay(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          {DAYS_OF_WEEK.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
        <input 
          type="time" 
          required
          value={time} 
          onChange={e => setTime(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <button 
        type="submit"
        disabled={groups.length === 0}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Schedule
      </button>
    </form>
  );
};

const InteractiveScheduleView = ({ schedules, groups, onDelete, onUpdate }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const daySchedules = schedules
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditData({ ...schedule });
  };

  const saveEdit = () => {
    onUpdate(editingId, editData);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-4 mb-4 border-b border-gray-200">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            onClick={() => { setSelectedDay(day); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              selectedDay === day ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
            }`}>
              {schedules.filter(s => s.day === day).length}
            </span>
          </button>
        ))}
      </div>

      {daySchedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No sessions scheduled for {selectedDay}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daySchedules.map(s => {
            const group = groups.find(g => g.id === s.groupId);
            
            if (editingId === s.id) {
              return (
                <div key={s.id} className="flex flex-col bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-gray-500">Day</label>
                      <select value={editData.day} onChange={e => setEditData({...editData, day: e.target.value})} className="w-full border rounded p-1 text-sm bg-white">
                        {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Time</label>
                      <input type="time" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} className="w-full border rounded p-1 text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                    <button onClick={saveEdit} className="px-3 py-1 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700 font-medium">Save</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={s.id} className="flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group/card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                    <Clock size={16} className="mr-2" />
                    {formatTime(s.time)}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(s)} className="text-gray-400 hover:text-blue-600 p-1" title="Edit schedule">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(s.id)} className="text-gray-400 hover:text-red-600 p-1" title="Delete schedule">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-gray-900 font-mono font-bold text-lg mb-1 break-all">
                    {group ? group.name : 'Unknown Group'}
                  </h4>
                  {group && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded border border-gray-200 mt-2">
                      Level: {group.level}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const QuickAddSession = ({ onAdd }) => {
  const [code, setCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getLocalYYYYMMDD());

  useEffect(() => {
    if (code && code.includes('.')) {
      const parts = code.split('.');
      const datePart = parts.find(p => /^\d{8}$/.test(p));
      if (datePart) {
        const day = datePart.substring(0, 2);
        const month = datePart.substring(2, 4);
        const year = datePart.substring(4, 8);
        const parsedYMD = `${year}-${month}-${day}`;
        const d = new Date(parsedYMD);
        if (!isNaN(d.getTime())) {
          setSelectedDate(parsedYMD);
        }
      }
    }
  }, [code]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) return;
    const success = onAdd(code, selectedDate);
    if (success) {
      setCode(''); 
      setSelectedDate(getLocalYYYYMMDD());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <input 
          type="text" 
          value={code} 
          onChange={e => setCode(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none uppercase text-lg font-mono shadow-sm"
          placeholder="Paste smart code (e.g. 3c.Sr.q2...) or Group Code..."
          autoFocus
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="text-gray-400" size={20} />
        </div>
      </div>
      <input 
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-gray-700"
      />
      <button 
        type="submit"
        className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium shadow-sm whitespace-nowrap"
      >
        Save Session
      </button>
    </form>
  );
};

const SessionTable = ({ sessions, onDelete, onUpdate, levelPrices }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (session) => {
    setEditingId(session.id);
    const d = new Date(session.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditData({
      date: d.toISOString().slice(0, 16),
      level: session.level,
      price: session.price
    });
  };

  const saveEdit = (id) => {
    onUpdate(id, { 
      date: new Date(editData.date).toISOString(),
      level: editData.level,
      price: editData.price
    });
    setEditingId(null);
  };

  if (sessions.length === 0) {
    return <div className="p-8 text-center text-gray-500">No sessions recorded yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...sessions].sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingId === s.id ? (
                  <input 
                    type="datetime-local" 
                    value={editData.date} 
                    onChange={e => setEditData({...editData, date: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex flex-col">
                    <span className="font-medium">{formatDate(s.date)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono font-bold text-blue-600">{s.groupName}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === s.id ? (
                  <select 
                    value={editData.level} 
                    onChange={e => setEditData({...editData, level: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    {Object.keys(levelPrices).map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200">
                    {s.level}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {editingId === s.id ? (
                   <div className="flex items-center">
                     <input 
                       type="number" 
                       value={editData.price} 
                       onChange={e => setEditData({...editData, price: Number(e.target.value)})}
                       className="border border-gray-300 rounded px-2 py-1 text-sm w-20 mr-1 focus:ring-1 focus:ring-blue-500"
                     />
                     <span className="text-xs text-gray-500">EGP</span>
                   </div>
                ) : (
                  `${s.price} EGP`
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === s.id ? (
                  <button onClick={() => saveEdit(s.id)} className="text-emerald-600 hover:text-emerald-900 mr-4 font-bold">Save</button>
                ) : (
                  <button onClick={() => startEdit(s)} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Edit size={18} />
                  </button>
                )}
                <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-900">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const exportCSV = (sessions, period) => {
  const headers = ['Date', 'Time', 'Group Code / Name', 'Level', 'Price (EGP)'];
  
  const rows = [...sessions]
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .map(s => {
      const d = new Date(s.date);
      return [
        d.toLocaleDateString('en-GB'),
        d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        `"${s.groupName}"`,
        s.level,
        s.price
      ];
    });

  const totalSalary = sessions.reduce((sum, s) => sum + s.price, 0);
  rows.push(['', '', '', 'TOTAL SESSIONS', sessions.length]);
  rows.push(['', '', '', 'TOTAL SALARY', totalSalary]);

  const csvContent = [
    `Salary Report: ${formatDate(period.start)} to ${formatDate(period.end)}`,
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Salary_Report_${formatDate(period.start).replace(/ /g, '_')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};