import { of, Subject, throwError } from 'rxjs';
import { BarcodeHistoryComponent } from './barcode-history.component';

describe('Barcode history paging', () => {
  let service: any;
  let component: BarcodeHistoryComponent;
  beforeEach(() => {
    service = { getBarcodeHistory: jasmine.createSpy().and.returnValue(of([])) };
    component = new BarcodeHistoryComponent(service, {} as any, {} as any);
  });
  it('requests bounded pages and replaces previous results', () => {
    service.getBarcodeHistory.and.returnValue(of(Array.from({ length: 100 }, (_, id) => ({ id }))));
    component.loadHistory();
    expect(component.hasNext).toBeTrue();
    service.getBarcodeHistory.and.returnValue(of([{ id: 101 }]));
    component.loadHistory(1);
    expect(service.getBarcodeHistory).toHaveBeenCalledWith({ page: 1, size: 100, eventType: '' });
    expect(component.history().length).toBe(1);
    expect(component.page).toBe(1);
    expect(component.hasNext).toBeFalse();
  });
  it('filters events on the server and resets the page', () => {
    component.page = 3;
    component.selectedEventType = 'SOLD';
    component.onEventTypeChange();
    expect(service.getBarcodeHistory).toHaveBeenCalledWith({ page: 0, size: 100, eventType: 'SOLD' });
  });
  it('prevents overlapping requests and preserves page on failure', () => {
    service.getBarcodeHistory.and.returnValue(new Subject());
    component.loadHistory();
    component.loadHistory();
    expect(service.getBarcodeHistory).toHaveBeenCalledTimes(1);
    component.isLoading.set(false);
    service.getBarcodeHistory.and.returnValue(throwError(() => new Error('Unavailable')));
    component.loadHistory(1);
    expect(component.page).toBe(0);
    expect(component.loadError).toBeTruthy();
  });
});
