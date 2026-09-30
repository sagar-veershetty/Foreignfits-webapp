import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Product } from '../models';

describe('AppService product image uploads', () => {
  let service: AppService;
  let http: HttpTestingController;
  const image = 'data:image/jpeg;base64,' + btoa('x'.repeat(12000));
  const product = { name: 'Upload test', category: 'shirts', size: 'M', color: 'Blue', sku: 'TEST',
    stock: 1, minStock: 0, imageUrls: [image] } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
  const upload = { mode: 'direct', uploadUrl: 'https://example.s3.amazonaws.com/upload',
    imageUrl: 'https://example.s3.amazonaws.com/image.jpg', headers: { 'Content-Type': 'image/jpeg' } };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: {} }] });
    service = TestBed.inject(AppService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  for (const method of ['POST', 'PUT']) {
    it(`waits for upload and sends URLs only in product ${method}`, () => {
      const save = method === 'POST' ? service.createProduct(product, 1, { cost: 1, salePrice: 2 }) : service.updateProduct('1', product);
      save.subscribe();
      http.expectNone(req => req.url.includes('/products'));
      http.expectOne(`${environment.apiUrl}/product-images/uploads`).flush(upload);
      http.expectNone(req => req.url.includes('/products'));
      http.expectOne(upload.uploadUrl).flush('');
      const request = http.expectOne(`${environment.apiUrl}/products${method === 'PUT' ? '/1' : ''}`);
      expect(request.request.method).toBe(method);
      expect(request.request.body.imageUrls).toEqual([upload.imageUrl]);
      expect(JSON.stringify(request.request.body).length).toBeLessThan(8192);
      request.flush({ ...request.request.body, id: 1, category: 'SHIRTS' });
      expect(service.appStateBehaviorSubject.value.isLoading).toBeFalse();
    });
  }

  it('does not save a product if its image upload fails', () => {
    service.createProduct(product, 1, { cost: 1, salePrice: 2 }).subscribe({ error: () => {} });
    http.expectOne(`${environment.apiUrl}/product-images/uploads`).flush(upload);
    http.expectOne(upload.uploadUrl).flush('', { status: 403, statusText: 'Forbidden' });
    http.expectNone(`${environment.apiUrl}/products`);
    expect(service.appStateBehaviorSubject.value.isLoading).toBeFalse();
  });
});
