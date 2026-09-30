import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, catchError, concatMap, defer, from, map, of, throwError, timeout, toArray } from 'rxjs';
import { environment } from '../../../environments/environment';

interface UploadResponse {
  mode: 'direct' | 'inline';
  uploadUrl: string | null;
  imageUrl: string | null;
  headers: Record<string, string>;
}

export class ProductImageUploadError extends Error {}

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private readonly http = inject(HttpClient);
  // Presigned S3 requests must never receive the application's Bearer token.
  private readonly storageHttp = new HttpClient(inject(HttpBackend));
  private readonly uploaded = new Map<string, string>();

  prepareImages(images: string[] = []): Observable<string[]> {
    return defer(() => {
      if (images.length > 5) {
        throw new ProductImageUploadError('Choose no more than 5 product images.');
      }
      return from(images).pipe(concatMap(image => this.prepareImage(image)), toArray());
    });
  }

  private prepareImage(image: string): Observable<string> {
    if (/^https?:\/\//i.test(image)) return of(image);
    const cached = this.uploaded.get(image);
    if (cached) return of(cached);

    return defer(() => {
      const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(image);
      if (!match || match[2].length > 4 * Math.ceil(5 * 1024 * 1024 / 3)) {
        throw new ProductImageUploadError('Use JPEG, PNG, WebP or GIF images up to 5 MB each.');
      }
      const bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0));
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
        throw new ProductImageUploadError('Each image must be between 1 byte and 5 MB.');
      }
      const blob = new Blob([bytes], { type: match[1] });
      return this.http.post<UploadResponse>(`${environment.apiUrl}/product-images/uploads`, {
        contentType: blob.type, contentLength: blob.size
      }).pipe(
        timeout(30000),
        concatMap(upload => {
          if (upload.mode === 'inline' && !environment.production) return of(image);
          if (upload.mode !== 'direct' || !upload.uploadUrl?.startsWith('https://') || !upload.imageUrl) {
            throw new ProductImageUploadError('Image storage is unavailable. Please try again later.');
          }
          const imageUrl = upload.imageUrl;
          return this.storageHttp.put(upload.uploadUrl, blob, {
            headers: upload.headers, responseType: 'text', withCredentials: false
          }).pipe(timeout(120000), map(() => {
            // Reuse successful uploads for multiple sizes and retries, with a bounded cache.
            if (this.uploaded.size >= 5) this.uploaded.delete(this.uploaded.keys().next().value!);
            this.uploaded.set(image, imageUrl);
            return imageUrl;
          }));
        })
      );
    }).pipe(catchError(error => throwError(() => error instanceof ProductImageUploadError ? error :
      new ProductImageUploadError('Image upload failed. This product has not been saved. Please try again.'))));
  }
}
