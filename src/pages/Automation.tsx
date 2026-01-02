import { useState, useCallback, useMemo } from 'react';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from '@/components/dashboard/KPICard';
import { LiveRuntime } from '@/components/dashboard/LiveRuntime';
import { SearchFilter, FilterConfig } from '@/components/dashboard/SearchFilter';
import { TablePagination } from '@/components/dashboard/TablePagination';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'Healthy', label: 'Healthy' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Failed', label: 'Failed' },
];

const manualOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const filters: FilterConfig[] = [
  { key: 'status', label: 'Status', options: statusOptions },
  { key: 'manual', label: 'Manual', options: manualOptions },
];

export default function AutomationPage() {
  const { automations, automationKPIs } = useDashboard();
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    manual: 'all',
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredAutomations = useMemo(() => {
    return automations.filter((automation) => {
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const matchesSearch =
          automation.clientName.toLowerCase().includes(search) ||
          automation.automationName.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (filterValues.status !== 'all' && automation.status !== filterValues.status) {
        return false;
      }

      if (filterValues.manual !== 'all') {
        const hasManual = filterValues.manual === 'yes';
        if (automation.manualIntervention !== hasManual) return false;
      }

      return true;
    });
  }, [automations, searchValue, filterValues]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredAutomations);

  const runtimeChartData = automations
    .sort((a, b) => b.runtime - a.runtime)
    .slice(0, 6)
    .map((a) => ({
      name: a.automationName.length > 12 ? a.automationName.slice(0, 12) + '...' : a.automationName,
      runtime: a.runtime,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'text-success';
      case 'Warning':
        return 'text-warning';
      case 'Failed':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  const getStartDate = (index: number) => {
    const now = new Date();
    const hoursAgo = [24, 48, 12, 72, 6][index % 5];
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Automation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage automation workflows
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Automations"
          value={automationKPIs.totalAutomations}
          icon={<Play className="h-5 w-5 text-primary" />}
        />
        <KPICard
          title="Monthly Runtime (hrs)"
          value={automationKPIs.monthlyRuntime}
          icon={<Clock className="h-5 w-5 text-info" />}
        />
        <KPICard
          title="Monthly Executions"
          value={automationKPIs.monthlyExecutions}
          variant="success"
        />
        <KPICard
          title="Failed Automations"
          value={automationKPIs.failedAutomations}
          variant="destructive"
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        />
      </div>

      {/* Search & Filter */}
      <SearchFilter
        searchPlaceholder="Search by client or automation name..."
        filters={filters}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        searchValue={searchValue}
        filterValues={filterValues}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runtime Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Runtime by Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runtimeChartData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} hrs`, 'Runtime']}
                  />
                  <Bar
                    dataKey="runtime"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Automation Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Automation Workflows</CardTitle>
              <span className="text-sm text-muted-foreground">
                {filteredAutomations.length} of {automations.length} automations
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Automation Name</TableHead>
                    <TableHead>Live Runtime</TableHead>
                    <TableHead className="text-right">Executions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No automations match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((automation, index) => (
                      <TableRow
                        key={automation.id}
                        className={cn(
                          automation.status === 'Failed' && 'bg-destructive/5',
                          automation.status === 'Warning' && 'bg-warning/5'
                        )}
                      >
                        <TableCell className="font-medium">{automation.clientName}</TableCell>
                        <TableCell>{automation.automationName}</TableCell>
                        <TableCell>
                          <LiveRuntime 
                            startDate={getStartDate(index)} 
                            status={automation.status === 'Healthy' ? 'Active' : automation.status}
                          />
                        </TableCell>
                        <TableCell className="text-right">{automation.executionCount}</TableCell>
                        <TableCell>
                          <span className={cn('font-medium', getStatusColor(automation.status))}>
                            {automation.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            automation.manualIntervention
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {automation.manualIntervention ? 'Yes' : 'No'}
                          </span>
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
      </div>
    </div>
  );
}
