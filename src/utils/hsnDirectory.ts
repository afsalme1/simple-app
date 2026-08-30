export interface HSNDirectoryItem {
  code: string;
  type: 'GOODS' | 'SERVICES';
  description: string;
  defaultGstRate: number;
  category: string;
}

export const HSN_DIRECTORY: HSNDirectoryItem[] = [
  // Services (SAC - starts with 99)
  { code: '998311', type: 'SERVICES', description: 'Information technology (IT) consulting and support services', defaultGstRate: 18, category: 'IT & Software' },
  { code: '998312', type: 'SERVICES', description: 'Web design, development, and hosting services', defaultGstRate: 18, category: 'IT & Software' },
  { code: '998313', type: 'SERVICES', description: 'Software design and development services', defaultGstRate: 18, category: 'IT & Software' },
  { code: '998314', type: 'SERVICES', description: 'IT infrastructure and network management services', defaultGstRate: 18, category: 'IT & Software' },
  { code: '998221', type: 'SERVICES', description: 'Accounting, auditing and bookkeeping services', defaultGstRate: 18, category: 'Professional' },
  { code: '998211', type: 'SERVICES', description: 'Legal advisory and representation services', defaultGstRate: 18, category: 'Professional' },
  { code: '998361', type: 'SERVICES', description: 'Advertising, marketing and PR services', defaultGstRate: 18, category: 'Marketing' },
  { code: '998399', type: 'SERVICES', description: 'Other professional, technical and business services n.e.c.', defaultGstRate: 18, category: 'Professional' },
  { code: '996511', type: 'SERVICES', description: 'Road transport services of goods including courier', defaultGstRate: 5, category: 'Logistics' },
  { code: '996331', type: 'SERVICES', description: 'Restaurant, takeaway and food catering services', defaultGstRate: 5, category: 'Hospitality' },
  { code: '996311', type: 'SERVICES', description: 'Hotel accommodation services with room rent up to ₹7,500', defaultGstRate: 12, category: 'Hospitality' },
  { code: '995411', type: 'SERVICES', description: 'General construction services of commercial buildings', defaultGstRate: 18, category: 'Construction' },
  { code: '998713', type: 'SERVICES', description: 'Maintenance and repair services of electronic equipment and computers', defaultGstRate: 18, category: 'Repair' },
  { code: '997212', type: 'SERVICES', description: 'Renting or leasing of commercial real estate', defaultGstRate: 18, category: 'Real Estate' },

  // Goods (HSN Codes)
  // Electronics & Hardware
  { code: '847130', type: 'GOODS', description: 'Laptops, notebooks, tablet computers and portable computers', defaultGstRate: 18, category: 'Electronics' },
  { code: '847141', type: 'GOODS', description: 'Desktop computers, servers and data processing units', defaultGstRate: 18, category: 'Electronics' },
  { code: '847160', type: 'GOODS', description: 'Keyboards, mouse, barcode scanners, input/output peripherals', defaultGstRate: 18, category: 'Electronics' },
  { code: '844332', type: 'GOODS', description: 'Printers, thermal POS printers, multifunction copiers', defaultGstRate: 18, category: 'Electronics' },
  { code: '851713', type: 'GOODS', description: 'Smartphones and mobile handsets', defaultGstRate: 18, category: 'Electronics' },
  { code: '852852', type: 'GOODS', description: 'Monitors, LED/LCD displays for computers', defaultGstRate: 18, category: 'Electronics' },
  { code: '850440', type: 'GOODS', description: 'Uninterruptible Power Supplies (UPS), inverters, power adapters', defaultGstRate: 18, category: 'Electronics' },
  { code: '852351', type: 'GOODS', description: 'Solid State Drives (SSD), USB flash drives, memory cards', defaultGstRate: 18, category: 'Electronics' },
  { code: '854442', type: 'GOODS', description: 'Electric cables, network LAN cables, HDMI cables', defaultGstRate: 18, category: 'Electrical' },

  // Stationery & Office Supplies
  { code: '482020', type: 'GOODS', description: 'Account books, note books, registers, receipt books', defaultGstRate: 18, category: 'Stationery' },
  { code: '480256', type: 'GOODS', description: 'A4 Copier paper (75/80 GSM), printing paper in reams', defaultGstRate: 12, category: 'Stationery' },
  { code: '481141', type: 'GOODS', description: 'Thermal paper rolls for billing machines and POS (58mm/80mm)', defaultGstRate: 12, category: 'Stationery' },
  { code: '960810', type: 'GOODS', description: 'Ball point pens, gel pens and markers', defaultGstRate: 18, category: 'Stationery' },

  // Textiles, Apparels & Footwear
  { code: '610910', type: 'GOODS', description: 'T-shirts, singlets and other vests, of cotton', defaultGstRate: 5, category: 'Textiles' },
  { code: '620342', type: 'GOODS', description: 'Men\'s or boys\' trousers, bib, jeans and shorts, of cotton', defaultGstRate: 12, category: 'Textiles' },
  { code: '620462', type: 'GOODS', description: 'Women\'s or girls\' trousers, dresses, skirts', defaultGstRate: 12, category: 'Textiles' },
  { code: '640399', type: 'GOODS', description: 'Footwear with outer soles of rubber/plastic and leather uppers', defaultGstRate: 12, category: 'Footwear' },

  // FMCG, Grocery & Food
  { code: '090240', type: 'GOODS', description: 'Packaged black tea, green tea and flavored tea leaves', defaultGstRate: 5, category: 'Food & FMCG' },
  { code: '090121', type: 'GOODS', description: 'Roasted and ground coffee powder, filter coffee', defaultGstRate: 5, category: 'Food & FMCG' },
  { code: '190531', type: 'GOODS', description: 'Sweet biscuits, cookies, rusks and bakery items', defaultGstRate: 18, category: 'Food & FMCG' },
  { code: '210690', type: 'GOODS', description: 'Packaged snack foods, namkeens, sweets and food preparations', defaultGstRate: 12, category: 'Food & FMCG' },
  { code: '220210', type: 'GOODS', description: 'Aerated waters, carbonated beverages with added sugar/flavor', defaultGstRate: 28, category: 'Beverages' },
  { code: '330499', type: 'GOODS', description: 'Beauty, cosmetic, skin care preparations and face wash', defaultGstRate: 18, category: 'Personal Care' },
  { code: '340111', type: 'GOODS', description: 'Soap bars and organic toilet soap preparations', defaultGstRate: 18, category: 'Personal Care' },

  // Industrial, Hardware & Machinery
  { code: '731815', type: 'GOODS', description: 'Screws, bolts, nuts, rivets and washers of iron or steel', defaultGstRate: 18, category: 'Hardware' },
  { code: '848180', type: 'GOODS', description: 'Taps, cocks, valves for pipes and plumbing appliances', defaultGstRate: 18, category: 'Plumbing' },
  { code: '391723', type: 'GOODS', description: 'PVC pipes, conduit tubes and plumbing fittings', defaultGstRate: 18, category: 'Plumbing' },
  { code: '320910', type: 'GOODS', description: 'Emulsion paints, acrylic distempers and wall primers', defaultGstRate: 18, category: 'Paints' },
  { code: '252329', type: 'GOODS', description: 'Portland cement, grey cement, ready-mix bags', defaultGstRate: 28, category: 'Construction' },
  { code: '721420', type: 'GOODS', description: 'TMT Steel bars, rods and structural construction steel', defaultGstRate: 18, category: 'Construction' },

  // Automobiles & Spares
  { code: '870829', type: 'GOODS', description: 'Motor vehicle spare parts and accessories', defaultGstRate: 28, category: 'Automotive' },
  { code: '401110', type: 'GOODS', description: 'New pneumatic tyres of rubber for passenger motor cars', defaultGstRate: 28, category: 'Automotive' },
  { code: '271019', type: 'GOODS', description: 'Engine oils, lubricating greases and brake fluids', defaultGstRate: 18, category: 'Automotive' }
];

export function searchHSNDirectory(query: string): HSNDirectoryItem[] {
  if (!query || query.trim() === '') return HSN_DIRECTORY.slice(0, 15);
  const q = query.trim().toLowerCase();
  return HSN_DIRECTORY.filter(item => 
    item.code.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
}
