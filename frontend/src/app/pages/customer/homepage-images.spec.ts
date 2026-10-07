import { HomepageBanner, parseHomepageImages } from './homepage-images';

describe('S3 homepage images', () => {
  const defaults: HomepageBanner[] = [{ department: 'men', label: 'Men', caption: 'Style', images: ['fallback.png'], darkText: false }];
  const image = '/homepage/images/banners/men/01.png?v=abc';
  it('loads every valid slide and preserves category metadata', () => {
    const result = parseHomepageImages({ version: 1, banners: [
      { department: 'men', images: [image] }, { department: 'men', images: [image.replace('01', '02')] }
    ], categories: { men: '/homepage/images/categories/men/photo.webp?v=abc' } }, defaults)!;
    expect(result.banners.length).toBe(2);
    expect(result.banners[0].label).toBe('Men');
    expect(result.banners[0].mobileImages).toEqual([image]);
    expect(result.categories['men']).toContain('photo.webp');
  });
  it('uses optional mobile photos without trusting arbitrary URLs', () => {
    const mobile = '/homepage/images/mobile/men/01.png?v=xyz';
    const result = parseHomepageImages({ version: 1, banners: [{ department: 'men', images: [image, image], mobileImages: [mobile, 'https://untrusted.example/a.png'] }] }, defaults)!;
    expect(result.banners[0].mobileImages).toEqual([mobile, image]);
  });
  it('rejects missing, malformed and empty manifests so fallback remains available', () => {
    for (const value of [null, '<html>', {}, { version: 2, banners: [] }, { version: 1, banners: [] }]) {
      expect(parseHomepageImages(value, defaults)).toBeNull();
    }
  });
  it('ignores unsupported departments, invalid paths and executable image types', () => {
    const entries = [
      { department: 'unknown', images: [image] },
      ...['https://example.com/a.png', '//example.com/a.png', '/homepage/images/banners/men/../a.png', '/homepage/images/banners/men/a.svg', '/homepage/images/banners/women/a.png'].map(url => ({ department: 'men', images: [url] }))
    ];
    expect(parseHomepageImages({ version: 1, banners: entries }, defaults)).toBeNull();
  });
});
