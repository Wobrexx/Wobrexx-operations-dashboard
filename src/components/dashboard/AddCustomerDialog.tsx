import { useState } from 'react';
import { Plus, Play, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Customer, Project, PaymentInfo, useDashboard } from '@/contexts/DashboardContext';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddCustomerDialogProps {
  onAdd: (customer: Customer) => void;
}

const defaultPayment: PaymentInfo = { estimatedCost: 0, amountPaid: 0 };

export function AddCustomerDialog({ onAdd }: AddCustomerDialogProps) {
  const { projects, setProjects } = useDashboard();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    serviceType: 'Website' as Customer['serviceType'],
    status: 'Active' as Customer['status'],
    maintenance: false,
    monthlyRevenue: 0,
    notes: '',
    businessStartDate: undefined as Date | undefined,
    closingDate: undefined as Date | undefined,
    createProject: true,
    projectName: '',
    // Financial fields
    projectPayment: { ...defaultPayment },
    maintenancePayment: { ...defaultPayment },
    newRequirementPayment: { ...defaultPayment },
    maintenanceDueDate: undefined as Date | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.country.trim()) return;

    const customerId = Date.now().toString();
    const newCustomer: Customer = {
      id: customerId,
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
      maintenancePaidMonths: [],
    };

    onAdd(newCustomer);

    // Create linked project(s) in Services
    if (formData.createProject && formData.serviceType !== 'Mixed') {
      const newProject: Project = {
        id: `proj-${customerId}`,
        clientName: formData.companyName.trim(),
        projectName: formData.projectName.trim() || `${formData.companyName.trim()} Project`,
        status: formData.status === 'Active' ? 'Live' : formData.status === 'Paused' ? 'Paused' : 'Completed',
        maintenance: formData.maintenance,
        revenue: formData.monthlyRevenue,
        notes: formData.notes.trim(),
        type: formData.serviceType as 'Website' | 'Software' | 'Automation',
        startDate: formData.businessStartDate?.toISOString() || new Date().toISOString(),
      };
      setProjects([...projects, newProject]);
    } else if (formData.createProject && formData.serviceType === 'Mixed') {
      // For Mixed, create projects for all types
      const types: Array<'Website' | 'Software' | 'Automation'> = ['Website', 'Software', 'Automation'];
      const newProjects: Project[] = types.map((type, idx) => ({
        id: `proj-${customerId}-${idx}`,
        clientName: formData.companyName.trim(),
        projectName: `${formData.companyName.trim()} ${type}`,
        status: formData.status === 'Active' ? 'Live' : formData.status === 'Paused' ? 'Paused' : 'Completed',
        maintenance: formData.maintenance,
        revenue: Math.round(formData.monthlyRevenue / 3),
        notes: '',
        type,
        startDate: formData.businessStartDate?.toISOString() || new Date().toISOString(),
      }));
      setProjects([...projects, ...newProjects]);
    }

    // Reset form
    setFormData({
      companyName: '',
      country: '',
      serviceType: 'Website',
      status: 'Active',
      maintenance: false,
      monthlyRevenue: 0,
      notes: '',
      businessStartDate: undefined,
      closingDate: undefined,
      createProject: true,
      projectName: '',
      projectPayment: { ...defaultPayment },
      maintenancePayment: { ...defaultPayment },
      newRequirementPayment: { ...defaultPayment },
      maintenanceDueDate: undefined,
    });
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer. A project will be automatically created in Services.
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

              {/* Project creation section */}
              <div className="border-t border-border pt-4 mt-2">
                <div className="flex items-center gap-3 mb-3">
                  <Switch
                    id="createProject"
                    checked={formData.createProject}
                    onCheckedChange={(checked) => setFormData({ ...formData, createProject: checked })}
                  />
                  <Label htmlFor="createProject" className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-success" />
                    Create project & start live runtime
                  </Label>
                </div>
                {formData.createProject && (
                  <div className="grid gap-2">
                    <Label htmlFor="projectName">Project Name (optional)</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder={`${formData.companyName || 'Company'} Project`}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.serviceType === 'Mixed' 
                        ? 'Projects will be created for Website, Software, and Automation services.'
                        : `A ${formData.serviceType} project will be created in the Services section.`}
                    </p>
                  </div>
                )}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.companyName.trim() || !formData.country.trim()}>
              Add Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}