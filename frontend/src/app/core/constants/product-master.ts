// Shared Product Code Master constants
// Source: Foreign_Fits_Product_Code_Master
// Used by Add Product (category/product selection + code suggestion)
// and Inventory (Filter by Category / Filter by Product)

export interface DepartmentOption {
  value: string;
  label: string;
}

export interface ProductTypeOption {
  label: string;
  code: string;
}

export const DEPARTMENTS: DepartmentOption[] = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
  { value: 'newborn', label: 'Newborn' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'uwr-men', label: 'Underwear - Men' },
  { value: 'uwr-women', label: 'Underwear - Women' },
  { value: 'uwr-kids', label: 'Underwear - Kids' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'toys', label: 'Toys' }
];

export const DEPARTMENT_PRODUCT_TYPES: Record<string, ProductTypeOption[]> = {
  men: [
    { label: 'T-Shirt', code: 'TSH' }, { label: 'Polo T-Shirt', code: 'POL' },
    { label: 'Shirt', code: 'SHT' }, { label: 'Casual Shirt', code: 'CSH' },
    { label: 'Formal Shirt', code: 'FSH' }, { label: 'Jeans', code: 'JNS' },
    { label: 'Trouser', code: 'TRS' }, { label: 'Formal Trouser', code: 'FTR' },
    { label: 'Cargo Pant', code: 'CRG' }, { label: 'Jogger', code: 'JGR' },
    { label: 'Track Pant', code: 'TRK' }, { label: 'Shorts', code: 'SRT' },
    { label: 'Jacket', code: 'JKT' }, { label: 'Denim Jacket', code: 'DJK' },
    { label: 'Puffer Jacket', code: 'PJK' }, { label: 'Hoodie', code: 'HOD' },
    { label: 'Sweatshirt', code: 'SWS' }, { label: 'Sweater', code: 'SWT' },
    { label: 'Blazer', code: 'BLZ' }, { label: 'Co-ord Set', code: 'CRS' },
    { label: 'Kurta', code: 'KRT' }, { label: 'Sports T-Shirt', code: 'STS' },
    { label: 'Sports Set', code: 'SPS' }, { label: 'Vest', code: 'VST' }
  ],
  women: [
    { label: 'Top', code: 'TOP' }, { label: 'T-Shirt', code: 'TSH' },
    { label: 'Shirt', code: 'SHT' }, { label: 'One Piece Dress', code: 'ONE' },
    { label: 'Two Piece Set', code: 'TWO' }, { label: 'Three Piece Set', code: 'THR' },
    { label: 'Co-ord Set', code: 'CRS' }, { label: 'Party Wear', code: 'PTY' },
    { label: 'Gown', code: 'GWN' }, { label: 'Maxi Dress', code: 'MAX' },
    { label: 'Mini Dress', code: 'MNI' }, { label: 'Midi Dress', code: 'MID' },
    { label: 'Jumpsuit', code: 'JMP' }, { label: 'Palazzo', code: 'PLZ' },
    { label: 'Jeans', code: 'JNS' }, { label: 'Trouser', code: 'TRS' },
    { label: 'Cargo', code: 'CRG' }, { label: 'Legging', code: 'LEG' },
    { label: 'Skirt', code: 'SKT' }, { label: 'Shorts', code: 'SRT' },
    { label: 'Jacket', code: 'JKT' }, { label: 'Denim Jacket', code: 'DJK' },
    { label: 'Sweater', code: 'SWT' }, { label: 'Hoodie', code: 'HOD' },
    { label: 'Sweatshirt', code: 'SWS' }, { label: 'Shrug', code: 'SHR' },
    { label: 'Cardigan', code: 'CDG' }, { label: 'Nightwear', code: 'NGW' },
    { label: 'Maternity Wear', code: 'MAT' }
  ],
  kids: [
    { label: 'T-Shirt', code: 'TSH' }, { label: 'Shirt', code: 'SHT' },
    { label: 'Top', code: 'TOP' }, { label: 'Jeans', code: 'JNS' },
    { label: 'Trouser', code: 'TRS' }, { label: 'Jogger', code: 'JGR' },
    { label: 'Track Pant', code: 'TRK' }, { label: 'Shorts', code: 'SRT' },
    { label: 'Dress', code: 'DRS' }, { label: 'Frock', code: 'FRK' },
    { label: 'Party Wear', code: 'PTY' }, { label: 'Two Piece Set', code: 'TWO' },
    { label: 'Three Piece Set', code: 'THR' }, { label: 'Co-ord Set', code: 'CRS' },
    { label: 'Jacket', code: 'JKT' }, { label: 'Dual Wear Jacket', code: 'DWJ' },
    { label: 'Denim Jacket', code: 'DJK' }, { label: 'Puffer Jacket', code: 'PJK' },
    { label: 'Hoodie', code: 'HOD' }, { label: 'Sweater', code: 'SWT' },
    { label: 'Sweatshirt', code: 'SWS' }, { label: 'Nightwear', code: 'NGW' },
    { label: 'Ethnic Wear', code: 'ETH' }, { label: 'Sports Set', code: 'SPS' },
    { label: 'School Wear', code: 'SCH' }
  ],
  newborn: [
    { label: 'Romper', code: 'ROM' }, { label: 'Bodysuit', code: 'BDS' },
    { label: 'Baby Set', code: 'SET' }, { label: 'T-Shirt', code: 'TSH' },
    { label: 'Top', code: 'TOP' }, { label: 'Pant', code: 'PNT' },
    { label: 'Shorts', code: 'SRT' }, { label: 'Frock', code: 'FRK' },
    { label: 'Dress', code: 'DRS' }, { label: 'Jacket', code: 'JKT' },
    { label: 'Sweater', code: 'SWT' }, { label: 'Sleepsuit', code: 'SLP' },
    { label: 'Night Suit', code: 'NGT' }, { label: 'Swaddle', code: 'SWD' },
    { label: 'Bib', code: 'BIB' }, { label: 'Cap', code: 'CAP' },
    { label: 'Socks', code: 'SOC' }, { label: 'Mittens', code: 'MIT' },
    { label: 'Baby Blanket', code: 'BLK' }, { label: 'Gift Set', code: 'GFT' }
  ],
  footwear: [
    { label: 'Men Casual Shoes', code: 'MCS' }, { label: 'Men Formal Shoes', code: 'MFS' },
    { label: 'Men Sports Shoes', code: 'MSS' }, { label: 'Men Slippers', code: 'MSL' },
    { label: 'Men Sandals', code: 'MSD' }, { label: 'Women Casual Shoes', code: 'WCS' },
    { label: 'Women Heels', code: 'WHL' }, { label: 'Women Flats', code: 'WFL' },
    { label: 'Women Sandals', code: 'WSD' }, { label: 'Women Slippers', code: 'WSL' },
    { label: 'Kids Shoes', code: 'KSH' }, { label: 'Kids Sports Shoes', code: 'KSS' },
    { label: 'Kids Sandals', code: 'KSD' }, { label: 'Kids Slippers', code: 'KSL' },
    { label: 'Baby Shoes', code: 'BSH' }
  ],
  'uwr-men': [
    { label: 'Brief', code: 'BRF' }, { label: 'Boxer', code: 'BOX' },
    { label: 'Trunk', code: 'TRK' }, { label: 'Vest', code: 'VST' },
    { label: 'Innerwear Set', code: 'SET' }
  ],
  'uwr-women': [
    { label: 'Panty', code: 'PNT' }, { label: 'Bra', code: 'BRA' },
    { label: 'Innerwear Set', code: 'SET' }
  ],
  'uwr-kids': [
    { label: 'Brief', code: 'BRF' }, { label: 'Boxer', code: 'BOX' },
    { label: 'Underwear Set', code: 'SET' }
  ],
  accessories: [
    { label: 'Belt', code: 'BLT' }, { label: 'Wallet', code: 'WLT' },
    { label: 'Cap', code: 'CAP' }, { label: 'Sunglasses', code: 'SUN' },
    { label: 'Watch', code: 'WAT' }, { label: "Men's Bag", code: 'MBG' },
    { label: "Women's Handbag", code: 'WHB' }, { label: 'Sling Bag', code: 'SLG' },
    { label: 'Backpack', code: 'BPK' }, { label: 'Kids Bag', code: 'KBG' },
    { label: 'School Bag', code: 'SBG' }, { label: 'Hair Accessory', code: 'HAR' },
    { label: 'Scarf', code: 'SCF' }, { label: 'Gloves', code: 'GLV' },
    { label: 'Socks', code: 'SOC' }, { label: 'Tie', code: 'TIE' },
    { label: 'Bow Tie', code: 'BOW' }, { label: 'Jewellery', code: 'JWL' },
    { label: 'Bracelet', code: 'BRC' }, { label: 'Necklace', code: 'NCK' }
  ],
  toys: [
    { label: 'Soft Toy', code: 'SFT' }, { label: 'Car Toy', code: 'CAR' },
    { label: 'Remote Control Toy', code: 'RCT' }, { label: 'Doll', code: 'DOL' },
    { label: 'Educational Toy', code: 'EDU' }, { label: 'Building Blocks', code: 'BLK' },
    { label: 'Puzzle', code: 'PUZ' }, { label: 'Musical Toy', code: 'MUS' },
    { label: 'Baby Toy', code: 'BAB' }, { label: 'Outdoor Toy', code: 'OUT' },
    { label: 'Gun Toy', code: 'GTY' }, { label: 'Robot', code: 'ROB' },
    { label: 'Kitchen Set', code: 'KIT' }, { label: 'Doctor Set', code: 'DOC' },
    { label: 'General Toy', code: 'GEN' }
  ]
};

export function mapDepartmentToCategory(department: string): string {
  switch (department) {
    case 'footwear': return 'shoes';
    case 'accessories':
    case 'toys':
    case 'uwr-men':
    case 'uwr-women':
    case 'uwr-kids':
      return 'accessories';
    default: return 'shirts';
  }
}

export function mapDepartmentToSubcategory(department: string): string {
  switch (department) {
    case 'men':
    case 'uwr-men':
      return 'mens';
    case 'women':
    case 'uwr-women':
      return 'womens';
    case 'kids':
    case 'uwr-kids':
      return 'kids';
    case 'newborn':
      return 'infant';
    case 'footwear':
    case 'accessories':
    case 'toys':
      return 'unisex';
    default:
      return '';
  }
}

// Best-effort reverse mapping: derive department from a product's code/subcategory
export function deriveDepartmentFromCodeOrSubcategory(productCode: string | undefined, subcategory: string | undefined): string {
  const code = productCode || '';
  if (code.startsWith('FF-UWR-MEN')) return 'uwr-men';
  if (code.startsWith('FF-UWR-WOM')) return 'uwr-women';
  if (code.startsWith('FF-UWR-KID')) return 'uwr-kids';
  if (code.startsWith('FF-MEN')) return 'men';
  if (code.startsWith('FF-WOM')) return 'women';
  if (code.startsWith('FF-KID')) return 'kids';
  if (code.startsWith('FF-BAB')) return 'newborn';
  if (code.startsWith('FF-FWT')) return 'footwear';
  if (code.startsWith('FF-ACC')) return 'accessories';
  if (code.startsWith('FF-TOY')) return 'toys';

  switch ((subcategory || '').toLowerCase()) {
    case 'mens': return 'men';
    case 'womens': return 'women';
    case 'kids':
    case 'boys':
    case 'girls':
      return 'kids';
    case 'infant':
    case 'toddler':
      return 'newborn';
    default: return '';
  }
}
