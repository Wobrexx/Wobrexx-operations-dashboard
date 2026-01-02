import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/contexts/DashboardContext';

const COLORS: Record<string, string> = {
  'Active': 'hsl(var(--success))',
  'Paused': 'hsl(var(--warning))',
  'Opted Out': 'hsl(var(--destructive))',
};

export function CustomerStatusChart() {
  const { customers } = useDashboard();

  // Compute status counts dynamically from customers
  const statusData = useMemo(() => {
    const active = customers.filter(c => c.status === 'Active').length;
    const paused = customers.filter(c => c.status === 'Paused').length;
    const optedOut = customers.filter(c => c.status === 'Opted Out').length;
    
    return [
      { status: 'Active', count: active },
      { status: 'Paused', count: paused },
      { status: 'Opted Out', count: optedOut },
    ];
  }, [customers]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Customer Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status] || 'hsl(var(--chart-1))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Status Breakdown</p>
          <div className="space-y-2">
            {statusData.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[item.status] }}
                />
                <span className="text-sm font-medium flex-1">{item.status}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}