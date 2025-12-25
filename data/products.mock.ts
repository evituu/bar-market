export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  basePriceCents: number;
  priceFloorCents: number;
  priceCapCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'CHOPE-PILSEN-300',
    name: 'Chope Pilsen 300ml',
    description: 'Chope clássico, sempre gelado',
    category: 'Chopes',
    isActive: true,
    basePriceCents: 1800,
    priceFloorCents: 1200,
    priceCapCents: 3200,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-2',
    sku: 'IPA-473',
    name: 'IPA Lata 473ml',
    description: 'India Pale Ale artesanal',
    category: 'Cervejas',
    isActive: true,
    basePriceCents: 2400,
    priceFloorCents: 1800,
    priceCapCents: 4200,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-3',
    sku: 'GIN-TONICA',
    name: 'Gin Tônica',
    description: 'Gin premium com tônica e limão siciliano',
    category: 'Drinks',
    isActive: true,
    basePriceCents: 3200,
    priceFloorCents: 2400,
    priceCapCents: 5600,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-4',
    sku: 'CAIP-LIMAO',
    name: 'Caipirinha Limão',
    description: 'Cachaça artesanal com limão',
    category: 'Drinks',
    isActive: true,
    basePriceCents: 2600,
    priceFloorCents: 1900,
    priceCapCents: 4800,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-5',
    sku: 'SHOT-TEQUILA',
    name: 'Shot Tequila',
    description: 'Tequila prata premium',
    category: 'Shots',
    isActive: true,
    basePriceCents: 1900,
    priceFloorCents: 1200,
    priceCapCents: 3600,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-6',
    sku: 'CAIP-MORANGO',
    name: 'Caipirinha Morango',
    description: 'Cachaça com morangos frescos',
    category: 'Drinks',
    isActive: true,
    basePriceCents: 2800,
    priceFloorCents: 2000,
    priceCapCents: 5000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-7',
    sku: 'VODKA-RED',
    name: 'Vodka Red Bull',
    description: 'Vodka premium com energético',
    category: 'Drinks',
    isActive: true,
    basePriceCents: 2900,
    priceFloorCents: 2100,
    priceCapCents: 5200,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-8',
    sku: 'HEINEKEN-LONG',
    name: 'Heineken Long Neck',
    description: 'Cerveja internacional 330ml',
    category: 'Cervejas',
    isActive: true,
    basePriceCents: 2200,
    priceFloorCents: 1600,
    priceCapCents: 3800,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];