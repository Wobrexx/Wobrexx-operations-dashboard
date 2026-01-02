import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  type?: 'text' | 'number' | 'currency' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  className?: string;
}

export function EditableCell({
  value,
  onChange,
  type = 'text',
  options = [],
  className,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (type === 'number' || type === 'currency') {
      const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    } else {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const formatDisplay = () => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(Number(value));
    }
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (type === 'select') {
      const option = options.find((o) => o.value === value);
      return option?.label || value;
    }
    return value;
  };

  if (type === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'px-2 py-0.5 rounded text-xs font-medium transition-colors',
          value
            ? 'bg-success/10 text-success hover:bg-success/20'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
          className
        )}
      >
        {value ? 'Yes' : 'No'}
      </button>
    );
  }

  if (type === 'select') {
    return (
      <Select value={value.toString()} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className={cn('h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:ring-1', className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type === 'number' || type === 'currency' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-3 w-3 text-success" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
          <X className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'text-left px-2 py-1 -mx-2 -my-1 rounded hover:bg-muted/50 transition-colors w-full',
        className
      )}
    >
      {formatDisplay()}
    </button>
  );
}
