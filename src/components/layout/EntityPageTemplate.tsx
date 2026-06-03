import React, { ReactNode } from 'react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { StatCard, StatCardProps } from '@/components/data-display/StatCard';
import { Button } from '@/components/forms/Button';
import { SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FilterPanel } from './FilterPanel';

export interface EntityPageTemplateProps {
  title: string;
  headerActions?: ReactNode;

  stats?: StatCardProps[];

  filterGroups?: any[];
  selectedFilters?: Record<string, string[]>;
  onFilterChange?: (groupId: string, value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  activeFilterCount?: number;

  utilityBarExtra?: ReactNode;

  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  getTabCount?: (tab: string) => number | string;
  loading?: boolean;

  children: ReactNode;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const EntityPageTemplate: React.FC<EntityPageTemplateProps> = ({
  title,
  headerActions,
  stats,
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount = 0,
  utilityBarExtra,
  tabs,
  activeTab,
  onTabChange,
  getTabCount,
  loading = false,
  children
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <PageLayout
      title={title}
      isFullHeight
      showBackButton={false}
      actions={
        <div className="flex items-center gap-2">
          {filterGroups && (
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-lg font-bold"
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className={[
                  'inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black leading-none ml-1',
                  showFilters ? 'bg-white/25 text-white' : 'bg-brand-teal-600 text-white'
                ].join(' ')}>
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          {headerActions && filterGroups && (
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          )}
          {headerActions}
        </div>
      }
    >
      <div className="h-full flex flex-col space-y-4 overflow-hidden">

        {/* ── Utility bar: rendered as a full-width pill below the page title ── */}
        {utilityBarExtra && (
          <div className="flex-shrink-0 w-full">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 shadow-sm">
              {utilityBarExtra}
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        {stats && stats.length > 0 && (
          <motion.div
            className="grid grid-cols-2 xl:grid-cols-4 gap-3 flex-shrink-0"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="h-full">
                <StatCard {...stat} className="h-full" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Tab navigation ── */}
        {tabs && tabs.length > 0 && onTabChange && (
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar pb-px flex-shrink-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab;
              return (
                <Button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={[
                    'pb-3 pt-2 px-2 text-[14px] font-bold whitespace-nowrap relative transition-colors bg-transparent border-0 cursor-pointer outline-none flex items-center gap-2.5',
                    isActive
                      ? 'text-brand-teal-600 dark:text-brand-teal-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  ].join(' ')}
                >
                  {tab}
                  {getTabCount && (
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full transition-colors ${isActive ? 'bg-brand-teal-50 dark:bg-brand-teal-900/30 text-brand-teal-700 dark:text-brand-teal-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {getTabCount(tab)}
                    </span>
                  )}
                  {isActive && <motion.div layoutId="entityPageActiveTabIndicator" className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-teal-500 rounded-t-full" />}
                </Button>
              );
            })}
          </div>
        )}

        {/* ── Loading indicator ── */}
        {loading && (
          <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-full flex-shrink-0 -mt-2 mb-2">
            <motion.div
              className="h-full bg-brand-teal-500"
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "50%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* ── Main content area ── */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[var(--shadow-premium)] relative flex">
          <AnimatePresence initial={false}>
            {filterGroups && selectedFilters && onFilterChange && onClearFilters && showFilters && (
              <motion.div
                key="filter-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex-shrink-0 overflow-hidden"
                style={{ minWidth: 0 }}
              >
                <FilterPanel
                  groups={filterGroups}
                  selectedFilters={selectedFilters}
                  onFilterChange={onFilterChange}
                  onClear={onClearFilters}
                  className="w-[240px] h-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};
