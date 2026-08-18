'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const AnalyticsSection: React.FC = () => {
  const { logs } = useApp();

  // 1. Prepare Pie Chart Data: Aggregated count by Violation Name
  const pieMap: Record<string, number> = {};
  logs.forEach((l) => {
    pieMap[l.violation_name] = (pieMap[l.violation_name] || 0) + 1;
  });

  const pieData = Object.keys(pieMap).map((name) => ({
    name,
    value: pieMap[name]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const PIE_COLORS = ['#005a71', '#0e7490', '#006b5f', '#d97706', '#ba1a1a'];

  // 2. Prepare Line Chart Data: Trend over the past 4 weeks for Rendah, Sedang, Tinggi
  const now = new Date();
  const lineData = [
    { week: 'Minggu -3', Rendah: 0, Sedang: 0, Tinggi: 0 },
    { week: 'Minggu -2', Rendah: 0, Sedang: 0, Tinggi: 0 },
    { week: 'Minggu -1', Rendah: 0, Sedang: 0, Tinggi: 0 },
    { week: 'Minggu Ini', Rendah: 0, Sedang: 0, Tinggi: 0 },
  ];

  logs.forEach(l => {
    if (!l.created_at) return;
    const logDate = new Date(l.created_at);
    const diffDays = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays >= 0 && diffDays < 28) {
      let weekIndex;
      if (diffDays < 7) weekIndex = 3;       // Minggu Ini
      else if (diffDays < 14) weekIndex = 2; // Minggu -1
      else if (diffDays < 21) weekIndex = 1; // Minggu -2
      else weekIndex = 0;                    // Minggu -3
      
      const category = l.category as 'Rendah' | 'Sedang' | 'Tinggi';
      if (category === 'Rendah' || category === 'Sedang' || category === 'Tinggi') {
        lineData[weekIndex][category]++;
      }
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-['Work_Sans']">
      {/* Pie Chart Card (5 columns) */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#005a71] flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-['Manrope'] font-semibold text-base text-[#0b1c30]">
                  Jenis Pelanggaran Terbanyak
                </h3>
                <p className="text-xs text-[#6f787d]">Persentase kategori kejadian di sekolah</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6f787d]">
                Belum ada insiden pelanggaran tercatat.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #bec8cd',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Custom Legend */}
        <div className="mt-2 space-y-1.5 border-t border-[#bec8cd]/20 pt-3 text-xs">
          {pieData.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate text-[#3f484c] font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-[#0b1c30]">{item.value} kejadian</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Chart Card (7 columns) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-['Manrope'] font-semibold text-base text-[#0b1c30]">
                  Tren Insiden Pelanggaran (1 Bulan Terakhir)
                </h3>
                <p className="text-xs text-[#6f787d]">Visualisasi tingkat insiden Rendah, Sedang, & Tinggi</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" stroke="#6f787d" fontSize={11} />
                <YAxis stroke="#6f787d" fontSize={11} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #bec8cd',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="Rendah"
                  stroke="#0e7490"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0e7490' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Sedang"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#d97706' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tinggi"
                  stroke="#ba1a1a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ba1a1a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 text-xs text-[#6f787d] bg-[#eff4ff] p-3 rounded-xl border border-[#dce9ff] flex items-center justify-between">
          <span>* Trendline di-update otomatis melalui Supabase Server Actions & Triggers.</span>
          <span className="font-bold text-[#005a71]">Garis Smoothed (Curved)</span>
        </div>
      </div>
    </div>
  );
};
