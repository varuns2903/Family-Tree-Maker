import { PieChart, X, Calendar, Activity, Ghost, Users, Heart, Gift } from 'lucide-react';

const StatsModal = ({ isOpen, onClose, stats, onNodeClick }) => {
  if (!isOpen) return null;

  const isDarkMode = document.documentElement.classList.contains('dark');

  // Common card style
  const cardBaseClass = `p-4 rounded-2xl border text-center transition-transform hover:scale-[1.02] cursor-default ${
    isDarkMode 
      ? 'bg-slate-800/50 border-slate-700 shadow-sm' 
      : 'bg-white border-slate-100 shadow-md'
  }`;

  // Get current month name (e.g., "OCT")
  const currentMonthShort = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();

  // Helper for ordinal suffix (1st, 2nd, 3rd, 4th)
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className={`p-5 sm:p-8 rounded-3xl w-[95%] sm:w-full max-w-3xl shadow-2xl m-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar transform transition-all scale-100
          ${isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex justify-between items-center mb-6 sm:mb-8 pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <PieChart size={24} />
            </div>
            Family Insights
          </h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* 1. Demographics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          
          {/* Total Members */}
          <div className={`col-span-2 sm:col-span-1 ${cardBaseClass} ${!isDarkMode && 'border-blue-100 bg-blue-50/50'}`}>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-500 mb-1">{stats.total}</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-blue-700/60'}`}>
              <Users size={14} /> Members
            </div>
          </div>

          {/* Living */}
          <div className={`${cardBaseClass} ${!isDarkMode && 'border-green-100 bg-green-50/50'}`}>
            <div className="text-3xl sm:text-4xl font-extrabold text-green-500 mb-1">{stats.living}</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-green-700/60'}`}>
              <Activity size={14} /> Living
            </div>
          </div>

          {/* Deceased */}
          <div className={`${cardBaseClass} ${!isDarkMode && 'border-slate-200 bg-slate-50'}`}>
            <div className={`text-3xl sm:text-4xl font-extrabold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stats.deceased}</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Ghost size={14} /> Deceased
            </div>
          </div>
        </div>

        {/* 2. Gender Split Bar */}
        <div className={`mb-8 sm:mb-10 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className={`flex justify-between text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Gender Distribution</span>
            <span className="flex gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {stats.male}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> {stats.female}</span>
              {stats.other > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {stats.other}</span>}
            </span>
          </div>
          <div className={`w-full rounded-full h-4 overflow-hidden flex shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.male / stats.total) * 100 : 0}%` }}></div>
            <div className="h-full bg-pink-500" style={{ width: `${stats.total ? (stats.female / stats.total) * 100 : 0}%` }}></div>
            <div className="h-full bg-amber-500" style={{ width: `${stats.total ? (stats.other / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 3. Celebrations (UPDATED UI) */}
          <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col h-[360px] 
            ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                <Gift size={18} /> 
              </div>
              Celebrations (This Month)
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {(!stats.upcomingEvents || stats.upcomingEvents.length === 0) ? (
                <div className={`h-full flex flex-col items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Calendar size={48} className="mb-3 opacity-20" />
                  No upcoming birthdays or anniversaries.
                </div>
              ) : (
                <ul className="space-y-3">
                  {stats.upcomingEvents.map((evt, i) => (
                    <li 
                        key={i} 
                        onClick={() => onNodeClick(evt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer group border
                        ${isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600' 
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-blue-100'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                          {/* Icon Circle */}
                          <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${evt.type === 'birthday' 
                              ? (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600')
                              : (isDarkMode ? 'bg-pink-900/50 text-pink-400' : 'bg-pink-100 text-pink-600')
                          }`}>
                              {evt.type === 'birthday' ? <Gift size={18} /> : <Heart size={18} />}
                          </div>
                          
                          {/* Text Info */}
                          <div className="overflow-hidden">
                              <span className={`block font-bold text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {evt.name}
                              </span>
                              <span className={`text-xs font-medium block truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {evt.type === 'birthday' 
                                    ? `Turning ${evt.age}` 
                                    : `${getOrdinal(evt.years)} Anniversary`}
                              </span>
                          </div>
                      </div>
                      
                      {/* Date Badge (Calendar Leaf Style) */}
                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border flex-shrink-0 ml-3 shadow-sm
                        ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                          <span className="text-[9px] font-bold text-red-500 uppercase leading-none mb-0.5">
                            {currentMonthShort}
                          </span>
                          <span className={`text-lg font-bold leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {evt.day}
                          </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 4. Decade Breakdown */}
          <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col h-[360px]
            ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Activity size={18} /> 
              </div>
              Born in Era
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {Object.entries(stats.decadeCounts || {})
                .sort((a, b) => b[0] - a[0]) 
                .map(([decade, count]) => (
                <div key={decade} className="flex items-center gap-3 text-sm group">
                  <span className={`w-12 font-mono text-xs font-bold ${isDarkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                    {decade}s
                  </span>
                  <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                  </div>
                  <span className={`w-6 text-right font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.decadeCounts || {}).length === 0 && (
                <div className={`h-full flex flex-col items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  No birth date data available.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatsModal;