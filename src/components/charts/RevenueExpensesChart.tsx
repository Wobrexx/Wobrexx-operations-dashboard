import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

export function RevenueExpensesChart() {
  const { chartData, setChartData } = useDashboard();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ revenue: '', expenses: '' });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues({
      revenue: chartData.revenueExpenses[index].revenue.toString(),
      expenses: chartData.revenueExpenses[index].expenses.toString(),
    });
  };

  const handleSave = () => {
    if (editingIndex === null) return;
    const newData = [...chartData.revenueExpenses];
    newData[editingIndex] = {
      ...newData[editingIndex],
      revenue: parseFloat(editValues.revenue) || 0,
      expenses: parseFloat(editValues.expenses) || 0,
    };
    setChartData({ ...chartData, revenueExpenses: newData });
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.revenueExpenses} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Edit Monthly Values</p>
          <div className="grid grid-cols-6 gap-2 text-xs">
            {chartData.revenueExpenses.map((item, index) => (
              <div key={item.month} className="space-y-1">
                <span className="font-medium text-muted-foreground">{item.month}</span>
                {editingIndex === index ? (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={editValues.revenue}
                      onChange={(e) => setEditValues({ ...editValues, revenue: e.target.value })}
                      className="h-6 text-xs"
                      placeholder="Revenue"
                    />
                    <Input
                      type="number"
                      value={editValues.expenses}
                      onChange={(e) => setEditValues({ ...editValues, expenses: e.target.value })}
                      className="h-6 text-xs"
                      placeholder="Expenses"
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSave}>
                        <Check className="h-3 w-3 text-success" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCancel}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(index)}
                    className="flex flex-col items-start hover:bg-muted/50 rounded p-1 -m-1 transition-colors w-full"
                  >
                    <span className="text-success">${item.revenue}</span>
                    <span className="text-warning">${item.expenses}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
