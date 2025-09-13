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
  onSortChange 
}: GalleryFilterProps) {
  return (
    <section className="py-4 bg-white/30 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100/50">
      <div className="container mx-auto px-4">
        {/* Category Filters and Sort Options */}
        <div className="flex flex-wrap justify-center items-center gap-3">
          {/* Category Filters */}
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
          
          {/* Sort Options */}
          <div className="flex items-center gap-2 text-orange-700/80 text-sm">
            <ArrowUpDown size={16} />
            <span>Sort by:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-40 h-8 text-sm border-orange-300/60 focus:border-orange-400">
                <SelectValue placeholder="Select sort option" />
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
