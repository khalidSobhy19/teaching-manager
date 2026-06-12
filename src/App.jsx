import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, FileText, DollarSign, PlusCircle, 
  Trash2, Edit, Download, Printer, Home, CheckCircle, XCircle, Clock
} from 'lucide-react';

// --- الثوابت ---
const LEVEL_PRICES = {
  Q1: 110,
  Q2: 110,
  Q3: 120,
};

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
  // timeString is typically "HH:mm" in 24h format
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

  // --- التحميل الآمن من LocalStorage (Lazy Initialization) ---
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingGroups');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading groups from localStorage", e);
    }
    return [];
  });

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingSessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading sessions from localStorage", e);
    }
    return [];
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingSchedules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading schedules from localStorage", e);
    }
    return [];
  });

  // --- الحفظ في LocalStorage عند التغيير ---
  useEffect(() => {
    try {
      localStorage.setItem('teachingGroups', JSON.stringify(groups));
    } catch (e) {
      console.error("Error saving groups to localStorage", e);
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem('teachingSessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Error saving sessions to localStorage", e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('teachingSchedules', JSON.stringify(schedules));
    } catch (e) {
      console.error("Error saving schedules to localStorage", e);
    }
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

  // --- الإجراءات (Actions) ---
  const addGroup = (groupData) => {
    if (groups.some(g => g.code.toLowerCase() === groupData.code.toLowerCase())) {
      showToast('Group code already exists!', 'error');
      return;
    }
    setGroups([...groups, { ...groupData, id: generateId() }]);
    showToast('Group added successfully');
  };

  const deleteGroup = (id) => {
    if (sessions.some(s => s.groupId === id)) {
      showToast('Cannot delete group with existing sessions.', 'error');
      return;
    }
    // Also delete any schedules associated with this group
    setSchedules(schedules.filter(s => s.groupId !== id));
    setGroups(groups.filter(g => g.id !== id));
    showToast('Group deleted');
  };

  const addSchedule = (scheduleData) => {
    // Check if this exact slot already exists
    if (schedules.some(s => s.groupId === scheduleData.groupId && s.day === scheduleData.day && s.time === scheduleData.time)) {
      showToast('This exact schedule already exists!', 'error');
      return;
    }
    setSchedules([...schedules, { ...scheduleData, id: generateId() }]);
    showToast('Schedule added successfully');
  };

  const deleteSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
    showToast('Schedule deleted');
  };

  // دالة الإضافة الذكية المعدلة
  const addSessionByCode = (inputString, manualDateStr) => {
    const codeStr = inputString.trim();
    if (!codeStr) return false;

    let sessionDate = new Date();
    // إعطاء الأولوية المطلقة للتاريخ القادم من مربع الإدخال
    if (manualDateStr) {
      const [y, m, d] = manualDateStr.split('-');
      sessionDate = new Date(y, m - 1, d, 12, 0, 0, 0); 
    } else {
      sessionDate.setHours(12, 0, 0, 0);
    }

    let level = 'Q1'; // default
    let isSmartCode = codeStr.includes('.');
    
    let parsedTime = null;

    if (isSmartCode) {
      const parts = codeStr.split('.');
      
      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        
        if (['q1', 'q2', 'q3'].includes(lowerPart)) {
          level = lowerPart.toUpperCase();
        } else if (/^\d{8}$/.test(part)) {
          // يتم تجاهل التاريخ هنا لأننا استخدمناه بالفعل لتحديث المربع اليدوي
          // ولن نسمح له بأن يمحو اختيار المستخدم أبداً
        } else if (/^\d{1,2}(am|pm)$/.test(lowerPart) || lowerPart === 'am' || lowerPart === 'pm') {
          parsedTime = lowerPart; 
        }
      });

      // تطبيق الوقت المستخرج
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

    // التعديل هنا: استخدام الكود الكامل كما هو كاسم للجروب وكود له
    const finalGroupCode = codeStr; 
    
    // البحث عن المجموعة أو إنشائها
    let group = groups.find(g => g.code.toLowerCase() === finalGroupCode.toLowerCase());
    
    if (!group) {
      if (isSmartCode) {
        group = {
          id: generateId(),
          name: finalGroupCode, // الاسم سيكون الكود كاملاً
          code: finalGroupCode, // الكود سيكون الكود كاملاً
          level: level,
          price: LEVEL_PRICES[level]
        };
        setGroups(prev => [...prev, group]);
      } else {
        showToast('Group not found! Create it first or use a smart code.', 'error');
        return false;
      }
    } else if (isSmartCode) {
      group = { ...group, level: level, price: LEVEL_PRICES[level] };
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

  const deleteSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
    showToast('Session deleted');
  };

  const updateSession = (id, updatedData) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, ...updatedData } : s));
    showToast('Session updated');
  };

  // --- الواجهات (Views) ---
  const renderDashboard = () => {
    const totalSalary = currentPeriodSessions.reduce((sum, s) => sum + s.price, 0);
    const sessionsByLevel = currentPeriodSessions.reduce((acc, s) => {
      acc[s.level] = (acc[s.level] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Current Period Overview</h2>
        <p className="text-sm text-gray-500 mb-4">
          {formatDate(currentPeriod.start)} - {formatDate(currentPeriod.end)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{currentPeriodSessions.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Expected Salary</p>
              <p className="text-2xl font-bold text-gray-900">{totalSalary} EGP</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-2">Sessions by Level</p>
            <div className="space-y-2">
              {Object.keys(LEVEL_PRICES).map(level => (
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
        <h2 className="text-2xl font-bold text-gray-800">Manage Groups</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AddGroupForm onAdd={addGroup} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              {groups.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No groups added yet.</td></tr>
              ) : (
                groups.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-bold">{g.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{g.level}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{g.price} EGP</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => deleteGroup(g.id)} className="text-red-600 hover:text-red-900 ml-4">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ScheduleTable schedules={schedules} groups={groups} onDelete={deleteSchedule} />
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Session History</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <SessionTable 
            sessions={sessions} 
            onDelete={deleteSession} 
            onUpdate={updateSession}
          />
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
                {Object.keys(LEVEL_PRICES).map(level => {
                  const count = currentPeriodSessions.filter(s => s.level === level).length;
                  const sum = count * LEVEL_PRICES[level];
                  return (
                    <div key={level} className="flex justify-between text-sm">
                      <span className="text-gray-600">{level} ({LEVEL_PRICES[level]} EGP):</span>
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

const AddGroupForm = ({ onAdd }) => {
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('Q1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) return;
    
    onAdd({
      name: code.trim(), // Name and code are the same now based on previous request
      code: code.trim(),
      level,
      price: LEVEL_PRICES[level]
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
          <option value="Q1">Q1 (110)</option>
          <option value="Q2">Q2 (110)</option>
          <option value="Q3">Q3 (120)</option>
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

const AddScheduleForm = ({ groups, onAdd }) => {
  const [groupId, setGroupId] = useState('');
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupId || !day || !time) return;
    onAdd({ groupId, day, time });
    setTime(''); // Reset time after adding
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

const ScheduleTable = ({ schedules, groups, onDelete }) => {
  if (schedules.length === 0) {
    return <div className="p-8 text-center text-gray-500">No schedules set up yet.</div>;
  }

  // Sort by Day then Time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSchedules.map((s, index) => {
            const group = groups.find(g => g.id === s.groupId);
            return (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {s.day}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-400" />
                    <span>{formatTime(s.time)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono font-bold text-blue-600">
                    {group ? group.name : 'Unknown Group'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const QuickAddSession = ({ onAdd }) => {
  const [code, setCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getLocalYYYYMMDD());

  // تعديل ذكي: عند لصق كود، استخرج التاريخ وحدث المربع للمستخدم ليراه ويتأكد منه!
  useEffect(() => {
    if (code && code.includes('.')) {
      const parts = code.split('.');
      const datePart = parts.find(p => /^\d{8}$/.test(p));
      if (datePart) {
        const day = datePart.substring(0, 2);
        const month = datePart.substring(2, 4);
        const year = datePart.substring(4, 8);
        const parsedYMD = `${year}-${month}-${day}`;
        // التأكد من صحة التاريخ قبل وضعه في المربع
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
      // إعادة ضبط المربع لتاريخ اليوم للسيشن القادمة
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

const SessionTable = ({ sessions, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');

  const startEdit = (session) => {
    setEditingId(session.id);
    const d = new Date(session.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditDate(d.toISOString().slice(0, 16));
  };

  const saveEdit = (id) => {
    onUpdate(id, { date: new Date(editDate).toISOString() });
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
                    value={editDate} 
                    onChange={e => setEditDate(e.target.value)}
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
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200">
                  {s.level}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {s.price} EGP
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === s.id ? (
                  <button onClick={() => saveEdit(s.id)} className="text-emerald-600 hover:text-emerald-900 mr-3">Save</button>
                ) : (
                  <button onClick={() => startEdit(s)} className="text-blue-600 hover:text-blue-900 mr-3">
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

// --- أدوات التصدير ---
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