import { TestBed } from '@angular/core/testing';

import { ContactStoreService } from './contact.store.service';

describe('ContactStoreService', () => {
  let service: ContactStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
