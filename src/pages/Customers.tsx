import { useState, useCallback, useMemo } from 'react';
import { Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboard, Customer } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditableCell } from '@/components/dashboard/EditableCell';
import { AddCustomerDialog } from '@/components/dashboard/AddCustomerDialog';
import { EditCustomerDialog } from '@/components/dashboard/EditCustomerDialog';
import { SearchFilter, FilterConfig } from '@/components/dashboard/SearchFilter';
import { TablePagination } from '@/components/dashboard/TablePagination';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const serviceOptions = [
  { value: 'Website', label: 'Website' },
  { value: 'Software', label: 'Software' },
  { value: 'Automation', label: 'Automation' },
  { value: 'Mixed', label: 'Mixed' },
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Opted Out', label: 'Opted Out' },
];

const maintenanceOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const filters: FilterConfig[] = [
  { key: 'serviceType', label: 'Service', options: serviceOptions },
  { key: 'status', label: 'Status', options: statusOptions },
  { key: 'maintenance', label: 'Maintenance', options: maintenanceOptions },
];

export default function Customers() {
  const { customers, setCustomers, projects, setProjects } = useDashboard();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    serviceType: 'all',
    status: 'all',
    maintenance: 'all',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const updateCustomer = (id: string, field: keyof Customer, value: string | number | boolean) => {
    setCustomers(
      customers.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const addCustomer = (customer: Customer) => {
    setCustomers([...customers, customer]);
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      const associatedProjects = projects.filter((p) => p.clientName === customerToDelete.companyName);
      setProjects(projects.filter((p) => p.clientName !== customerToDelete.companyName));
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      
      toast({
        title: 'Customer deleted',
        description: associatedProjects.length > 0 
          ? `${customerToDelete.companyName} and ${associatedProjects.length} associated project(s) removed.`
          : `${customerToDelete.companyName} has been removed.`,
      });
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const matchesSearch =
          customer.companyName.toLowerCase().includes(search) ||
          customer.country.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (filterValues.serviceType !== 'all' && customer.serviceType !== filterValues.serviceType) {
        return false;
      }

      if (filterValues.status !== 'all' && customer.status !== filterValues.status) {
        return false;
      }

      if (filterValues.maintenance !== 'all') {
        const hasMaintenance = filterValues.maintenance === 'yes';
        if (customer.maintenance !== hasMaintenance) return false;
      }

      return true;
    });
  }, [customers, searchValue, filterValues]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredCustomers);

  const activeCount = customers.filter((c) => c.status === 'Active').length;
  const noMaintenanceCount = customers.filter((c) => !c.maintenance && c.status === 'Active').length;
  const optedOutCount = customers.filter((c) => c.status === 'Opted Out').length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const getAssociatedProjectsCount = (companyName: string) => {
    return projects.filter((p) => p.clientName === companyName).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all customer information
          </p>
        </div>
        <AddCustomerDialog onAdd={addCustomer} />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Active</p>
                <p className="text-2xl font-bold text-success">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-success font-semibold">{activeCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('border-l-4', noMaintenanceCount > 0 ? 'border-l-warning' : 'border-l-muted')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">No Maintenance</p>
                <p className={cn('text-2xl font-bold', noMaintenanceCount > 0 ? 'text-warning' : 'text-foreground')}>
                  {noMaintenanceCount}
                </p>
              </div>
              {noMaintenanceCount > 0 && (
                <AlertTriangle className="h-6 w-6 text-warning" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Opted Out</p>
                <p className="text-2xl font-bold text-destructive">{optedOutCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive font-semibold">{optedOutCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <SearchFilter
        searchPlaceholder="Search by company or country..."
        filters={filters}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        searchValue={searchValue}
        filterValues={filterValues}
      />

      {/* Customer Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Customer Directory</CardTitle>
            <span className="text-sm text-muted-foreground">
              {filteredCustomers.length} of {customers.length} customers
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Company Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead className="text-right">Monthly Revenue</TableHead>
                  <TableHead className="w-[150px]">Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No customers match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={cn(
                        !customer.maintenance && customer.status === 'Active' && 'bg-warning/5'
                      )}
                    >
                      <TableCell className="font-medium">
                        <EditableCell
                          value={customer.companyName}
                          onChange={(v) => updateCustomer(customer.id, 'companyName', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={customer.country}
                          onChange={(v) => updateCustomer(customer.id, 'country', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={customer.serviceType}
                          type="select"
                          options={serviceOptions}
                          onChange={(v) => updateCustomer(customer.id, 'serviceType', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={customer.status}
                          type="select"
                          options={statusOptions}
                          onChange={(v) => updateCustomer(customer.id, 'status', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(customer.businessStartDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'text-sm',
                          customer.closingDate ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {formatDate(customer.closingDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EditableCell
                            value={customer.maintenance}
                            type="boolean"
                            onChange={(v) => updateCustomer(customer.id, 'maintenance', v)}
                          />
                          {!customer.maintenance && customer.status === 'Active' && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <EditableCell
                          value={customer.monthlyRevenue}
                          type="currency"
                          onChange={(v) => updateCustomer(customer.id, 'monthlyRevenue', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={customer.notes}
                          onChange={(v) => updateCustomer(customer.id, 'notes', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditClick(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteClick(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <span className="font-semibold text-foreground">{customerToDelete?.companyName}</span>?
              </p>
              {customerToDelete && getAssociatedProjectsCount(customerToDelete.companyName) > 0 && (
                <p className="text-warning">
                  This will also delete {getAssociatedProjectsCount(customerToDelete.companyName)} associated project(s) from Services.
                </p>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Customer Dialog */}
      {customerToEdit && (
        <EditCustomerDialog
          customer={customerToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
