import { parseDate } from '@/domain/dates';
import {
  createDefaultNewTripDateRange,
  withDefaultNewTripDatesIfUnset,
} from '@/domain/new-trip-draft-dates';
import { validateNewTripDateRange } from '@/domain/new-trip-date-validation';
import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';
import { canProceedFromStepId } from '@/features/trip-creation/utils/wizard-validation';
import {
  createEditFormStateFromTrip,
  getDestinationSectionSaveGate,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import {
  validateReuseTripForm,
  type ReuseTripFormState,
} from '@/features/trips/utils/reuse-trip-view-model';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const capturedDateFieldProps: { label: string; minimumDate?: Date }[] = [];

jest.mock('@/components/ui/date-field', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    DateField: (props: { label: string; minimumDate?: Date; value: string; onChange: (v: string) => void }) => {
      capturedDateFieldProps.push({ label: props.label, minimumDate: props.minimumDate });
      return React.createElement(View, { accessibilityLabel: `${props.label}, required` });
    },
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('trip date selection consistency', () => {
  beforeEach(() => {
    capturedDateFieldProps.length = 0;
    jest.useFakeTimers();
    jest.setSystemTime(parseDate('2026-11-25'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not apply a return minimumDate on creation or edit destination steps', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft('d1'),
      ...createDefaultNewTripDateRange(parseDate('2026-11-25')),
      destination: createDestinationFromText('Oslo'),
    });

    act(() => {
      TestRenderer.create(
        <DestinationStep
          draft={draft}
          onChange={jest.fn()}
          dateValidationMode="edit-existing"
        />,
      );
    });

    const returnField = capturedDateFieldProps.find((entry) => entry.label === 'Return');
    expect(returnField?.minimumDate).toBeUndefined();
  });

  it('preserves return when departure changes for edit save eligibility', () => {
    const trip = normalizeTrip({
      id: 'trip-edit-range',
      name: 'Oslo',
      title: 'Oslo',
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-11-25',
      endDate: '2026-11-26',
      tripContext: ['Vacation'],
      accommodation: 'hotel',
      laundry: 'no',
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
      bags: [],
      note: '',
      weather: { mode: 'climate', summary: 'Mild', detail: '', high: 10, low: 2 },
      insights: [],
      packingLists: [],
      items: [],
      packingMode: 'generated',
      generated: true,
      status: 'upcoming',
    } satisfies TripLike) as Trip;

    let form = createEditFormStateFromTrip(trip);
    form = {
      ...form,
      draft: { ...form.draft, startDate: '2026-11-29' },
    };

    expect(form.draft.endDate).toBe('2026-11-26');
    expect(getDestinationSectionSaveGate(form, trip).canPersist).toBe(false);

    const fixed = {
      ...form,
      draft: { ...form.draft, endDate: '2026-11-29' },
    };
    expect(getDestinationSectionSaveGate(fixed, trip).canPersist).toBe(true);
  });

  it('reuse default dates stay stable across unrelated form updates', () => {
    const defaults = createDefaultNewTripDateRange(parseDate('2026-11-25'));
  const form = {
      name: 'Hyttetur',
      destination: createDestinationFromText('Bergen'),
      ...defaults,
      tripContext: ['Vacation'],
      accommodation: 'hotel' as const,
      laundry: 'no' as const,
      bags: [],
      note: '',
      selectedPackingListIds: ['list-1'],
      newTravellers: [],
    } satisfies ReuseTripFormState;

    const updated = { ...form, note: 'Updated note' };
    expect(updated.endDate).toBe('2026-11-26');
    expect(updated.startDate).toBe('2026-11-25');
  });

  it('surfaces validation and blocks submit when return is before departure', () => {
    const baseForm: ReuseTripFormState = {
      name: 'Trip',
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-11-25',
      endDate: '2026-11-26',
      tripContext: ['Vacation'],
      accommodation: 'hotel',
      laundry: 'no',
      bags: [],
      note: '',
      selectedPackingListIds: ['list-1'],
      newTravellers: [],
    };

    const invalid = validateReuseTripForm(
      { ...baseForm, startDate: '2026-11-29', endDate: '2026-11-26' },
      parseDate('2026-11-25'),
    );
    expect(invalid.canSubmit).toBe(false);
    expect(invalid.dateError).toBe('Return date must be on or after departure.');

    const corrected = validateReuseTripForm(
      { ...baseForm, startDate: '2026-11-29', endDate: '2026-11-29' },
      parseDate('2026-11-25'),
    );
    expect(corrected.dateError).toBeNull();
    expect(corrected.canSubmit).toBe(true);
  });

  it('shows incomplete guidance when only one date is set', () => {
    expect(
      validateNewTripDateRange('2026-11-25', '', parseDate('2026-11-25')),
    ).toEqual({ ok: false, issue: 'incomplete' });
  });

  it('creation continue stays enabled for same-day defaults with destination', () => {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      ...withDefaultNewTripDatesIfUnset(createEmptyTripDraft(), parseDate('2026-11-25')),
      destination: createDestinationFromText('Oslo'),
    });
    expect(canProceedFromStepId('destination', draft)).toBe(true);

    const sameDay = normalizeTripDraft({
      ...draft,
      startDate: '2026-11-29',
      endDate: '2026-11-29',
    });
    expect(canProceedFromStepId('destination', sameDay)).toBe(true);
  });

  it('changing departure in a stored new-trip draft does not move return', () => {
    jest.setSystemTime(parseDate('2026-11-25'));
    const stored = createStoredTripDraft();
    let state = addStoredDraft(emptyTripDraftsState(), stored);
    const returnBefore = stored.draft.endDate;

    state = updateStoredDraftTrip(state, stored.id, { startDate: '2026-11-29' });
    expect(state.drafts[0]!.draft.endDate).toBe(returnBefore);
  });
});