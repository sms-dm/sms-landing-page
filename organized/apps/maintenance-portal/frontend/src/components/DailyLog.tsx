import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiSave, FiFilter, FiClock, FiAlertCircle, FiTool, FiShield, FiMessageSquare, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface DailyLogEntry {
  id: string;
  date: string;
  category: 'equipment' | 'maintenance' | 'safety' | 'general';
  title: string;
  description: string;
  importantForHandover: boolean;
  timestamp: string;
}

interface DailyLogProps {
  isOpen: boolean;
  onClose: () => void;
  rotation?: {
    startDate: string;
    endDate: string;
  };
}

const DailyLog: React.FC<DailyLogProps> = ({ isOpen, onClose, rotation }) => {
  const [entries, setEntries] = useState<DailyLogEntry[]>(() => {
    const saved = localStorage.getItem('sms_daily_log_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    category: 'general' as DailyLogEntry['category'],
    title: '',
    description: '',
    importantForHandover: false
  });

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sms_daily_log_entries', JSON.stringify(entries));
  }, [entries]);

  // Get all dates in the current swing period
  const getSwingDates = () => {
    if (!rotation) return [];
    
    const dates = [];
    const start = new Date(rotation.startDate);
    const end = new Date(rotation.endDate);
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.filter(entry => entry.date === dateStr);
  };

  // Check if a date has entries
  const hasEntries = (date: Date) => {
    return getEntriesForDate(date).length > 0;
  };

  // Get category icon and color
  const getCategoryStyle = (category: DailyLogEntry['category']) => {
    switch (category) {
      case 'equipment':
        return { icon: FiAlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' };
      case 'maintenance':
        return { icon: FiTool, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' };
      case 'safety':
        return { icon: FiShield, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/30' };
      case 'general':
        return { icon: FiMessageSquare, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600' };
    }
  };

  // Add new entry
  const handleAddEntry = () => {
    if (!newEntry.title.trim() || !newEntry.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const entry: DailyLogEntry = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      category: newEntry.category,
      title: newEntry.title.trim(),
      description: newEntry.description.trim(),
      importantForHandover: newEntry.importantForHandover,
      timestamp: new Date().toISOString()
    };

    setEntries(prev => [...prev, entry]);
    setNewEntry({
      category: 'general',
      title: '',
      description: '',
      importantForHandover: false
    });
    setShowEntryForm(false);
    toast.success('Log entry added successfully');
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Entry deleted');
  };

  // Filter entries by category
  const filteredEntries = selectedCategory === 'all' 
    ? getEntriesForDate(selectedDate)
    : getEntriesForDate(selectedDate).filter(entry => entry.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-sms-dark border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiCalendar className="w-6 h-6 text-sms-cyan" />
              <h2 className="text-xl font-semibold text-white">Daily Log</h2>
              <span className="text-sm text-gray-400">
                {entries.length} entries total
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Sidebar */}
          <div className="w-80 border-r border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Swing Period Calendar</h3>
            <div className="space-y-2">
              {getSwingDates().map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const dateHasEntries = hasEntries(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-sms-cyan/20 border border-sms-cyan/30' 
                        : 'hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${
                          isSelected ? 'text-sms-cyan' : 'text-white'
                        }`}>
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {isToday && (
                          <p className="text-xs text-sms-cyan">Today</p>
                        )}
                      </div>
                      {dateHasEntries && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-sms-cyan rounded-full"></div>
                          <span className="text-xs text-gray-400">
                            {getEntriesForDate(date).length}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Date Header & Actions */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {filteredEntries.length} entries for this date
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Category Filter */}
                  <div className="flex items-center space-x-2">
                    <FiFilter className="w-4 h-4 text-gray-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-sms-cyan"
                    >
                      <option value="all">All Categories</option>
                      <option value="equipment">Equipment Issues</option>
                      <option value="maintenance">Maintenance Performed</option>
                      <option value="safety">Safety Observations</option>
                      <option value="general">General Notes</option>
                    </select>
                  </div>
                  
                  {/* Add Entry Button */}
                  <button
                    onClick={() => setShowEntryForm(true)}
                    className="px-4 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg text-sms-cyan hover:bg-sms-cyan/30 transition-all flex items-center space-x-2"
                  >
                    <FiSave className="w-4 h-4" />
                    <span>Add Entry</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Entries List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FiCalendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No entries for this date</p>
                  <button
                    onClick={() => setShowEntryForm(true)}
                    className="mt-4 text-sm text-sms-cyan hover:text-white transition-colors"
                  >
                    Add your first entry →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => {
                    const style = getCategoryStyle(entry.category);
                    const Icon = style.icon;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`${style.bg} border ${style.border} rounded-lg p-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Icon className={`w-5 h-5 ${style.color} mt-0.5`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-white font-semibold">{entry.title}</h4>
                                {entry.importantForHandover && (
                                  <div className="flex items-center space-x-1 bg-amber-900/30 border border-amber-500/30 px-2 py-0.5 rounded">
                                    <FiStar className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs text-amber-400">Important for handover</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{entry.description}</p>
                              <div className="flex items-center space-x-4 mt-3">
                                <span className="text-xs text-gray-500 flex items-center space-x-1">
                                  <FiClock className="w-3 h-3" />
                                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                </span>
                                <span className={`text-xs ${style.color} capitalize`}>
                                  {entry.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors ml-4"
                            title="Delete entry"
                          >
                            <FiX className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-sms-dark border border-gray-700 rounded-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">New Log Entry</h3>
                <button
                  onClick={() => setShowEntryForm(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value as DailyLogEntry['category'] }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                  >
                    <option value="equipment">Equipment Issues</option>
                    <option value="maintenance">Maintenance Performed</option>
                    <option value="safety">Safety Observations</option>
                    <option value="general">General Notes</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title/Summary
                  </label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief summary of the entry"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed information..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan resize-none"
                    rows={4}
                  />
                </div>

                {/* Important for Handover */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="importantForHandover"
                    checked={newEntry.importantForHandover}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, importantForHandover: e.target.checked }))}
                    className="w-4 h-4 text-sms-cyan bg-gray-800 border-gray-600 rounded focus:ring-sms-cyan"
                  />
                  <label htmlFor="importantForHandover" className="text-sm text-gray-300 flex items-center space-x-2">
                    <FiStar className="w-4 h-4 text-amber-400" />
                    <span>Mark as important for handover</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEntryForm(false)}
                  className="flex-1 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  className="flex-1 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg text-sms-cyan hover:bg-sms-cyan/30 transition-all font-semibold"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLog;