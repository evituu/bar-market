import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] font-sans">
      <main className="flex w-full max-w-7xl flex-col items-center justify-center py-16 px-6 md:px-10">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#E5E7EB] mb-6">
            Bar Market
          </h1>
          <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Bebidas com preços dinâmicos em tempo real. Quanto maior a demanda, 
            maior o preço. Acompanhe o mercado e faça seu pedido no momento certo.
          </p>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Menu Card */}
          <Link href="/menu" className="group">
            <article className="relative bg-[#111827] border border-[#1F2937] rounded-lg p-10 transition-all duration-300 hover:border-[#2563EB] hover:shadow-xl hover:shadow-[#2563EB]/10 hover:-translate-y-1">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB]/20 transition-colors">
                <TrendingUp className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-3 group-hover:text-[#2563EB] transition-colors">
                  Menu Interativo
                </h2>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center text-[#2563EB] font-medium group-hover:gap-2 transition-all">
                <span>Acessar Menu</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-bl-full blur-2xl -z-10 group-hover:bg-[#2563EB]/10 transition-colors" />
            </article>
          </Link>

          {/* Telão Card */}
          <Link href="/telao" className="group">
            <article className="relative bg-[#111827] border border-[#1F2937] rounded-lg p-10 transition-all duration-300 hover:border-[#16A34A] hover:shadow-xl hover:shadow-[#16A34A]/10 hover:-translate-y-1">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#16A34A]/10 text-[#16A34A] group-hover:bg-[#16A34A]/20 transition-colors">
                <svg 
                  className="w-7 h-7" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-3 group-hover:text-[#16A34A] transition-colors">
                  Telão ao Vivo
                </h2>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center text-[#16A34A] font-medium group-hover:gap-2 transition-all">
                <span>Ver Telão</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 rounded-bl-full blur-2xl -z-10 group-hover:bg-[#16A34A]/10 transition-colors" />
            </article>
          </Link>
        </div>

        {/* Footer Info */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-[#9CA3AF]">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
              Sistema de precificação em tempo real ativo
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
