'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  productCount: number;
}

interface CategoriesTableProps {
  categories: Category[];
}

export function CategoriesTable({ categories: initialCategories }: CategoriesTableProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValue(category.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) return;

    // TODO: Chamar API para salvar
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, name: editValue.trim() } : cat
      )
    );
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;

    // TODO: Chamar API para criar
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      order: categories.length + 1,
      isActive: true,
      productCount: 0,
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCategoryName('');
    setIsCreating(false);
  };

  const handleToggleStatus = async (id: string) => {
    // TODO: Chamar API para alterar status
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
      )
    );
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((cat) => cat.id === id);
    if (!category) return;

    if (category.productCount > 0) {
      alert(
        `Não é possível excluir a categoria "${category.name}" pois ela possui ${category.productCount} produto(s).`
      );
      return;
    }

    if (!confirm(`Deseja realmente excluir a categoria "${category.name}"?`)) {
      return;
    }

    // TODO: Chamar API para excluir
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1F2937] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#E5E7EB]">
            Categorias do Mercado
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Organize as categorias que aparecem no telão e menu
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0B0F14] rounded-lg text-sm font-semibold hover:bg-[#D97706] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1F2937]/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Ordem
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Produtos
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {/* New Category Row */}
            {isCreating && (
              <tr className="bg-[#F59E0B]/5">
                <td className="px-4 py-3">
                  <span className="text-[#9CA3AF]">—</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria..."
                    autoFocus
                    className="w-full px-3 py-1.5 bg-[#0B0F14] border border-[#F59E0B] rounded text-sm text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewCategoryName('');
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-[#9CA3AF]">
                    {categories.length + 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-[#9CA3AF]">0</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00E676]/10 text-[#00E676]">
                    Ativo
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleCreate}
                      className="p-2 text-[#00E676] hover:bg-[#1F2937] rounded-lg transition-colors"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 text-[#FF1744] hover:bg-[#1F2937] rounded-lg transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Category Rows */}
            {categories.map((category, index) => (
              <tr
                key={category.id}
                className="hover:bg-[#1F2937]/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <button className="p-1 text-[#9CA3AF] hover:text-[#E5E7EB] cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {editingId === category.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-1.5 bg-[#0B0F14] border border-[#F59E0B] rounded text-sm text-[#E5E7EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(category.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  ) : (
                    <span className="text-sm font-medium text-[#E5E7EB]">
                      {category.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-market-medium text-[#9CA3AF]">
                    {category.order}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-market-medium text-[#E5E7EB]">
                    {category.productCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-[#00E676]/10 text-[#00E676]'
                        : 'bg-[#FF1744]/10 text-[#FF1744]'
                    }`}
                  >
                    {category.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {editingId === category.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          className="p-2 text-[#00E676] hover:bg-[#1F2937] rounded-lg transition-colors"
                          title="Salvar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-[#FF1744] hover:bg-[#1F2937] rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#1F2937] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(category.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            category.isActive
                              ? 'text-[#00E676] hover:bg-[#1F2937]'
                              : 'text-[#FF1744] hover:bg-[#1F2937]'
                          }`}
                          title={category.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {category.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-[#9CA3AF] hover:text-[#FF1744] hover:bg-[#1F2937] rounded-lg transition-colors"
                          title="Excluir"
                          disabled={category.productCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && !isCreating && (
          <div className="px-4 py-12 text-center text-sm text-[#9CA3AF]">
            Nenhuma categoria cadastrada
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1F2937]">
        <p className="text-xs text-[#9CA3AF]">
          {categories.length} categoria(s) cadastrada(s)
        </p>
      </div>
    </div>
  );
}
