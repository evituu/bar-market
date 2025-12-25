'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = '#2563EB',
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#9CA3AF] mb-1">{title}</p>
          <p className="text-3xl font-bold font-market-semibold text-[#E5E7EB]">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
