import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
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
  onEventChange
}: GalleryFilterProps) {
  return (
    <section className="py-2 bg-white/30 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100/50">
      <div className="container mx-auto px-4">
        {/* All Filters in Single Line */}
        <div className="flex flex-wrap justify-center items-center gap-2">
          {/* Category Filters - Only show if categories exist */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => onCategoryChange(category)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
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
            <div className="flex items-center gap-1 text-orange-700/80 text-xs">
              <span>State:</span>
              <Select 
                value={selectedStateId || 'all'}
                onValueChange={(id) => {
                  const actualId = id === 'all' ? '' : id;
                  const stateName = id === 'all' ? 'All' : stateOptions.find(s => s.id === actualId)?.name || 'All';
                  onStateChange(actualId, stateName);
                }}
              >
                <SelectTrigger className="w-28 h-7 text-xs border-orange-300/60 focus:border-orange-400">
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
            <div className="flex items-center gap-1 text-orange-700/80 text-xs">
              <span>District:</span>
              <Select 
                value={selectedDistrictId || 'all'}
                onValueChange={(id) => {
                  const actualId = id === 'all' ? '' : id;
                  const districtName = id === 'all' ? 'All' : districtOptions.find(d => d.id === actualId)?.name || 'All';
                  onDistrictChange(actualId, districtName);
                }}
              >
                <SelectTrigger className="w-28 h-7 text-xs border-orange-300/60 focus:border-orange-400">
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
            <div className="flex items-center gap-1 text-orange-700/80 text-xs">
              <span>Event:</span>
              <Select value={selectedEvent} onValueChange={onEventChange}>
                <SelectTrigger className="w-32 h-7 text-xs border-orange-300/60 focus:border-orange-400">
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
          <div className="flex items-center gap-1 text-orange-700/80 text-xs">
            <ArrowUpDown size={14} />
            <span>Sort:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 h-7 text-xs border-orange-300/60 focus:border-orange-400">
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
        </div>
      </div>
    </section>
  );
}
