import Link from "next/link";
import { ArrowUpRight, TrendingUp, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center font-sans overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/CandleStick_Fundo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <main className="relative z-10 flex w-full max-w-7xl flex-col items-center justify-center py-16 px-6 md:px-10">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="/logo_bar_market.svg"
              alt="Bar Market Logo"
              className="w-16 h-16 md:w-20 md:h-20"
            />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#E5E7EB]">
              Bar Market
            </h1>
          </div>
          <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Bebidas com preços dinâmicos em tempo real. Quanto maior a demanda, 
            maior o preço. Acompanhe o mercado e faça seu pedido no momento certo.
          </p>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Admin Card */}
          <Link href="/admin" className="group">
            <article className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 transition-all duration-300 hover:border-[#F59E0B]/50 hover:shadow-2xl hover:shadow-[#F59E0B]/20 hover:-translate-y-1 hover:bg-white/10">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] group-hover:bg-[#F59E0B]/20 transition-colors">
                <Settings className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-3 group-hover:text-[#F59E0B] transition-colors">
                  Central de Operações
                </h2>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center text-[#F59E0B] font-medium group-hover:gap-2 transition-all">
                <span>Gerenciar</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-bl-full blur-3xl -z-10 group-hover:bg-[#F59E0B]/20 transition-colors" />
            </article>
          </Link>

          {/* Telão Card */}
          <Link href="/telao" className="group">
            <article className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 transition-all duration-300 hover:border-[#16A34A]/50 hover:shadow-2xl hover:shadow-[#16A34A]/20 hover:-translate-y-1 hover:bg-white/10">
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/10 rounded-bl-full blur-3xl -z-10 group-hover:bg-[#16A34A]/20 transition-colors" />
            </article>
          </Link>

          {/* Menu Card */}
          <Link href="/menu" className="group">
            <article className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 transition-all duration-300 hover:border-[#2563EB]/50 hover:shadow-2xl hover:shadow-[#2563EB]/20 hover:-translate-y-1 hover:bg-white/10">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB]/20 transition-colors">
                <TrendingUp className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-3 group-hover:text-[#2563EB] transition-colors">
                  Cardápio
                </h2>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center text-[#2563EB] font-medium group-hover:gap-2 transition-all">
                <span>Acessar Menu</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 rounded-bl-full blur-3xl -z-10 group-hover:bg-[#2563EB]/20 transition-colors" />
            </article>
          </Link>
        </div>

      </main>
    </div>
  );
}
