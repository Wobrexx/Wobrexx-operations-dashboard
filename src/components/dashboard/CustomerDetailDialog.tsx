import { useMemo } from 'react';
import { Eye, Building2, Globe, Calendar, DollarSign, Wallet, AlertCircle, CheckCircle, Clock, FileText, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Customer, useDashboard } from '@/contexts/DashboardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customer, open, onOpenChange }: CustomerDetailDialogProps) {
  const { paymentHistory, projects } = useDashboard();

  const customerPayments = useMemo(() => {
    if (!customer) return [];
    return paymentHistory.filter(p => p.customerId === customer.id);
  }, [customer, paymentHistory]);

  const customerProjects = useMemo(() => {
    if (!customer) return [];
    return projects.filter(p => p.clientName === customer.companyName);
  }, [customer, projects]);

  if (!customer) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  // Calculate totals
  const totalEstimated = 
    customer.projectPayment.estimatedCost + 
    customer.maintenancePayment.estimatedCost + 
    customer.newRequirementPayment.estimatedCost;
  
  const totalPaid = 
    customer.projectPayment.amountPaid + 
    customer.maintenancePayment.amountPaid + 
    customer.newRequirementPayment.amountPaid;
  
  const totalPending = totalEstimated - totalPaid;
  const paymentProgress = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 100;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Paused': return 'secondary';
      case 'Opted Out': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatus = (estimated: number, paid: number) => {
    if (estimated === 0) return { label: 'N/A', variant: 'outline' as const };
    if (paid >= estimated) return { label: 'Paid', variant: 'default' as const };
    if (paid > 0) return { label: 'Partial', variant: 'secondary' as const };
    return { label: 'Pending', variant: 'destructive' as const };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{customer.companyName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Globe className="h-3.5 w-3.5" />
                {customer.country}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={getStatusBadgeVariant(customer.status)} className={cn(
                  customer.status === 'Active' && 'bg-success/10 text-success border-success/20'
                )}>
                  {customer.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Service Type</p>
                <Badge variant="outline">{customer.serviceType}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Maintenance</p>
                <div className="flex items-center gap-1.5">
                  {customer.maintenance ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-warning">None</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-sm font-semibold text-success">{formatCurrency(customer.monthlyRevenue)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Business Started
                </p>
                <p className="text-sm font-medium">{formatDate(customer.businessStartDate)}</p>
              </div>
              {customer.closingDate && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Closing Date
                  </p>
                  <p className="text-sm font-medium text-destructive">{formatDate(customer.closingDate)}</p>
                </div>
              )}
              {customer.maintenanceDueDate && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Maintenance Due
                  </p>
                  <p className="text-sm font-medium">{formatDate(customer.maintenanceDueDate)}</p>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm bg-muted/50 rounded-md p-2">{customer.notes}</p>
              </div>
            )}
          </section>

          <Separator />

          {/* Financial Summary */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Summary
            </h3>
            
            {/* Overall Progress */}
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Payment Progress</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    paymentProgress === 100 ? "text-success" : paymentProgress >= 50 ? "text-primary" : "text-warning"
                  )}>
                    {paymentProgress.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={paymentProgress} 
                  className={cn(
                    "h-3",
                    paymentProgress === 100 ? "[&>div]:bg-success" : paymentProgress >= 50 ? "[&>div]:bg-primary" : "[&>div]:bg-warning"
                  )}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Paid: {formatCurrency(totalPaid)}</span>
                  <span>Total: {formatCurrency(totalEstimated)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Project Payment
                    <Badge {...getPaymentStatus(customer.projectPayment.estimatedCost, customer.projectPayment.amountPaid)} className={cn(
                      getPaymentStatus(customer.projectPayment.estimatedCost, customer.projectPayment.amountPaid).label === 'Paid' && 'bg-success/10 text-success border-success/20'
                    )}>
                      {getPaymentStatus(customer.projectPayment.estimatedCost, customer.projectPayment.amountPaid).label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated</span>
                    <span className="font-medium">{formatCurrency(customer.projectPayment.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">{formatCurrency(customer.projectPayment.amountPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className={cn(
                      "font-semibold",
                      customer.projectPayment.estimatedCost - customer.projectPayment.amountPaid > 0 ? "text-warning" : "text-success"
                    )}>
                      {formatCurrency(Math.max(0, customer.projectPayment.estimatedCost - customer.projectPayment.amountPaid))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Maintenance
                    <Badge {...getPaymentStatus(customer.maintenancePayment.estimatedCost, customer.maintenancePayment.amountPaid)} className={cn(
                      getPaymentStatus(customer.maintenancePayment.estimatedCost, customer.maintenancePayment.amountPaid).label === 'Paid' && 'bg-success/10 text-success border-success/20'
                    )}>
                      {getPaymentStatus(customer.maintenancePayment.estimatedCost, customer.maintenancePayment.amountPaid).label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated</span>
                    <span className="font-medium">{formatCurrency(customer.maintenancePayment.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">{formatCurrency(customer.maintenancePayment.amountPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className={cn(
                      "font-semibold",
                      customer.maintenancePayment.estimatedCost - customer.maintenancePayment.amountPaid > 0 ? "text-warning" : "text-success"
                    )}>
                      {formatCurrency(Math.max(0, customer.maintenancePayment.estimatedCost - customer.maintenancePayment.amountPaid))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* New Requirement Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    New Requirements
                    <Badge {...getPaymentStatus(customer.newRequirementPayment.estimatedCost, customer.newRequirementPayment.amountPaid)} className={cn(
                      getPaymentStatus(customer.newRequirementPayment.estimatedCost, customer.newRequirementPayment.amountPaid).label === 'Paid' && 'bg-success/10 text-success border-success/20'
                    )}>
                      {getPaymentStatus(customer.newRequirementPayment.estimatedCost, customer.newRequirementPayment.amountPaid).label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated</span>
                    <span className="font-medium">{formatCurrency(customer.newRequirementPayment.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">{formatCurrency(customer.newRequirementPayment.amountPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className={cn(
                      "font-semibold",
                      customer.newRequirementPayment.estimatedCost - customer.newRequirementPayment.amountPaid > 0 ? "text-warning" : "text-success"
                    )}>
                      {formatCurrency(Math.max(0, customer.newRequirementPayment.estimatedCost - customer.newRequirementPayment.amountPaid))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Total Pending */}
            {totalPending > 0 && (
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span className="font-medium">Total Pending Payment</span>
                    </div>
                    <span className="text-xl font-bold text-warning">{formatCurrency(totalPending)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Associated Projects */}
          {customerProjects.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Associated Projects ({customerProjects.length})
              </h3>
              <div className="space-y-2">
                {customerProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{project.projectName}</p>
                      <p className="text-xs text-muted-foreground">{project.type}</p>
                    </div>
                    <Badge variant={project.status === 'Live' ? 'default' : 'secondary'} className={cn(
                      project.status === 'Live' && 'bg-success/10 text-success border-success/20'
                    )}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Payment History */}
          {customerPayments.length > 0 && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Recent Payments ({customerPayments.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerPayments.slice(0, 5).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{formatDate(payment.date)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{payment.paymentType.replace(/([A-Z])/g, ' $1').trim()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">{formatCurrency(payment.amount)}</p>
                        {payment.notes && <p className="text-xs text-muted-foreground">{payment.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
