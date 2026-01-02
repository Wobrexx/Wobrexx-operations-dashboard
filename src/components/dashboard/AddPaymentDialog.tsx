import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useDashboard, Customer, PaymentHistory } from '@/contexts/DashboardContext';
import { useToast } from '@/hooks/use-toast';

interface AddPaymentDialogProps {
  trigger?: React.ReactNode;
}

export function AddPaymentDialog({ trigger }: AddPaymentDialogProps) {
  const { customers, addPaymentRecord, setCustomers } = useDashboard();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'project' | 'maintenance' | 'newRequirement'>('project');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const activeCustomers = customers.filter(c => c.status === 'Active');
  const selectedCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a customer and enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    const customerName = selectedCustomer?.companyName || 'Unknown';

    // Add payment record to history
    addPaymentRecord({
      customerId,
      customerName,
      paymentType,
      amount: parsedAmount,
      date: format(date, 'yyyy-MM-dd'),
      notes: notes.trim() || undefined,
    });

    // Update customer's amountPaid based on payment type
    if (selectedCustomer) {
      const paymentFieldMap = {
        project: 'projectPayment',
        maintenance: 'maintenancePayment',
        newRequirement: 'newRequirementPayment',
      } as const;

      const paymentField = paymentFieldMap[paymentType];
      
      setCustomers(customers.map(c => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          [paymentField]: {
            ...c[paymentField],
            amountPaid: c[paymentField].amountPaid + parsedAmount,
          },
        };
      }));
    }

    toast({
      title: 'Payment Recorded',
      description: `$${parsedAmount.toLocaleString()} payment from ${customerName} has been recorded.`,
    });

    // Reset form
    setCustomerId('');
    setPaymentType('project');
    setAmount('');
    setDate(new Date());
    setNotes('');
    setOpen(false);
  };

  const paymentTypeLabels = {
    project: 'Project Payment',
    maintenance: 'Maintenance Payment',
    newRequirement: 'New Requirement',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Record New Payment
            </DialogTitle>
            <DialogDescription>
              Add a new payment transaction to the history log.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Customer Selection */}
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {activeCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Type */}
            <div className="grid gap-2">
              <Label htmlFor="paymentType">Payment Type *</Label>
              <Select value={paymentType} onValueChange={(v) => setPaymentType(v as typeof paymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project Payment</SelectItem>
                  <SelectItem value="maintenance">Maintenance Payment</SelectItem>
                  <SelectItem value="newRequirement">New Requirement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
              {selectedCustomer && (
                <p className="text-xs text-muted-foreground">
                  Current {paymentTypeLabels[paymentType]} balance: $
                  {(() => {
                    const fieldMap = {
                      project: selectedCustomer.projectPayment,
                      maintenance: selectedCustomer.maintenancePayment,
                      newRequirement: selectedCustomer.newRequirementPayment,
                    };
                    const payment = fieldMap[paymentType];
                    const remaining = payment.estimatedCost - payment.amountPaid;
                    return remaining.toLocaleString();
                  })()}
                  {' '}remaining
                </p>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Payment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!customerId || !amount}>
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
