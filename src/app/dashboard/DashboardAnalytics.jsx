'use client';

import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import ExecutionDrilldownModal from '@/components/ExecutionDrilldownModal';

export default function DashboardAnalytics({ logs, isAdmin = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  // Process data for charts
  const { areaData, pieData } = useMemo(() => {
    if (!logs || logs.length === 0) return { areaData: [], pieData: [] };

    // Group by Date for Area Chart
    const daysMap = {};
    const statusCount = { COMPLETED: 0, FAILED: 0, ACTIVE: 0, CANCELLED: 0 };

    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[dateStr] = { name: dateStr, runs: 0, logs: [] };
    }

    logs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daysMap[dateStr]) {
        daysMap[dateStr].runs += 1;
        daysMap[dateStr].logs.push(log);
      }
      if (statusCount[log.status] !== undefined) {
        statusCount[log.status] += 1;
      }
    });

    const areaData = Object.values(daysMap);

    const pieData = [
      { name: 'Completed', value: statusCount.COMPLETED, color: '#10B981', logs: logs.filter(l => l.status === 'COMPLETED') },
      { name: 'Active', value: statusCount.ACTIVE, color: '#3B82F6', logs: logs.filter(l => l.status === 'ACTIVE') },
      { name: 'Failed', value: statusCount.FAILED + statusCount.CANCELLED, color: '#EF4444', logs: logs.filter(l => l.status === 'FAILED' || l.status === 'CANCELLED') },
    ].filter(d => d.value > 0);

    return { areaData, pieData };
  }, [logs]);

  const handleBarClick = (data) => {
    if (!data || !data.activePayload || !data.activePayload[0]) return;
    const payload = data.activePayload[0].payload;
    if (payload.logs.length === 0) return;
    setModalTitle(`Executions on ${payload.name}`);
    setModalData(payload.logs);
    setModalOpen(true);
  };

  const handlePieClick = (data) => {
    if (!data || data.logs.length === 0) return;
    setModalTitle(`${data.name} Executions`);
    setModalData(data.logs);
    setModalOpen(true);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-card border border-border-subtle rounded-sm p-6 h-[400px] flex items-center justify-center">
        <p className="text-text-secondary">No execution data available yet. Trigger a workflow to see analytics.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[400px]">
        {/* Area Chart */}
        <div className="md:col-span-2 bg-card border border-border-subtle rounded-sm p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-base font-medium text-foreground">Execution Volume (Last 14 Days)</h2>
            <p className="text-xs text-text-secondary mt-1">Click on a point to view specific runs.</p>
          </div>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A3A3A3' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A3A3A3' }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3B82F6' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="runs" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRuns)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#60A5FA' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border-subtle rounded-sm p-6 flex flex-col">
          <div className="mb-2">
            <h2 className="text-base font-medium text-foreground">Status Ratio</h2>
            <p className="text-xs text-text-secondary mt-1">Click a slice to drill down.</p>
          </div>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={handlePieClick}
                  className="cursor-pointer focus:outline-none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ExecutionDrilldownModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        data={modalData}
        isAdmin={isAdmin}
      />
    </>
  );
}
