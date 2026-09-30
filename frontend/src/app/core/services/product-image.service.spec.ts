import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductImageService, ProductImageUploadError } from './product-image.service';
import { environment } from '../../../environments/environment';

describe('ProductImageService', () => {
  let service: ProductImageService;
  let http: HttpTestingController;
  const data = 'data:image/jpeg;base64,aGVsbG8=';
  const endpoint = `${environment.apiUrl}/product-images/uploads`;
  const upload = { mode: 'direct', uploadUrl: 'https://bucket.s3.amazonaws.com/upload?signature=test',
    imageUrl: 'https://bucket.s3.amazonaws.com/image.jpg', headers: { 'Content-Type': 'image/jpeg' } };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([(req, next) => next(req.clone({ setHeaders: { Authorization: 'Bearer test-token' } }))])),
      provideHttpClientTesting()
    ] });
    service = TestBed.inject(ProductImageService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uploads bytes without an app token and reuses URLs for another size', () => {
    let result: string[] = [];
    service.prepareImages([data, 'https://existing/image.png']).subscribe(images => result = images);
    const prepare = http.expectOne(endpoint);
    expect(prepare.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(prepare.request.body).toEqual({ contentType: 'image/jpeg', contentLength: 5 });
    prepare.flush(upload);
    const put = http.expectOne(upload.uploadUrl);
    expect(put.request.method).toBe('PUT');
    expect(put.request.headers.has('Authorization')).toBeFalse();
    expect(put.request.withCredentials).toBeFalse();
    expect(put.request.body instanceof Blob).toBeTrue();
    expect(result).toEqual([]);
    put.flush('');
    expect(result).toEqual([upload.imageUrl, 'https://existing/image.png']);
    service.prepareImages([data]).subscribe(images => expect(images).toEqual([upload.imageUrl]));
    http.expectNone(endpoint);
  });

  it('does not return base64 or cache failures when an upload fails', () => {
    service.prepareImages([data]).subscribe({ next: () => fail('Must not save'), error: error => {
      expect(error instanceof ProductImageUploadError).toBeTrue();
      expect(error.message).not.toContain('signature');
    } });
    http.expectOne(endpoint).flush(upload);
    http.expectOne(upload.uploadUrl).flush('Denied', { status: 403, statusText: 'Forbidden' });
    service.prepareImages([data]).subscribe({ error: () => {} });
    http.expectOne(endpoint).flush('Denied', { status: 403, statusText: 'Forbidden' });
  });

  it('preserves order, handles empty images and rejects unsupported or excess images', () => {
    service.prepareImages([]).subscribe(images => expect(images).toEqual([]));
    for (const images of [Array(6).fill(data), ['data:image/svg+xml;base64,aGVsbG8=']]) {
      service.prepareImages(images).subscribe({ next: () => fail('Must reject'), error: error =>
        expect(error instanceof ProductImageUploadError).toBeTrue() });
    }
    http.expectNone(endpoint);
  });
});
