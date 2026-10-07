export interface HomepageBanner {
  department: string;
  label: string;
  caption: string;
  images: string[];
  mobileImages?: string[];
  darkText: boolean;
}

function safeImage(value: unknown, folder: string, department: string): value is string {
  if (typeof value !== 'string') return false;
  const prefix = `/homepage/images/${folder}/${department}/`;
  return value.startsWith(prefix) && /^[^/?#]+\.(png|jpe?g|webp|avif|gif)(\?v=[a-zA-Z0-9%-]*)?$/i.test(value.slice(prefix.length));
}

export function parseHomepageImages(value: unknown, defaults: HomepageBanner[]): { banners: HomepageBanner[]; categories: Record<string, string> } | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (data['version'] !== 1 || !Array.isArray(data['banners'])) return null;
  const banners: HomepageBanner[] = [];
  for (const entry of data['banners']) {
    if (!entry || typeof entry !== 'object') continue;
    const base = defaults.find(banner => banner.department === entry.department);
    if (!base || !Array.isArray(entry.images) || !entry.images.length || entry.images.length > 3) continue;
    if (!entry.images.every((url: unknown) => safeImage(url, 'banners', base.department))) continue;
    const mobileImages = entry.images.map((url: string, index: number) => {
      const mobile = Array.isArray(entry.mobileImages) ? entry.mobileImages[index] : null;
      return safeImage(mobile, 'mobile', base.department) || safeImage(mobile, 'banners', base.department) ? mobile : url;
    });
    banners.push({ ...base, images: entry.images, mobileImages });
  }
  const categories: Record<string, string> = {};
  if (data['categories'] && typeof data['categories'] === 'object') {
    for (const [department, url] of Object.entries(data['categories'])) {
      if (defaults.some(banner => banner.department === department) && safeImage(url, 'categories', department)) categories[department] = url;
    }
  }
  return banners.length ? { banners, categories } : null;
}
