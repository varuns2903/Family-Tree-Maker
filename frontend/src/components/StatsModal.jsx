import { PieChart, X, Calendar, Activity, Ghost, Users } from 'lucide-react';

const StatsModal = ({ isOpen, onClose, stats, isDarkMode }) => {
  if (!isOpen) return null;

  // Helper for conditional classes
  const cardBaseClass = `p-4 rounded-2xl border text-center transition-all hover:scale-[1.02] ${
    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
  }`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className={`p-8 rounded-3xl w-full max-w-3xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto custom-scrollbar transform transition-all scale-100
          ${isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <PieChart className="text-blue-500" size={24} />
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

        {/* 1. Demographics Grid - UPDATED to 3 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          
          {/* Total */}
          <div className={`${cardBaseClass} ${!isDarkMode && 'border-blue-100 bg-blue-50/30'}`}>
            <div className="text-3xl font-extrabold text-blue-500 mb-1">{stats.total}</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-blue-700/60'}`}>
              <Users size={12} /> Members
            </div>
          </div>

          {/* Living */}
          <div className={`${cardBaseClass} ${!isDarkMode && 'border-green-100 bg-green-50/30'}`}>
            <div className="text-3xl font-extrabold text-green-500 mb-1">{stats.living}</div>
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-green-700/60'}`}>
              <Activity size={12} /> Living
            </div>
          </div>

          {/* Deceased */}
          <div className={`${cardBaseClass} ${!isDarkMode && 'border-slate-200 bg-slate-50'}`}>
            <div className="text-3xl font-extrabold text-slate-500 mb-1">{stats.deceased}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
              <Ghost size={12} /> Deceased
            </div>
          </div>
        </div>

        {/* 2. Gender Split Bar */}
        <div className="mb-10">
          <div className={`flex justify-between text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Gender Distribution</span>
            <span>
              <span className="text-blue-500">{stats.male}M</span> / <span className="text-pink-500">{stats.female}F</span>
              {stats.other > 0 && <span className="text-amber-500"> / {stats.other}O</span>}
            </span>
          </div>
          <div className={`w-full rounded-full h-3 overflow-hidden flex shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.male / stats.total) * 100 : 0}%` }} title="Male"></div>
            <div className="h-full bg-pink-500" style={{ width: `${stats.total ? (stats.female / stats.total) * 100 : 0}%` }} title="Female"></div>
            <div className="h-full bg-amber-500" style={{ width: `${stats.total ? (stats.other / stats.total) * 100 : 0}%` }} title="Other"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 3. Birthdays This Month */}
          <div className={`p-6 rounded-2xl border flex flex-col h-[300px] 
            ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'}`}>
                <Calendar size={16} /> 
              </div>
              Birthdays (This Month)
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {stats.upcomingBirthdays?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 text-sm">
                  <Calendar size={32} className="mb-2 opacity-50" />
                  No upcoming birthdays.
                </div>
              ) : (
                <ul className="space-y-3">
                  {stats.upcomingBirthdays.map((b, i) => (
                    <li key={i} className={`flex justify-between items-center text-sm p-3 rounded-xl transition
                      ${isDarkMode ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <span className="font-semibold">{b.name}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold
                        ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600 shadow-sm'}`}>
                        Turning {b.age} on {b.day}th
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 4. Decade Breakdown */}
          <div className={`p-6 rounded-2xl border flex flex-col h-[300px]
            ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                <Activity size={16} /> 
              </div>
              Born in Era
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {Object.entries(stats.decadeCounts || {})
                .sort((a, b) => b[0] - a[0]) // Sort years descending
                .map(([decade, count]) => (
                <div key={decade} className="flex items-center gap-3 text-sm">
                  <span className={`w-12 font-mono text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {decade}s
                  </span>
                  <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                  </div>
                  <span className={`w-6 text-right font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.decadeCounts || {}).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-50 text-sm">
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