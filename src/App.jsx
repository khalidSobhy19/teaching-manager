import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, FileText, DollarSign, PlusCircle, 
  Trash2, Edit, Download, Printer, Home, CheckCircle, XCircle, Clock, TrendingUp, Sun, Moon
} from 'lucide-react';

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const generateId = () => Math.random().toString(36).substr(2, 9);

const getLocalYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getPeriodInfo = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  let year = d.getFullYear();
  let month = d.getMonth();
  const day = d.getDate();

  if (day > 25) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) {
    startMonth = 11;
    startYear -= 1;
  }

  const start = new Date(startYear, startMonth, 26, 0, 0, 0, 0);
  const end = new Date(year, month, 25, 23, 59, 59, 999);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${monthNames[month]} ${year} Salary`;

  return { key, start, end, label };
};

const getPeriodInfoFromKey = (key) => {
  const [y, m] = key.split('-');
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;

  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) {
    startMonth = 11;
    startYear -= 1;
  }

  const start = new Date(startYear, startMonth, 26, 0, 0, 0, 0);
  const end = new Date(year, month, 25, 23, 59, 59, 999);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${monthNames[month]} ${year} Salary`;

  return { key, start, end, label };
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

const getWeekdaysCount = (startDate, endDate, dayNameEn) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayNameEn);
  if (targetDay === -1) return 0;

  let count = 0;
  let current = new Date(startDate);
  current.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);

  while (current <= end) {
    if (current.getDay() === targetDay) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Helper to convert hex to rgba for beautiful transparent badges
const hexToRgba = (hex, opacity) => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${opacity})`;
};

const getLevelStyle = (level, levelsData) => {
  const color = (levelsData && levelsData[level] && levelsData[level].color) ? levelsData[level].color : '#6b7280';
  return {
    backgroundColor: hexToRgba(color, 0.15),
    color: color,
    borderColor: hexToRgba(color, 0.3),
    borderWidth: '1px',
    borderStyle: 'solid'
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingTheme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('teachingTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Unified state for Levels: Name, Price, and Color
  const [levelsData, setLevelsData] = useState(() => {
    try {
      const saved = localStorage.getItem('teachingLevelsData');
      if (saved) return JSON.parse(saved);

      // Fallback migration from old simple levelPrices
      const oldSaved = localStorage.getItem('teachingLevelPrices');
      if (oldSaved) {
        const parsedOld = JSON.parse(oldSaved);
        const migrated = {};
        const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        Object.keys(parsedOld).forEach((key, index) => {
          migrated[key] = {
            price: typeof parsedOld[key] === 'number' ? parsedOld[key] : (parsedOld[key].price || 0),
            color: defaultColors[index % defaultColors.length]
          };
        });
        return migrated;
      }
    } catch (e) {}
    
    // Defaults if completely new
    return {
      Q1: { price: 110, color: '#3b82f6' },
      Q2: { price: 110, color: '#10b981' },
      Q3: { price: 120, color: '#f59e0b' }
    };
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

  useEffect(() => localStorage.setItem('teachingLevelsData', JSON.stringify(levelsData)), [levelsData]);
  useEffect(() => localStorage.setItem('teachingGroups', JSON.stringify(groups)), [groups]);
  useEffect(() => localStorage.setItem('teachingSessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('teachingSchedules', JSON.stringify(schedules)), [schedules]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const availablePeriods = useMemo(() => {
    const periodsMap = new Map();
    const current = getPeriodInfo();
    periodsMap.set(current.key, current);

    sessions.forEach(s => {
      const p = getPeriodInfo(new Date(s.date));
      if (!periodsMap.has(p.key)) {
        periodsMap.set(p.key, p);
      }
    });
    return Array.from(periodsMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [sessions]);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState(() => getPeriodInfo().key);

  const activePeriod = useMemo(() => {
    return availablePeriods.find(p => p.key === selectedPeriodKey) || getPeriodInfoFromKey(selectedPeriodKey);
  }, [selectedPeriodKey, availablePeriods]);

  const activePeriodSessions = useMemo(() => {
    return sessions.filter(session => {
      const d = new Date(session.date);
      return d >= activePeriod.start && d <= activePeriod.end;
    });
  }, [sessions, activePeriod]);


  const addLevel = (name, price, color) => {
    if (!name) return;
    const upperName = name.toUpperCase();
    if (levelsData[upperName]) {
      showToast('Level name already exists!', 'error');
      return;
    }
    setLevelsData(prev => ({ ...prev, [upperName]: { price: parseInt(price) || 0, color: color } }));
    showToast('Level added successfully');
  };

  const editLevel = (oldName, newName, newPrice, newColor, applyFromDate) => {
    const upperNewName = newName.toUpperCase();
    if (oldName !== upperNewName && levelsData[upperNewName]) {
      showToast('This new name already exists in levels!', 'error');
      return;
    }

    setLevelsData(prev => {
      const updated = { ...prev };
      delete updated[oldName];
      updated[upperNewName] = { price: parseInt(newPrice) || 0, color: newColor };
      return updated;
    });

    setGroups(groups.map(g => {
      if (g.level === oldName) {
        return { ...g, level: upperNewName, price: parseInt(newPrice) || 0 };
      }
      return g;
    }));

    setSessions(prevSessions => prevSessions.map(s => {
      let updatedSession = { ...s };
      if (s.level === oldName) {
        updatedSession.level = upperNewName;
      }
      if (applyFromDate && (s.level === oldName || s.level === upperNewName)) {
        const sDate = new Date(s.date);
        const fromDateObj = new Date(applyFromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        if (sDate >= fromDateObj) {
          updatedSession.price = parseInt(newPrice) || 0;
        }
      }
      return updatedSession;
    }));

    showToast('Level updated successfully');
  };

  const deleteLevel = (name) => {
    if (groups.some(g => g.level === name) || sessions.some(s => s.level === name)) {
      showToast('Cannot delete level used by existing groups or sessions.', 'error');
      return;
    }
    setLevelsData(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
    showToast('Level deleted');
  };

  const addGroup = (groupData) => {
    if (groups.some(g => g.code.toLowerCase() === groupData.code.toLowerCase())) {
      showToast('Group code already exists!', 'error');
      return;
    }
    setGroups([...groups, { ...groupData, id: generateId() }]);
    showToast('Group added successfully');
  };

  const updateGroup = (id, updatedData, applyFromDate) => {
    setGroups(groups.map(g => g.id === id ? { ...g, ...updatedData } : g));
    
    if (applyFromDate) {
      setSessions(prevSessions => prevSessions.map(s => {
        if (s.groupId === id) {
          const sDate = new Date(s.date);
          const fromDateObj = new Date(applyFromDate);
          fromDateObj.setHours(0, 0, 0, 0);
          if (sDate >= fromDateObj) {
            return { 
              ...s, 
              price: updatedData.price,
              level: updatedData.level,
              groupCode: updatedData.name || updatedData.code,
              groupName: updatedData.name || updatedData.code
            };
          }
        }
        return s;
      }));
    }
    showToast('Group updated');
  };

  const deleteGroup = (id) => {
    if (sessions.some(s => s.groupId === id)) {
      showToast('Cannot delete a group with recorded sessions.', 'error');
      return;
    }
    setSchedules(schedules.filter(s => s.groupId !== id));
    setGroups(groups.filter(g => g.id !== id));
    showToast('Group deleted');
  };

  const addSchedule = (scheduleData) => {
    if (schedules.some(s => s.groupId === scheduleData.groupId && s.day === scheduleData.day && s.time === scheduleData.time)) {
      showToast('This schedule already exists!', 'error');
      return;
    }
    setSchedules([...schedules, { ...scheduleData, id: generateId() }]);
    showToast('Schedule added successfully');
  };

  const updateSchedule = (id, updatedData) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, ...updatedData } : s));
    showToast('Schedule updated');
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

    const availableLevelKeys = Object.keys(levelsData);
    let level = availableLevelKeys.length > 0 ? availableLevelKeys[0] : 'Q1'; 
    let isSmartCode = codeStr.includes('.');
    let parsedTime = null;

    if (isSmartCode) {
      const parts = codeStr.split('.');
      const lowerLevelKeys = availableLevelKeys.map(k => k.toLowerCase());

      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        
        if (lowerLevelKeys.includes(lowerPart)) {
          const actualKey = availableLevelKeys.find(k => k.toLowerCase() === lowerPart);
          level = actualKey;
        } else if (/^\d{8}$/.test(part)) {
          // Date Handled
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
          price: levelsData[level]?.price || 0
        };
        setGroups(prev => [...prev, group]);
      } else {
        showToast('Group not found! Create it first or use a smart code.', 'error');
        return false;
      }
    } else if (isSmartCode) {
      group = { ...group, level: level, price: levelsData[level]?.price || group.price };
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

  const renderPeriodSelector = () => (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-bold bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
        <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
        <span>Period Archive:</span>
      </div>
      <select
        value={selectedPeriodKey}
        onChange={(e) => setSelectedPeriodKey(e.target.value)}
        className="flex-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer shadow-sm transition-all"
      >
        {availablePeriods.map(p => (
          <option key={p.key} value={p.key}>
            {p.label} ({formatDate(p.start)} to {formatDate(p.end)})
          </option>
        ))}
      </select>
    </div>
  );

  const renderDashboard = () => {
    const actualSalary = activePeriodSessions.reduce((sum, s) => sum + s.price, 0);
    const actualSessionsCount = activePeriodSessions.length;

    let targetSalary = 0;
    let targetSessionsCount = 0;
    
    schedules.forEach(schedule => {
      const group = groups.find(g => g.id === schedule.groupId);
      if (group) {
        const countInPeriod = getWeekdaysCount(activePeriod.start, activePeriod.end, schedule.day);
        targetSessionsCount += countInPeriod;
        targetSalary += countInPeriod * group.price;
      }
    });

    const progressPercentage = targetSalary > 0 ? Math.min(100, Math.round((actualSalary / targetSalary) * 100)) : 0;

    const sessionsByLevel = activePeriodSessions.reduce((acc, s) => {
      acc[s.level] = (acc[s.level] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-fade-in">
        {renderPeriodSelector()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-md text-white relative overflow-hidden">
            <TrendingUp className="absolute top-4 right-4 opacity-20" size={80} />
            <h3 className="text-blue-100 font-medium mb-1">Target Expected Salary</h3>
            <div className="text-4xl font-bold mb-2">{targetSalary} <span className="text-xl font-normal">EGP</span></div>
            <p className="text-sm text-blue-200">Based on {targetSessionsCount} scheduled sessions.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden transition-colors">
            <DollarSign className="absolute top-4 right-4 text-emerald-100 dark:text-emerald-900/30" size={80} />
            <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Actual Current Salary</h3>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{actualSalary} <span className="text-xl font-normal text-gray-600 dark:text-gray-300">EGP</span></div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className={progressPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-1000 ${progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PlusCircle size={20} className="text-blue-600 dark:text-blue-400" />
              Quick Add Session
            </h3>
            <QuickAddSession onAdd={addSessionByCode} levelsData={levelsData} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
              Sessions by Level
            </h3>
            <div className="space-y-3">
              {Object.keys(levelsData).map(level => {
                const count = sessionsByLevel[level] || 0;
                return (
                  <div key={level} className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 transition-colors">
                    <span style={getLevelStyle(level, levelsData)} className="font-bold px-3 py-1 rounded shadow-sm">Level {level}</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {count} sessions <span className="text-gray-400 dark:text-gray-600 mx-1">|</span> {count * (levelsData[level]?.price || 0)} EGP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroups = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Levels & Groups</h2>
        
        <LevelsManager 
          levelsData={levelsData} 
          onAdd={addLevel} 
          onEdit={editLevel} 
          onDelete={deleteLevel} 
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Add New Group</h3>
          <AddGroupForm onAdd={addGroup} levelsData={levelsData} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <GroupsTable groups={groups} onDelete={deleteGroup} onUpdate={updateGroup} levelsData={levelsData} />
        </div>
      </div>
    );
  };

  const renderSchedules = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header with Print Button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Weekly Schedules</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Register your fixed schedules here so the system can calculate your target expected salary every month.</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Printer size={18} />
            <span>Print Schedule</span>
          </button>
        </div>
        
        {/* Interactive View - Hidden during printing */}
        <div className="print:hidden space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Add Fixed Schedule</h3>
            <AddScheduleForm groups={groups} onAdd={addSchedule} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <InteractiveScheduleView schedules={schedules} groups={groups} onDelete={deleteSchedule} onUpdate={updateSchedule} levelsData={levelsData} />
          </div>
        </div>

        {/* Printable Area - Only visible when printing/saving as PDF */}
        <div 
          className="hidden print:block w-full bg-white p-4"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <div className="text-center mb-8 border-b-2 border-blue-200 pb-4">
            <h1 className="text-4xl font-extrabold text-blue-800 uppercase tracking-widest">Weekly Teaching Schedule</h1>
            <p className="text-gray-500 mt-2 font-bold">Generated on {formatDate(new Date().toISOString())}</p>
          </div>
          
          <div className="space-y-8">
            {DAYS_OF_WEEK.map(day => {
              const daySchedules = schedules
                .filter(s => s.day === day)
                .sort((a, b) => a.time.localeCompare(b.time));
                
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="mb-6 break-inside-avoid border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Day Header */}
                  <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-100">
                    <h2 className="text-2xl font-bold text-blue-800 uppercase tracking-wider">{day}</h2>
                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{daySchedules.length} Sessions</span>
                  </div>

                  <table className="min-w-full border-collapse">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-6 py-3 text-left font-extrabold w-1/4 uppercase text-sm border-r border-blue-500">Time</th>
                        <th className="px-6 py-3 text-left font-extrabold w-1/2 uppercase text-sm border-r border-blue-500">Group Code / Name</th>
                        <th className="px-6 py-3 text-center font-extrabold w-1/4 uppercase text-sm">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySchedules.map((s, index) => {
                        const group = groups.find(g => g.id === s.groupId);
                        return (
                          <tr key={s.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 font-bold text-blue-700 text-lg border-r border-gray-100">
                              {formatTime(s.time)}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-800 font-mono text-lg break-all border-r border-gray-100">
                              {group ? group.name : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {group && (
                                <span 
                                  style={getLevelStyle(group.level, levelsData)} 
                                  className="inline-block px-4 py-1.5 rounded-md text-sm font-extrabold shadow-sm"
                                >
                                  {group.level}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
            
            {schedules.length === 0 && (
              <div className="text-center text-gray-500 font-bold py-10 border-2 border-dashed border-gray-400 rounded-xl">
                No schedules defined yet. Please add schedules to print the timetable.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Session History</h2>
        {renderPeriodSelector()}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <SessionTable 
            sessions={activePeriodSessions} 
            onDelete={deleteSession} 
            onUpdate={updateSession}
            levelsData={levelsData}
          />
        </div>
      </div>
    );
  };

  const renderReport = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Financial Report</h2>
          <div className="flex gap-3 print:hidden">
            <button 
              onClick={() => exportCSV(activePeriodSessions, activePeriod)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
            >
              <Download size={18} />
              <span>Export Excel</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors shadow-sm font-medium"
            >
              <Printer size={18} />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {renderPeriodSelector()}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 print:shadow-none print:border-none print:p-0 transition-colors">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary & Sessions Report</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium bg-gray-100 dark:bg-gray-700 inline-block px-4 py-1 rounded-full border dark:border-gray-600">
              {activePeriod.label} ({formatDate(activePeriod.start)} to {formatDate(activePeriod.end)})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg print:border print:border-gray-200 border dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Sessions Recorded:</span>
                  <span className="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm border dark:border-gray-700">{activePeriodSessions.length}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-2">
                  <span className="text-gray-800 dark:text-gray-200 font-bold">Total Actual Salary:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    {activePeriodSessions.reduce((sum, s) => sum + s.price, 0)} EGP
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg print:border print:border-gray-200 border dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Breakdown by Level</h3>
              <div className="space-y-2">
                {Object.keys(levelsData).map(level => {
                  const count = activePeriodSessions.filter(s => s.level === level).length;
                  const sum = count * (levelsData[level]?.price || 0);
                  return (
                    <div key={level} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded shadow-sm border dark:border-gray-700">
                      <span style={getLevelStyle(level, levelsData)} className="font-bold px-2 py-0.5 rounded text-xs w-auto pe-4">Level {level}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count} sessions</span>
                      <span className="font-bold text-gray-900 dark:text-white text-right w-24">{sum} EGP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Detailed Session Log</h3>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Group Code</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Level</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[...activePeriodSessions].sort((a,b) => new Date(a.date) - new Date(b.date)).map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-mono font-bold break-all">{s.groupName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span style={getLevelStyle(s.level, levelsData)} className="px-2 py-1 rounded text-xs font-bold">{s.level}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-bold text-right">{s.price} EGP</td>
                </tr>
              ))}
              {activePeriodSessions.length === 0 && (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 font-medium">No sessions recorded in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 pb-12 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 print:hidden sticky top-0 z-20 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center sm:h-16 gap-4 py-4 sm:py-0">
            <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-sm">
                  <Users size={22} />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white">TeachFlow</span>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 sm:hidden rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            
            <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-2 sm:pb-0">
              <NavButton icon={<Home size={18} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavButton icon={<PlusCircle size={18} />} label="Groups" isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
              <NavButton icon={<Clock size={18} />} label="Schedules" isActive={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')} />
              <NavButton icon={<Calendar size={18} />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              <NavButton icon={<FileText size={18} />} label="Report" isActive={activeTab === 'report'} onClick={() => setActiveTab('report')} />
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2 hidden sm:block"></div>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="hidden sm:flex p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
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
        <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white animate-fade-in-up print:hidden z-50 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900'
        }`}>
          {toast.type === 'error' ? <XCircle size={22} /> : <CheckCircle size={22} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
      isActive 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const LevelsManager = ({ levelsData, onAdd, onEdit, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  
  const [editingKey, setEditingKey] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editFromDate, setEditFromDate] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd(newName, newPrice, newColor);
    setNewName('');
    setNewPrice('');
    setNewColor('#3b82f6');
  };

  const startEdit = (key, data) => {
    setEditingKey(key);
    setEditName(key);
    setEditPrice(data.price);
    setEditColor(data.color || '#3b82f6');
    setEditFromDate('');
  };

  const saveEdit = () => {
    onEdit(editingKey, editName, editPrice, editColor, editFromDate);
    setEditingKey(null);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-xl shadow-sm p-6 text-white transition-colors">
      <h3 className="text-lg font-semibold mb-4 text-gray-100 flex items-center gap-2">
        <DollarSign size={20} className="text-yellow-400"/>
        Level Definitions, Colors & Prices
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(levelsData).map(([level, data]) => (
          <div key={level} className="bg-white/10 p-4 rounded-lg flex flex-col gap-3 backdrop-blur-sm border border-white/10">
            {editingKey === level ? (
              <div className="flex flex-col gap-2">
                <input 
                  type="text" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())}
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded outline-none font-bold text-sm uppercase" placeholder="Level Name"
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded outline-none font-bold text-sm" placeholder="Price"
                  />
                  <input 
                    type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer p-0 border-0" title="Select Level Color"
                  />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Apply price from (Optional):</label>
                  <input 
                    type="date" value={editFromDate} onChange={e => setEditFromDate(e.target.value)} 
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded outline-none font-mono text-xs focus:border-blue-400 border border-transparent" 
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={saveEdit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 rounded transition-colors">Save</button>
                  <button onClick={() => setEditingKey(null)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold py-1.5 rounded transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: data.color || '#6b7280' }}></div>
                    <span className="font-bold text-xl">{level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-yellow-300">{data.price}</span>
                    <span className="text-xs text-gray-300">EGP</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => startEdit(level, data)} className="text-blue-300 hover:text-white transition-colors"><Edit size={16}/></button>
                  <button onClick={() => onDelete(level)} className="text-red-300 hover:text-white transition-colors"><Trash2 size={16}/></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end bg-black/20 p-4 rounded-lg border border-white/5">
        <div className="flex-1 w-full sm:w-1/3">
          <label className="block text-xs font-bold text-gray-300 mb-1">New Level Name</label>
          <input 
            type="text" required value={newName} onChange={e => setNewName(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-gray-600 bg-white/10 text-white px-3 py-2 outline-none uppercase font-bold focus:border-blue-400 transition-colors"
            placeholder="e.g., Q4, PRIMARY..."
          />
        </div>
        <div className="w-full sm:w-28">
          <label className="block text-xs font-bold text-gray-300 mb-1">Price (EGP)</label>
          <input 
            type="number" required value={newPrice} onChange={e => setNewPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-white/10 text-white px-3 py-2 outline-none font-bold focus:border-blue-400 transition-colors"
            placeholder="0"
          />
        </div>
        <div className="w-full sm:w-20">
          <label className="block text-xs font-bold text-gray-300 mb-1">Color</label>
          <input 
            type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
            className="w-full h-[42px] rounded-lg cursor-pointer bg-transparent border-0 p-0"
          />
        </div>
        <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-[10px] rounded-lg hover:bg-blue-500 font-bold transition-colors">
          Add Level
        </button>
      </form>
    </div>
  );
};

const AddGroupForm = ({ onAdd, levelsData }) => {
  const [code, setCode] = useState('');
  const availableLevels = Object.keys(levelsData);
  const [level, setLevel] = useState(availableLevels.length > 0 ? availableLevels[0] : '');

  useEffect(() => {
    if (!availableLevels.includes(level) && availableLevels.length > 0) {
      setLevel(availableLevels[0]);
    }
  }, [availableLevels, level]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || !level) return;
    onAdd({
      name: code.trim(), 
      code: code.trim(),
      level,
      price: levelsData[level]?.price || 0
    });
    setCode('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Group Code</label>
        <input 
          type="text" required
          value={code} onChange={e => setCode(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono transition-colors"
          placeholder="e.g., 3C.SR.PRI.Q2..."
        />
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Level</label>
        <select 
          required
          value={level} onChange={e => setLevel(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-colors"
        >
          {availableLevels.length === 0 && <option value="" disabled>No Levels</option>}
          {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <button 
        type="submit" disabled={availableLevels.length === 0}
        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-sm disabled:opacity-50"
      >
        Save Group
      </button>
    </form>
  );
};

const GroupsTable = ({ groups, onDelete, onUpdate, levelsData }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editFromDate, setEditFromDate] = useState('');
  const availableLevels = Object.keys(levelsData);

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditData({ code: group.code, level: group.level, price: group.price });
    setEditFromDate('');
  };

  const saveEdit = (id) => {
    onUpdate(id, { name: editData.code, ...editData }, editFromDate);
    setEditingId(null);
  };

  if (groups.length === 0) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">No groups registered yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-t dark:border-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Group Code</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Level</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Price</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {groups.map(g => (
            <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 dark:text-blue-400 font-bold">
                {editingId === g.id ? (
                  <input type="text" value={editData.code} onChange={e => setEditData({...editData, code: e.target.value.toUpperCase()})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-full" />
                ) : g.code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {editingId === g.id ? (
                  <select 
                    value={editData.level} 
                    onChange={e => setEditData({...editData, level: e.target.value, price: levelsData[e.target.value]?.price || 0})} 
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1"
                  >
                    {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : <span style={getLevelStyle(g.level, levelsData)} className="px-2.5 py-1 rounded-md text-xs font-bold">{g.level}</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-bold">
                {editingId === g.id ? (
                  <div className="flex flex-col gap-2">
                    <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: parseInt(e.target.value)})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-28 text-center" />
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Apply from:</label>
                      <input type="date" value={editFromDate} onChange={e=>setEditFromDate(e.target.value)} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-xs w-28 font-normal" title="Apply price retroactively from date" />
                    </div>
                  </div>
                ) : `${g.price} EGP`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === g.id ? (
                  <button onClick={() => saveEdit(g.id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold mr-4">Save</button>
                ) : (
                  <button onClick={() => startEdit(g)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg">
                    <Edit size={18} />
                  </button>
                )}
                <button onClick={() => onDelete(g.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg">
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
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Group</label>
        <select 
          required
          value={groupId} 
          onChange={e => setGroupId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors"
        >
          <option value="" disabled>-- Select --</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Day</label>
        <select 
          value={day} 
          onChange={e => setDay(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors"
        >
          {DAYS_OF_WEEK.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time</label>
        <input 
          type="time" 
          required
          value={time} 
          onChange={e => setTime(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-colors"
        />
      </div>
      <button 
        type="submit"
        disabled={groups.length === 0}
        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
      >
        Save Schedule
      </button>
    </form>
  );
};

const InteractiveScheduleView = ({ schedules, groups, onDelete, onUpdate, levelsData }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ time: '', day: '' });

  const daySchedules = schedules
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditData({ time: schedule.time, day: schedule.day });
  };

  const saveEdit = (id) => {
    onUpdate(id, editData);
    setEditingId(null);
    if(editData.day !== selectedDay) setSelectedDay(editData.day);
  };

  return (
    <div>
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedDay === day 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {day}
            <span className={`px-2 py-0.5 rounded-md text-xs ${
              selectedDay === day ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {schedules.filter(s => s.day === day).length}
            </span>
          </button>
        ))}
      </div>

      {daySchedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Clock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No schedules recorded for {selectedDay}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {daySchedules.map(s => {
            const group = groups.find(g => g.id === s.groupId);
            return (
              <div key={s.id} className="flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative group">
                {editingId === s.id ? (
                  <div className="space-y-3 mb-2">
                     <div className="flex gap-2">
                       <select value={editData.day} onChange={e => setEditData({...editData, day: e.target.value})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-1 w-full text-sm">
                         {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <input type="time" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-1 w-full text-sm font-mono"/>
                     </div>
                     <button onClick={() => saveEdit(s.id)} className="w-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold py-1 rounded">Save Changes</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <Clock size={18} className="mr-2" />
                      <span>{formatTime(s.time)}</span>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(s)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5"><Edit size={16} /></button>
                      <button onClick={() => onDelete(s.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-gray-900 dark:text-white font-mono font-bold text-lg mb-2 break-all">
                    {group ? group.name : 'Unknown Group'}
                  </h4>
                  {group && (
                    <span style={getLevelStyle(group.level, levelsData)} className="inline-block px-2.5 py-1 rounded-md text-xs font-bold">
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

const QuickAddSession = ({ onAdd, levelsData }) => {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative w-full">
        <input 
          type="text"
          value={code} 
          onChange={e => setCode(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-12 pr-4 py-4 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 outline-none uppercase text-xl font-mono shadow-sm transition-all"
          placeholder="Paste Smart Code or Group Code..."
          autoFocus
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Calendar className="text-gray-400 dark:text-gray-500" size={24} />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-bold transition-colors"
        />
        <button 
          type="submit"
          disabled={Object.keys(levelsData).length === 0}
          className="flex-1 bg-gray-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 font-bold shadow-sm whitespace-nowrap text-lg transition-colors disabled:opacity-50"
        >
          Save Session
        </button>
      </div>
    </form>
  );
};

const SessionTable = ({ sessions, onDelete, onUpdate, levelsData }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ date: '', level: '', price: 0 });
  const availableLevels = Object.keys(levelsData);

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
    return <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50 rounded-xl">No sessions recorded in this period.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Group</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Level</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Price</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {[...sessions].sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {editingId === s.id ? (
                  <input type="datetime-local" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 focus:ring-2 outline-none font-mono text-xs"/>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-bold">{formatDate(s.date)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(s.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{s.groupName}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {editingId === s.id ? (
                  <select 
                    value={editData.level} 
                    onChange={e => setEditData({...editData, level: e.target.value, price: levelsData[e.target.value]?.price || 0})} 
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 font-bold"
                  >
                    {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <span style={getLevelStyle(s.level, levelsData)} className="px-2.5 py-1 rounded text-xs font-bold">
                    {s.level}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                {editingId === s.id ? (
                  <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: parseInt(e.target.value)})} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-24 text-center" />
                ) : `${s.price} EGP`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === s.id ? (
                  <button onClick={() => saveEdit(s.id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold mr-4 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Save</button>
                ) : (
                  <button onClick={() => startEdit(s)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg">
                    <Edit size={18} />
                  </button>
                )}
                <button onClick={() => onDelete(s.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg">
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
  const headers = ['Date', 'Time', 'Group Code', 'Level', 'Price (EGP)'];
  
  const rows = [...sessions]
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .map(s => {
      const d = new Date(s.date);
      return [
        d.toLocaleDateString('en-GB'),
        d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
        `"${s.groupName}"`,
        s.level,
        s.price
      ];
    });

  const totalSalary = sessions.reduce((sum, s) => sum + s.price, 0);
  rows.push(['', '', '', 'Total Sessions', sessions.length]);
  rows.push(['', '', '', 'Total Salary', totalSalary]);

  const csvContent = [
    `Report Period: ${period.label}`,
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `Report_${period.label.replace(/ /g, '_')}.csv`;
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};