import { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Globe, Code, Cog } from 'lucide-react';
import { useDashboard, Project } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditableCell } from '@/components/dashboard/EditableCell';
import { LiveRuntime } from '@/components/dashboard/LiveRuntime';
import { SearchFilter, FilterConfig } from '@/components/dashboard/SearchFilter';
import { TablePagination } from '@/components/dashboard/TablePagination';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'Live', label: 'Live' },
  { value: 'Development', label: 'Development' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Completed', label: 'Completed' },
];

const maintenanceOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const serviceIcons = {
  Website: Globe,
  Software: Code,
  Automation: Cog,
};

const filters: FilterConfig[] = [
  { key: 'status', label: 'Status', options: statusOptions },
  { key: 'maintenance', label: 'Maintenance', options: maintenanceOptions },
];

export default function Services() {
  const { projects, setProjects } = useDashboard();
  const [activeTab, setActiveTab] = useState<'Website' | 'Software' | 'Automation'>('Website');
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    maintenance: 'all',
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (project.type !== activeTab) return false;

      if (searchValue) {
        const search = searchValue.toLowerCase();
        const matchesSearch =
          project.clientName.toLowerCase().includes(search) ||
          project.projectName.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (filterValues.status !== 'all' && project.status !== filterValues.status) {
        return false;
      }

      if (filterValues.maintenance !== 'all') {
        const hasMaintenance = filterValues.maintenance === 'yes';
        if (project.maintenance !== hasMaintenance) return false;
      }

      return true;
    });
  }, [projects, activeTab, searchValue, filterValues]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredProjects);

  const typeProjectsCount = projects.filter((p) => p.type === activeTab).length;

  const updateProject = (id: string, field: keyof Project, value: string | number | boolean) => {
    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      clientName: 'New Client',
      projectName: 'New Project',
      status: 'Development',
      maintenance: false,
      revenue: 0,
      notes: '',
      type: activeTab,
      startDate: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  const getMetrics = (type: 'Website' | 'Software' | 'Automation') => {
    const typeProjects = projects.filter((p) => p.type === type);
    return {
      total: typeProjects.length,
      live: typeProjects.filter((p) => p.status === 'Live').length,
      maintenance: typeProjects.filter((p) => p.maintenance).length,
      paused: typeProjects.filter((p) => p.status === 'Paused').length,
    };
  };

  const ServiceIcon = serviceIcons[activeTab];

  const getProjectStartDate = (project: Project, index: number) => {
    if (project.startDate) {
      return new Date(project.startDate);
    }
    const now = new Date();
    const daysAgo = [30, 45, 15, 60, 7][index % 5];
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Services</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage projects by service type
          </p>
        </div>
        <Button onClick={addProject} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="Website" className="gap-2">
            <Globe className="h-4 w-4" />
            Website
          </TabsTrigger>
          <TabsTrigger value="Software" className="gap-2">
            <Code className="h-4 w-4" />
            Software
          </TabsTrigger>
          <TabsTrigger value="Automation" className="gap-2">
            <Cog className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {(['Website', 'Software', 'Automation'] as const).map((type) => {
          const metrics = getMetrics(type);
          return (
            <TabsContent key={type} value={type} className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Projects</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-success">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Live</p>
                    <p className="text-2xl font-bold text-success">{metrics.live}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-info">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Maintenance</p>
                    <p className="text-2xl font-bold text-info">{metrics.maintenance}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-warning">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Paused</p>
                    <p className="text-2xl font-bold text-warning">{metrics.paused}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search & Filter */}
              <SearchFilter
                searchPlaceholder="Search by client or project name..."
                filters={filters}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                searchValue={searchValue}
                filterValues={filterValues}
              />

              {/* Projects Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ServiceIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-semibold">{type} Projects</CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {filteredProjects.length} of {typeProjectsCount} projects
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Live Runtime</TableHead>
                        <TableHead>Maintenance</TableHead>
                        <TableHead className="text-right">Revenue ($)</TableHead>
                        <TableHead className="w-[150px]">Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {typeProjectsCount === 0
                              ? `No ${type.toLowerCase()} projects yet. Click "Add Project" to create one.`
                              : 'No projects match your search criteria.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((project, index) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">
                              <EditableCell
                                value={project.clientName}
                                onChange={(v) => updateProject(project.id, 'clientName', v)}
                              />
                            </TableCell>
                            <TableCell>
                              <EditableCell
                                value={project.projectName}
                                onChange={(v) => updateProject(project.id, 'projectName', v)}
                              />
                            </TableCell>
                            <TableCell>
                              <EditableCell
                                value={project.status}
                                type="select"
                                options={statusOptions}
                                onChange={(v) => updateProject(project.id, 'status', v)}
                              />
                            </TableCell>
                            <TableCell>
                              <LiveRuntime 
                                startDate={getProjectStartDate(project, index)} 
                                status={project.status}
                              />
                            </TableCell>
                            <TableCell>
                              <EditableCell
                                value={project.maintenance}
                                type="boolean"
                                onChange={(v) => updateProject(project.id, 'maintenance', v)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <EditableCell
                                value={project.revenue}
                                type="currency"
                                onChange={(v) => updateProject(project.id, 'revenue', v)}
                              />
                            </TableCell>
                            <TableCell>
                              <EditableCell
                                value={project.notes}
                                onChange={(v) => updateProject(project.id, 'notes', v)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteProject(project.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
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
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
