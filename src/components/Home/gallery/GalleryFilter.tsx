import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Filter as FilterIcon, X } from 'lucide-react';
import type { GalleryFilterProps } from './types';

export default function GalleryFilter({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  sortOptions, 
  sortBy, 
  onSortChange,
  stateOptions = [],
  districtOptions = [],
  selectedStateId = '',
  selectedStateName = 'All', // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedDistrictId = '',
  selectedDistrictName = 'All', // eslint-disable-line @typescript-eslint/no-unused-vars
  onStateChange,
  onDistrictChange,
  events = [],
  selectedEvent = 'All',
  onEventChange,
  variant = 'desktop',
  onCloseMobile,
  className = ''
}: GalleryFilterProps) {
  const isMobile = variant === 'mobile';

  const sectionClasses = isMobile
    ? `fixed inset-0 z-50 bg-white/95 backdrop-blur-md overflow-y-auto md:hidden ${className}`
    : `py-2 bg-white/30 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100/50 ${className}`;

  const containerClasses = isMobile
    ? 'max-w-md mx-auto px-4 py-6 space-y-4'
    : 'container mx-auto px-4';

  const filterGroupClasses = isMobile
    ? 'flex flex-col gap-4'
    : 'flex flex-wrap justify-center items-center gap-2';

  const selectTriggerBase = isMobile
    ? 'w-full h-11 text-sm border-orange-300/70 focus:border-orange-500 rounded-xl shadow-sm'
    : 'w-28 h-7 text-xs border-orange-300/60 focus:border-orange-400';

  const longSelectTriggerBase = isMobile
    ? 'w-full h-11 text-sm border-orange-300/70 focus:border-orange-500 rounded-xl shadow-sm'
    : 'w-32 h-7 text-xs border-orange-300/60 focus:border-orange-400';

  return (
    <section className={sectionClasses}>
      <div className={containerClasses}>
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <FilterIcon size={20} />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className={filterGroupClasses}>
          {/* Category Filters - Only show if categories exist */}
          {categories.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isMobile ? 'w-full' : 'items-center gap-1.5 md:gap-3 justify-center'}`}>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => onCategoryChange(category)}
                  className={`rounded-full ${isMobile ? 'px-4 py-2 text-sm w-full sm:w-auto' : 'px-4 py-1.5 text-sm'} transition-all duration-300 ${
                    activeCategory === category
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                      : 'border-orange-300/60 text-orange-700/80 hover:bg-orange-100/60 hover:border-orange-400/80'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Location & Event Filters */}
          {stateOptions.length > 0 && onStateChange && (
            <div className={`flex ${isMobile ? 'flex-col gap-2 text-sm' : 'items-center gap-1 text-orange-700/80 text-xs'}`}>
              <span className={isMobile ? 'text-orange-600 font-medium' : ''}>State:</span>
              <Select 
                value={selectedStateId || 'all'}
                onValueChange={(id) => {
                  const actualId = id === 'all' ? '' : id;
                  const stateName = id === 'all' ? 'All' : stateOptions.find(s => s.id === actualId)?.name || 'All';
                  onStateChange(actualId, stateName);
                }}
              >
                <SelectTrigger className={selectTriggerBase}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {stateOptions.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {districtOptions.length > 0 && onDistrictChange && (
            <div className={`flex ${isMobile ? 'flex-col gap-2 text-sm' : 'items-center gap-1 text-orange-700/80 text-xs'}`}>
              <span className={isMobile ? 'text-orange-600 font-medium' : ''}>District:</span>
              <Select 
                value={selectedDistrictId || 'all'}
                onValueChange={(id) => {
                  const actualId = id === 'all' ? '' : id;
                  const districtName = id === 'all' ? 'All' : districtOptions.find(d => d.id === actualId)?.name || 'All';
                  onDistrictChange(actualId, districtName);
                }}
              >
                <SelectTrigger className={selectTriggerBase}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {districtOptions.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {events.length > 1 && onEventChange && (
            <div className={`flex ${isMobile ? 'flex-col gap-2 text-sm' : 'items-center gap-1 text-orange-700/80 text-xs'}`}>
              <span className={isMobile ? 'text-orange-600 font-medium' : ''}>Event:</span>
              <Select value={selectedEvent} onValueChange={onEventChange}>
                <SelectTrigger className={longSelectTriggerBase}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Sort Options */}
          <div className={`flex ${isMobile ? 'flex-col gap-2 text-sm' : 'items-center gap-1 text-orange-700/80 text-xs'}`}>
            <div className={isMobile ? 'flex items-center gap-2 text-orange-600 font-medium' : 'flex items-center gap-1'}>
              <ArrowUpDown size={isMobile ? 18 : 14} />
              <span>Sort:</span>
            </div>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className={longSelectTriggerBase}>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMobile && onCloseMobile && (
            <Button
              className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-base"
              onClick={onCloseMobile}
            >
              Apply Filters
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
