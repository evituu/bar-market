'use client';

import { useMarketStream } from '@/lib/context';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  const { snapshot } = useMarketStream();

  // Extrai categorias únicas dos produtos
  const categories = snapshot?.products
    ? Array.from(new Set(snapshot.products.map((p) => p.category)))
    : [];

  // Adiciona "Todos" no início
  const allCategories = ['Todos', ...categories];

  return (
    <div className="sticky top-[105px] z-40 bg-[#0B0F14] border-b border-[#1F2937]">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const count =
            category === 'Todos'
              ? snapshot?.products.length ?? 0
              : snapshot?.products.filter((p) => p.category === category).length ?? 0;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${
                  isSelected
                    ? 'bg-[#F59E0B] text-[#0B0F14]'
                    : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#E5E7EB]'
                }
              `}
            >
              {category}
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${
                    isSelected
                      ? 'bg-[#0B0F14]/20 text-[#0B0F14]'
                      : 'bg-[#374151] text-[#9CA3AF]'
                  }
                `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
