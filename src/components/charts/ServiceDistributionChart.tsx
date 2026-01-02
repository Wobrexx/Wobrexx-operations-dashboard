import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/contexts/DashboardContext';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function ServiceDistributionChart() {
  const { customers } = useDashboard();

  // Compute service distribution dynamically from customers
  const serviceData = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === 'Active');
    const total = activeCustomers.length;
    
    if (total === 0) {
      return [
        { name: 'Website', value: 0, count: 0 },
        { name: 'Software', value: 0, count: 0 },
        { name: 'Automation', value: 0, count: 0 },
      ];
    }

    const website = activeCustomers.filter(c => c.serviceType === 'Website').length;
    const software = activeCustomers.filter(c => c.serviceType === 'Software').length;
    const automation = activeCustomers.filter(c => c.serviceType === 'Automation').length;
    const mixed = activeCustomers.filter(c => c.serviceType === 'Mixed').length;

    const data = [
      { name: 'Website', value: Math.round((website / total) * 100), count: website },
      { name: 'Software', value: Math.round((software / total) * 100), count: software },
      { name: 'Automation', value: Math.round((automation / total) * 100), count: automation },
    ];

    if (mixed > 0) {
      data.push({ name: 'Mixed', value: Math.round((mixed / total) * 100), count: mixed });
    }

    return data;
  }, [customers]);

  const total = serviceData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Service Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {serviceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [`${value} customers`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Service Breakdown</p>
          <div className="space-y-2">
            {serviceData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm font-medium flex-1">{item.name}</span>
                <span className="text-sm font-semibold">{item.count}</span>
                <span className="text-xs text-muted-foreground">({item.value}%)</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Total active customers: {total}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}