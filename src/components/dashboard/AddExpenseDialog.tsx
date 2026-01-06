import { useState } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDashboard, Expense } from '@/contexts/DashboardContext';
import { useToast } from '@/hooks/use-toast';

const EXPENSE_CATEGORIES = [
  'Infrastructure',
  'Software',
  'Marketing',
  'Personnel',
  'Office',
  'Travel',
  'Legal',
  'Other',
];

export function AddExpenseDialog() {
  const { expenses, setExpenses } = useDashboard();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Other',
    description: '',
    amount: '',
    recurring: false,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    isPaid: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast({ title: 'Error', description: 'Please enter a description.', variant: 'destructive' });
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount.', variant: 'destructive' });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      category: formData.category,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      recurring: formData.recurring,
      dueDate: formData.dueDate,
      isPaid: formData.isPaid,
    };

    setExpenses([...expenses, newExpense]);
    toast({ title: 'Expense added', description: `${formData.description} has been added.` });
    
    // Reset form
    setFormData({
      category: 'Other',
      description: '',
      amount: '',
      recurring: false,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      isPaid: false,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details for the new expense. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly cloud hosting"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="recurring"
                checked={formData.recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
              />
              <Label htmlFor="recurring" className="cursor-pointer">Recurring expense</Label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
              />
              <Label htmlFor="isPaid" className="cursor-pointer">Already paid</Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
