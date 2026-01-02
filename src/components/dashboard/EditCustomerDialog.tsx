import { useState, useEffect } from 'react';
import { Pencil, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Customer, PaymentInfo, useDashboard } from '@/contexts/DashboardContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultPayment: PaymentInfo = { estimatedCost: 0, amountPaid: 0 };

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const { customers, setCustomers, projects, setProjects } = useDashboard();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: customer.companyName,
    country: customer.country,
    serviceType: customer.serviceType,
    status: customer.status,
    maintenance: customer.maintenance,
    monthlyRevenue: customer.monthlyRevenue,
    notes: customer.notes,
    businessStartDate: customer.businessStartDate ? new Date(customer.businessStartDate) : undefined,
    closingDate: customer.closingDate ? new Date(customer.closingDate) : undefined,
    projectPayment: customer.projectPayment || { ...defaultPayment },
    maintenancePayment: customer.maintenancePayment || { ...defaultPayment },
    newRequirementPayment: customer.newRequirementPayment || { ...defaultPayment },
    maintenanceDueDate: customer.maintenanceDueDate ? new Date(customer.maintenanceDueDate) : undefined,
  });

  // Reset form when customer changes
  useEffect(() => {
    setFormData({
      companyName: customer.companyName,
      country: customer.country,
      serviceType: customer.serviceType,
      status: customer.status,
      maintenance: customer.maintenance,
      monthlyRevenue: customer.monthlyRevenue,
      notes: customer.notes,
      businessStartDate: customer.businessStartDate ? new Date(customer.businessStartDate) : undefined,
      closingDate: customer.closingDate ? new Date(customer.closingDate) : undefined,
      projectPayment: customer.projectPayment || { ...defaultPayment },
      maintenancePayment: customer.maintenancePayment || { ...defaultPayment },
      newRequirementPayment: customer.newRequirementPayment || { ...defaultPayment },
      maintenanceDueDate: customer.maintenanceDueDate ? new Date(customer.maintenanceDueDate) : undefined,
    });
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.country.trim()) return;

    const oldCompanyName = customer.companyName;
    const updatedCustomer: Customer = {
      ...customer,
      companyName: formData.companyName.trim(),
      country: formData.country.trim(),
      serviceType: formData.serviceType,
      status: formData.status,
      maintenance: formData.maintenance,
      monthlyRevenue: formData.monthlyRevenue,
      notes: formData.notes.trim(),
      businessStartDate: formData.businessStartDate?.toISOString(),
      closingDate: formData.closingDate?.toISOString(),
      projectPayment: formData.projectPayment,
      maintenancePayment: formData.maintenancePayment,
      newRequirementPayment: formData.newRequirementPayment,
      maintenanceDueDate: formData.maintenanceDueDate?.toISOString(),
    };

    // Update customer in list
    setCustomers(customers.map(c => c.id === customer.id ? updatedCustomer : c));

    // Update linked projects if company name changed
    if (oldCompanyName !== formData.companyName.trim()) {
      setProjects(projects.map(p => 
        p.clientName === oldCompanyName 
          ? { ...p, clientName: formData.companyName.trim() }
          : p
      ));
    }

    // Update linked projects maintenance status and revenue
    setProjects(projects.map(p => 
      p.clientName === formData.companyName.trim()
        ? { ...p, maintenance: formData.maintenance, revenue: formData.monthlyRevenue }
        : p
    ));

    toast({
      title: 'Customer updated',
      description: `${formData.companyName} has been updated successfully.`,
    });

    onOpenChange(false);
  };

  const updatePayment = (type: 'projectPayment' | 'maintenancePayment' | 'newRequirementPayment', field: keyof PaymentInfo, value: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const getRemainingBalance = (payment: PaymentInfo) => {
    return Math.max(0, payment.estimatedCost - payment.amountPaid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Customer
            </DialogTitle>
            <DialogDescription>
              Update customer details. Changes will be reflected across all dashboards.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="financial">
                <DollarSign className="h-4 w-4 mr-1" />
                Financial
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                  maxLength={100}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                  maxLength={50}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(v) => setFormData({ ...formData, serviceType: v as Customer['serviceType'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Automation">Automation</SelectItem>
                      <SelectItem value="Mixed">Mixed (All Services)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as Customer['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Opted Out">Opted Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Business Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !formData.businessStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.businessStartDate ? format(formData.businessStartDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.businessStartDate}
                        onSelect={(date) => setFormData({ ...formData, businessStartDate: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Closing Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !formData.closingDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.closingDate ? format(formData.closingDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.closingDate}
                        onSelect={(date) => setFormData({ ...formData, closingDate: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="revenue">Monthly Revenue ($)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    min={0}
                    value={formData.monthlyRevenue}
                    onChange={(e) => setFormData({ ...formData, monthlyRevenue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="maintenance"
                    checked={formData.maintenance}
                    onCheckedChange={(checked) => setFormData({ ...formData, maintenance: checked })}
                  />
                  <Label htmlFor="maintenance">Has Maintenance</Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  maxLength={500}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              {/* Project Payment */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <h4 className="font-medium text-sm">Project Payment</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Estimated Cost ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.projectPayment.estimatedCost}
                      onChange={(e) => updatePayment('projectPayment', 'estimatedCost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Amount Paid ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.projectPayment.amountPaid}
                      onChange={(e) => updatePayment('projectPayment', 'amountPaid', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Remaining ($)</Label>
                    <div className={cn(
                      "h-9 px-3 rounded-md border flex items-center text-sm font-medium",
                      getRemainingBalance(formData.projectPayment) > 0 ? "bg-warning/10 border-warning/30 text-warning" : "bg-success/10 border-success/30 text-success"
                    )}>
                      ${getRemainingBalance(formData.projectPayment).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Payment */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <h4 className="font-medium text-sm">Maintenance Payment</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Estimated Cost ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.maintenancePayment.estimatedCost}
                      onChange={(e) => updatePayment('maintenancePayment', 'estimatedCost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Amount Paid ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.maintenancePayment.amountPaid}
                      onChange={(e) => updatePayment('maintenancePayment', 'amountPaid', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Remaining ($)</Label>
                    <div className={cn(
                      "h-9 px-3 rounded-md border flex items-center text-sm font-medium",
                      getRemainingBalance(formData.maintenancePayment) > 0 ? "bg-warning/10 border-warning/30 text-warning" : "bg-success/10 border-success/30 text-success"
                    )}>
                      ${getRemainingBalance(formData.maintenancePayment).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 mt-3">
                  <Label className="text-xs text-muted-foreground">Maintenance Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'justify-start text-left font-normal',
                          !formData.maintenanceDueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.maintenanceDueDate ? format(formData.maintenanceDueDate, 'PPP') : 'Select due date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.maintenanceDueDate}
                        onSelect={(date) => setFormData({ ...formData, maintenanceDueDate: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* New Requirement Payment */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <h4 className="font-medium text-sm">New Requirement Payment</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Estimated Cost ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.newRequirementPayment.estimatedCost}
                      onChange={(e) => updatePayment('newRequirementPayment', 'estimatedCost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Amount Paid ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.newRequirementPayment.amountPaid}
                      onChange={(e) => updatePayment('newRequirementPayment', 'amountPaid', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">Remaining ($)</Label>
                    <div className={cn(
                      "h-9 px-3 rounded-md border flex items-center text-sm font-medium",
                      getRemainingBalance(formData.newRequirementPayment) > 0 ? "bg-warning/10 border-warning/30 text-warning" : "bg-success/10 border-success/30 text-success"
                    )}>
                      ${getRemainingBalance(formData.newRequirementPayment).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.companyName.trim() || !formData.country.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}