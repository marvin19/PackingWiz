import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { isTripReadOnly } from '@/domain/trip-mutation-policy';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { subscribeAppForegroundNotify } from '@/lib/app-foreground-notify';
import { useActiveTripReadOnly } from '@/features/trips/hooks/use-active-trip-read-only';

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory scope
    const { useEffect } = require('react');
    useEffect(() => {
      const cleanup = effect();
      return cleanup;
    }, [effect]);
  },
}));

jest.mock('@/domain/trip-mutation-policy', () => ({
  isTripReadOnly: jest.fn(),
}));

jest.mock('@/lib/app-foreground-notify', () => ({
  subscribeAppForegroundNotify: jest.fn(() => jest.fn()),
}));

function createTrip(endDate: string) {
  return normalizeTrip({
    id: 'trip-hook',
    name: 'Hook trip',
    title: 'Hook trip',
    destination: createDestinationFromText('Oslo'),
    startDate: '2027-06-01',
    endDate,
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: '',
    status: 'upcoming',
    generated: true,
    packingMode: 'generated',
    items: [],
    travelers: [],
    bags: [],
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    insights: [],
    packingLists: [],
  } as TripLike);
}

function ReadOnlyProbe({
  trip,
  onValue,
}: {
  trip: ReturnType<typeof createTrip>;
  onValue: (value: boolean) => void;
}) {
  const readOnly = useActiveTripReadOnly(trip);
  useEffect(() => {
    onValue(readOnly);
  }, [onValue, readOnly]);
  return null;
}

describe('useActiveTripReadOnly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns policy result and subscribes to foreground refresh', async () => {
    const trip = createTrip('2020-01-01');
    (isTripReadOnly as jest.Mock).mockReturnValue(true);
    let latest: boolean | undefined;

    await act(async () => {
      TestRenderer.create(
        <ReadOnlyProbe trip={trip} onValue={(value) => { latest = value; }} />,
      );
      await Promise.resolve();
    });

    expect(latest).toBe(true);
    expect(isTripReadOnly).toHaveBeenCalledWith(trip);
    expect(subscribeAppForegroundNotify).toHaveBeenCalled();
  });
});