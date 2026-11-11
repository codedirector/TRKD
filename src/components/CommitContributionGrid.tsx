import React, { useState, useMemo } from 'react';
import { GitCommit, Eye, Flame, Trophy, Calendar, Sparkles, Filter, ChevronRight, Layers } from 'lucide-react';
import type { ContributionStats, DayContribution, ContributionActivityItem } from '../types';

interface CommitContributionGridProps {
  contributions: ContributionStats | null;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

type ActivityFilter = 'all' | 'commits' | 'views';
type ThemeMode = 'github' | 'trackd';

const GITHUB_COLORS = {
  0: 'bg-[#ebedf0] border-black/15 hover:border-black',
  1: 'bg-[#9be9a8] border-black/30 hover:border-black',
  2: 'bg-[#40c463] border-black/40 hover:border-black',
  3: 'bg-[#30a14e] border-black/50 hover:border-black',
  4: 'bg-[#216e39] border-black/60 hover:border-black'
};

const TRACKD_COLORS = {
  0: 'bg-neutral-100 border-black/15 hover:border-black',
  1: 'bg-[#FFDE59]/60 border-black/30 hover:border-black',
  2: 'bg-[#FFDE59] border-black/40 hover:border-black',
  3: 'bg-[#FF7A00] border-black/50 hover:border-black text-white',
  4: 'bg-[#D94F00] border-black/60 hover:border-black text-white'
};

export const CommitContributionGrid: React.FC<CommitContributionGridProps> = ({
  contributions,
  loading = false,
  className = ''
}) => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [theme, setTheme] = useState<ThemeMode>('github');
  const [hoveredDay, setHoveredDay] = useState<{
    day: DayContribution;
    x: number;
    y: number;
  } | null>(null);

  // Group days into 7-day columns (weeks)
  const { weeks, monthHeaders, filteredTotal } = useMemo(() => {
    if (!contributions || !contributions.days.length) {
      return { weeks: [], monthHeaders: [], filteredTotal: 0 };
    }

    const allDays = contributions.days;
    const weekCols: DayContribution[][] = [];
    let currentWeek: DayContribution[] = [];

    allDays.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === allDays.length - 1) {
        weekCols.push(currentWeek);
        currentWeek = [];
      }
    });

    // Detect month transitions to place header labels along top
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = '';

    weekCols.forEach((week, colIdx) => {
      if (!week || week.length === 0) return;
      const firstDay = week[0];
      const dateObj = new Date(firstDay.date + 'T00:00:00');
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'short' });

      if (monthLabel !== lastMonth) {
        months.push({ label: monthLabel, colIndex: colIdx });
        lastMonth = monthLabel;
      }
    });

    // Calculate filtered count
    let total = 0;
    allDays.forEach(d => {
      if (filter === 'all') total += d.total;
      else if (filter === 'commits') total += d.commits;
      else if (filter === 'views') total += d.views;
    });

    return { weeks: weekCols, monthHeaders: months, filteredTotal: total };
  }, [contributions, filter]);

  // Compute level for a day based on active filter
  const getDayLevel = (day: DayContribution): 0 | 1 | 2 | 3 | 4 => {
    const count = filter === 'all' 
      ? day.total 
      : filter === 'commits' 
        ? day.commits 
        : day.views;

    if (count <= 0) return 0;
    if (filter === 'commits') {
      if (count === 1) return 1;
      if (count === 2) return 2;
      if (count <= 4) return 3;
      return 4;
    }
    if (filter === 'views') {
      if (count <= 2) return 1;
      if (count <= 5) return 2;
      if (count <= 8) return 3;
      return 4;
    }
    // Default all
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 7) return 3;
    return 4;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const palette = theme === 'github' ? GITHUB_COLORS : TRACKD_COLORS;

  return (
    <div 
      id="commit-contribution-widget"
      className={`bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_#000] relative space-y-4 ${className}`}
    >
      {/* Top Header: Title, Description, and Action Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-[#FFDE59] border border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000]">
              <GitCommit className="w-4 h-4 text-black stroke-[2.5]" />
            </span>
            <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
              Resume Commit & Signal Activity
            </h3>
          </div>
          <p className="text-xs text-neutral-600 font-medium">
            GitHub-style activity frequency for your document versions, PDF updates, and recruiter view signals.
          </p>
        </div>

        {/* Filter Pills and Theme Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Activity Type Filters */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-lg border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'all' 
                  ? 'bg-[#FFDE59] text-black font-black shadow-[1px_1px_0px_0px_#000]' 
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              All Signals
            </button>
            <button
              onClick={() => setFilter('commits')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'commits' 
                  ? 'bg-[#FFDE59] text-black font-black shadow-[1px_1px_0px_0px_#000]' 
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Commits
            </button>
            <button
              onClick={() => setFilter('views')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'views' 
                  ? 'bg-[#FFDE59] text-black font-black shadow-[1px_1px_0px_0px_#000]' 
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Views
            </button>
          </div>

          {/* Theme Palette Toggle */}
          <button
            onClick={() => setTheme(theme === 'github' ? 'trackd' : 'github')}
            title="Switch color palette (GitHub Classic vs Trackd Flame)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-neutral-50 text-xs font-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
          >
            <span className={`w-2.5 h-2.5 rounded-full border border-black ${theme === 'github' ? 'bg-[#30a14e]' : 'bg-[#FF7A00]'}`} />
            <span className="font-mono text-[11px]">{theme === 'github' ? 'GH Green' : 'Trackd Orange'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar: Streaks, Totals, Active Days */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">Total In Period</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-black">{filteredTotal}</span>
            <span className="text-xs font-semibold text-neutral-600">
              {filter === 'commits' ? 'commits' : filter === 'views' ? 'views' : 'activities'}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#FF7A00] fill-[#FF7A00]" />
            <span>Current Streak</span>
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-black">
              {contributions?.currentStreak || 0}
            </span>
            <span className="text-xs font-semibold text-neutral-600">days</span>
          </div>
        </div>

        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-600" />
            <span>Longest Streak</span>
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-black">
              {contributions?.longestStreak || 0}
            </span>
            <span className="text-xs font-semibold text-neutral-600">days</span>
          </div>
        </div>

        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">Active Frequency</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-black">
              {contributions?.activeDaysCount || 0}
            </span>
            <span className="text-xs font-semibold text-neutral-600">active days</span>
          </div>
        </div>
      </div>

      {/* The Contribution Heatmap Grid */}
      <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-black border-t-[#FF7A00] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold text-neutral-600">Plotting contribution telemetry...</p>
          </div>
        ) : (
          <div className="inline-block min-w-full">
            {/* Months Header row */}
            <div className="flex items-center text-[10px] font-mono font-bold text-neutral-600 mb-1.5 pl-8">
              <div className="flex gap-[3.5px]">
                {weeks.map((_, colIdx) => {
                  const match = monthHeaders.find(m => m.colIndex === colIdx);
                  return (
                    <div 
                      key={colIdx} 
                      className="w-[13px] text-left shrink-0 overflow-visible whitespace-nowrap"
                    >
                      {match ? match.label : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Container with Day Labels on Left and Columns on Right */}
            <div className="flex gap-2">
              {/* Day of week labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[9px] font-mono font-bold text-neutral-500 pr-1 select-none h-[115px] pt-[2px]">
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>

              {/* Weekly Columns */}
              <div className="flex gap-[3.5px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3.5px]">
                    {week.map((day) => {
                      const level = getDayLevel(day);
                      const colorClass = palette[level];
                      const isToday = day.date === new Date().toISOString().split('T')[0];

                      return (
                        <div
                          key={day.date}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({
                              day,
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-[13px] h-[13px] rounded-[2.5px] border cursor-pointer transition-all duration-100 ${colorClass} ${
                            isToday ? 'ring-1.5 ring-black' : ''
                          }`}
                          title={`${day.total} contributions on ${day.date}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Details Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-black/10 text-xs">
        <div className="text-[11px] font-mono text-neutral-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>Rolling 26-week activity window ({contributions?.startDate || 'past 6 months'} → {contributions?.endDate || 'today'})</span>
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto text-[11px] font-mono font-bold text-neutral-600">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className={`w-[11px] h-[11px] rounded-[2px] border ${palette[0]}`} />
            <span className={`w-[11px] h-[11px] rounded-[2px] border ${palette[1]}`} />
            <span className={`w-[11px] h-[11px] rounded-[2px] border ${palette[2]}`} />
            <span className={`w-[11px] h-[11px] rounded-[2px] border ${palette[3]}`} />
            <span className={`w-[11px] h-[11px] rounded-[2px] border ${palette[4]}`} />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Interactive Tooltip Popover */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 8}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
          className="bg-black text-white p-3 rounded-xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.4)] max-w-xs text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-1.5">
            <span className="font-bold text-white">
              {new Date(hoveredDay.day.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-[#FFDE59] font-black">
              {hoveredDay.day.total} signal{hoveredDay.day.total !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-neutral-300">
            {hoveredDay.day.commits > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <GitCommit className="w-3 h-3 shrink-0" />
                <span>{hoveredDay.day.commits} version commit{hoveredDay.day.commits !== 1 ? 's' : ''}</span>
              </div>
            )}
            {hoveredDay.day.views > 0 && (
              <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                <Eye className="w-3 h-3 shrink-0" />
                <span>{hoveredDay.day.views} recruiter view{hoveredDay.day.views !== 1 ? 's' : ''}</span>
              </div>
            )}
            {hoveredDay.day.creates > 0 && (
              <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                <Layers className="w-3 h-3 shrink-0" />
                <span>{hoveredDay.day.creates} document/fork created</span>
              </div>
            )}
            {hoveredDay.day.total === 0 && (
              <p className="text-neutral-400 italic">No activity recorded on this day.</p>
            )}
          </div>

          {/* Sample recent activities preview */}
          {hoveredDay.day.activities && hoveredDay.day.activities.length > 0 && (
            <div className="pt-1 border-t border-neutral-800/80 space-y-0.5">
              {hoveredDay.day.activities.slice(0, 3).map((act, i) => (
                <div key={i} className="truncate text-[10px] text-neutral-400">
                  • <span className="text-neutral-200">{act.title}</span>
                </div>
              ))}
              {hoveredDay.day.activities.length > 3 && (
                <div className="text-[9px] text-neutral-500 italic">
                  +{hoveredDay.day.activities.length - 3} more event{hoveredDay.day.activities.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
