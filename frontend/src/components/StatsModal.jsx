import { PieChart, X, Calendar } from 'lucide-react';

const StatsModal = ({ isOpen, onClose, stats, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}`} 
      onClick={onClose}
    >
      <div 
        className={`p-8 rounded-2xl w-full max-w-2xl shadow-2xl transition transform scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar
        ${isDarkMode ? 'bg-slate-900 text-gray-200' : 'bg-white text-gray-800'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PieChart className="text-blue-500" /> Family Insights
          </h2>
          <button 
            onClick={onClose} 
            className={`hover:text-red-500 transition ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* 1. Demographics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl text-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
            <div className="text-3xl font-bold text-blue-500">{stats.total}</div>
            <div className="text-xs uppercase tracking-wide opacity-70">Members</div>
          </div>
          <div className={`p-4 rounded-xl text-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-100'}`}>
            <div className="text-3xl font-bold text-green-500">{stats.living}</div>
            <div className="text-xs uppercase tracking-wide opacity-70">Living</div>
          </div>
          <div className={`p-4 rounded-xl text-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className="text-3xl font-bold text-gray-500">{stats.deceased}</div>
            <div className="text-xs uppercase tracking-wide opacity-70">Deceased</div>
          </div>
          <div className={`p-4 rounded-xl text-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-purple-50 border-purple-100'}`}>
            <div className="text-3xl font-bold text-purple-500">{stats.topZodiac?.sign || '-'}</div>
            <div className="text-xs uppercase tracking-wide opacity-70">Top Zodiac</div>
          </div>
        </div>

        {/* 2. Gender Split Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm opacity-80 mb-2 font-medium">
            <span>Gender Distribution</span>
            <span>{stats.male}M / {stats.female}F {stats.other > 0 && `/ ${stats.other}O`}</span>
          </div>
          <div className={`w-full rounded-full h-4 overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.male / stats.total) * 100 : 0}%` }} title="Male"></div>
            <div className="h-full bg-pink-500" style={{ width: `${stats.total ? (stats.female / stats.total) * 100 : 0}%` }} title="Female"></div>
            <div className="h-full bg-yellow-500" style={{ width: `${stats.total ? (stats.other / stats.total) * 100 : 0}%` }} title="Other"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 3. Birthdays This Month */}
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-red-500"/> Birthdays (This Month)</h3>
            {stats.upcomingBirthdays?.length === 0 ? (
              <p className="text-sm opacity-60 italic">No birthdays this month.</p>
            ) : (
              <ul className="space-y-3">
                {stats.upcomingBirthdays.map((b, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-0 last:pb-0 border-gray-300 dark:border-gray-600">
                    <span className="font-medium">{b.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-white border text-gray-600'}`}>
                      Turning {b.age} on {b.day}th
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 4. Decade Breakdown */}
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <h3 className="font-bold mb-4">Born in Era</h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(stats.decadeCounts || {})
                .sort((a, b) => b[0] - a[0]) // Sort years descending
                .map(([decade, count]) => (
                <div key={decade} className="flex items-center gap-3 text-sm">
                  <span className="w-12 font-mono opacity-70">{decade}s</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                  </div>
                  <span className="w-6 text-right font-bold">{count}</span>
                </div>
              ))}
              {Object.keys(stats.decadeCounts || {}).length === 0 && <p className="text-sm opacity-60 italic">No birth dates available.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatsModal;