import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Observable, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Contact } from '../models/contact.model';
import { ContactApiService } from '../services/contact-api.service';
import { StoreStates } from './store-states.enum';

export interface ContactState {
  contacts: Contact[];
  state: StoreStates;
  error: string | null;
}

@Injectable()
export class ContactStoreService extends ComponentStore<ContactState> {
  constructor(private api: ContactApiService) {
    super({
      contacts: [],
      state: StoreStates.Init,
      error: null,
    });
  }

  readonly contacts$ = this.select(state => state.contacts);
  readonly storeState$ = this.select(state => state.state);
  readonly error$ = this.select(state => state.error);

  readonly setStoreState = this.updater((state, newState: StoreStates) => ({
    ...state,
    state: newState,
  }));

  readonly setError = this.updater((state, error: string) => ({
    ...state,
    error,
    state: StoreStates.Error,
  }));

  readonly setContacts = this.updater((state, contacts: Contact[]) => ({
    ...state,
    contacts,
    state: StoreStates.Loaded,
  }));

  readonly loadContacts = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => this.setStoreState(StoreStates.Loading)),
      switchMap(() =>
        this.api.getContacts().pipe(
          tap({
            next: contacts => this.setContacts(contacts),
            error: err => this.setError(err.message || 'Error loading contacts'),
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );

  readonly addContact = this.effect((contact$: Observable<Contact>) =>
    contact$.pipe(
      tap(() => this.setStoreState(StoreStates.Creating)),
      switchMap(contact =>
        this.api.addContact(contact).pipe(
          tap({
            next: () => this.loadContacts(),
            error: err => this.setError(err.message || 'Error adding contact'),
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );

  readonly editContact = this.effect<Contact>(contact$ =>
    contact$.pipe(
      tap(() => this.patchState({ state: StoreStates.Updating })),
      switchMap(contact =>
        this.api.updateContact(contact).pipe(
          tapResponse(
            updated => {
              this.patchState(state => ({
                contacts: state.contacts.map(c => c.id === updated.id ? updated : c),
                storeState: StoreStates.Updated,
                error: null
              }));
            },
            error => {
              this.patchState({ state: StoreStates.Error, error: JSON.stringify(error) }); // 4
            }
          )
        )
      )
    )
  );

  readonly deleteContact = this.effect<number>(id$ =>
    id$.pipe(
      tap(() => this.patchState({ state: StoreStates.Deleting })),
      switchMap(id =>
        this.api.deleteContact(id).pipe(
          tapResponse(
            () => {
              this.patchState(state => ({
                contacts: state.contacts.filter(c => c.id !== id),
                storeState: StoreStates.Deleted,
                error: null
              }));
            },
            error => {
              this.patchState({ state: StoreStates.Error, error: JSON.stringify(error) });
            }
          )
        )
      )
    )
  );
}