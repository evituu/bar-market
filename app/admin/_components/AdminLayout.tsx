'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  ArrowLeft,
  Activity,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/categories', label: 'Categorias', icon: Tags },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Header */}
      <header className="bg-[#111827] border-b border-[#1F2937] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#F59E0B]" />
                <span className="text-xl font-bold text-[#E5E7EB] font-market">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse" />
              <span className="font-market-medium">Mercado Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
