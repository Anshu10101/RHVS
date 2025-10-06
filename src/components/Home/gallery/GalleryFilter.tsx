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
  states = [],
  districts = [],
  selectedState = 'All',
  selectedDistrict = 'All',
  onStateChange,
  onDistrictChange,
  tags = [],
  selectedTags = [],
  onTagsChange,
  events = [],
  selectedEvent = 'All',
  onEventChange
}: GalleryFilterProps) {
  return (
    <section className="py-2 bg-white/30 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100/50">
      <div className="container mx-auto px-4">
        {/* Advanced Filters */}
        {(states.length > 1 || districts.length > 1 || events.length > 1 || tags.length > 0) && (
          <div className="space-y-2 mb-3">
            {/* Location & Event Filters */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {states.length > 1 && onStateChange && (
                <div className="flex items-center gap-1 text-orange-700/80 text-xs">
                  <span>State:</span>
                  <Select value={selectedState} onValueChange={onStateChange}>
                    <SelectTrigger className="w-28 h-7 text-xs border-orange-300/60 focus:border-orange-400">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {districts.length > 1 && onDistrictChange && (
                <div className="flex items-center gap-1 text-orange-700/80 text-xs">
                  <span>District:</span>
                  <Select value={selectedDistrict} onValueChange={onDistrictChange}>
                    <SelectTrigger className="w-28 h-7 text-xs border-orange-300/60 focus:border-orange-400">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
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
            </div>

            {/* Tags Filter */}
            {tags.length > 0 && onTagsChange && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-orange-700/80 text-xs font-medium">Tags:</div>
                <div className="flex flex-wrap justify-center gap-1 max-w-4xl">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <Button
                        key={tag}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            onTagsChange(selectedTags.filter(t => t !== tag));
                          } else {
                            onTagsChange([...selectedTags, tag]);
                          }
                        }}
                        className={`rounded-full px-2 py-0.5 text-xs transition-all duration-300 ${
                          isSelected
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                            : 'border-orange-300/60 text-orange-700/80 hover:bg-orange-100/60 hover:border-orange-400/80'
                        }`}
                      >
                        {tag}
                      </Button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTagsChange([])}
                    className="text-orange-600 hover:text-orange-700 text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sort Options */}
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
