"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  disabled = false,
  className,
  maxHeight = 200,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get selected option label
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term with fuzzy matching
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option => {
      const label = option.label.toLowerCase();
      
      // Exact match (highest priority)
      if (label === term) return true;
      
      // Starts with search term
      if (label.startsWith(term)) return true;
      
      // Contains search term
      if (label.includes(term)) return true;
      
      // Fuzzy match - check if all characters in search term exist in order
      let searchIndex = 0;
      for (let i = 0; i < label.length && searchIndex < term.length; i++) {
        if (label[i] === term[searchIndex]) {
          searchIndex++;
        }
      }
      
      return searchIndex === term.length;
    }).sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      
      // Prioritize exact matches
      if (aLabel === term) return -1;
      if (bLabel === term) return 1;
      
      // Then prioritize starts with
      const aStartsWith = aLabel.startsWith(term);
      const bStartsWith = bLabel.startsWith(term);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then prioritize contains
      const aContains = aLabel.includes(term);
      const bContains = bLabel.includes(term);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      
      // Finally alphabetical
      return aLabel.localeCompare(bLabel);
    });
  }, [options, searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            onValueChange(filteredOptions[highlightedIndex].value);
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, onValueChange]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-orange-400 ring-4 ring-orange-400/20"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-gray-500"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2 ml-2">
          {selectedOption && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 text-orange-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => (optionRefs.current[index] = el)}
                  onClick={() => handleOptionClick(option.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-orange-50",
                    index === highlightedIndex && "bg-orange-100",
                    option.value === value && "bg-orange-100 text-orange-800"
                  )}
                >
                  <span className="text-sm font-medium truncate">
                    {option.label}
                  </span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-orange-600 flex-shrink-0 ml-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {emptyText}
              </div>
            )}
          </div>

          {/* Results count */}
          {searchTerm && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
              {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
