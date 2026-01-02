import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
}

interface SearchFilterProps {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  searchValue: string;
  filterValues: Record<string, string>;
}

export function SearchFilter({
  searchPlaceholder = 'Search...',
  filters = [],
  onSearchChange,
  onFilterChange,
  searchValue,
  filterValues,
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const hasActiveFilters =
    searchValue.length > 0 ||
    Object.values(filterValues).some((v) => v && v !== 'all');

  const clearAll = () => {
    setLocalSearch('');
    onSearchChange('');
    filters.forEach((f) => onFilterChange(f.key, 'all'));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filterValues[filter.key] || 'all'}
          onValueChange={(value) => onFilterChange(filter.key, value)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filter.allLabel || `All ${filter.label}`}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
