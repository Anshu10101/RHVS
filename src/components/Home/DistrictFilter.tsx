import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, X } from 'lucide-react';

interface DistrictFilterProps {
  onFilterChange: (district: string | null, state: string | null) => void;
}

interface State {
  id: number;
  code: string;
  name: string;
}

interface District {
  id: number;
  name: string;
}

export default function DistrictFilter({ onFilterChange }: DistrictFilterProps) {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedState]);

  // Fetch states from API
  const fetchStates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/states');
      if (response.ok) {
        const data = await response.json();
        setStates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch districts from API based on selected state
  const fetchDistricts = async (stateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle state selection
  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(null);
    onFilterChange(null, value);
  };

  // Handle district selection
  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    onFilterChange(value, selectedState);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    onFilterChange(null, null);
  };

  // Get state name from ID
  const getStateName = (id: string | null) => {
    if (!id) return '';
    const state = states.find(s => s.id.toString() === id);
    return state ? state.name : '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-1">
          <Filter className="h-4 w-4" />
          Filter by Location
        </h3>
        
        {(selectedState || selectedDistrict) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm">State</Label>
          <Select value={selectedState || ''} onValueChange={handleStateChange}>
            <SelectTrigger id="state" className="h-9">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id.toString()}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="district" className="text-sm">District</Label>
          <Select 
            value={selectedDistrict || ''} 
            onValueChange={handleDistrictChange}
            disabled={!selectedState || districts.length === 0}
          >
            <SelectTrigger id="district" className="h-9">
              <SelectValue placeholder={
                !selectedState 
                  ? "Select state first" 
                  : districts.length === 0 
                    ? "Loading districts..." 
                    : "Select district"
              } />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedState && selectedDistrict && (
          <div className="mt-4 pt-3 border-t flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>
              Showing content from{' '}
              <span className="font-medium">{
                districts.find(d => d.id.toString() === selectedDistrict)?.name
              }</span>
              {selectedState && (
                <>, {getStateName(selectedState)}</>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
