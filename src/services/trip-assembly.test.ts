import type { PackingProfile } from '@/domain/packing-profile';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import {
  saveImportantItemNamesForProfile,
  SELF_IMPORTANT_PROFILE_ID,
} from '@/domain/profile-important-items';
import { createDestinationFromText } from '@/domain/destination';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';
import { assembleTripFromDraft } from '@/services/trip-assembly';

const emilieProfile: PackingProfile = {
  id: 'profile-emilie',
  name: 'Emilie',
  age: 8,
  isSelf: false,
};

function createTwoProfileDraft() {
  return {
    ...createEmptyTripDraft(),
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-07-01',
    endDate: '2026-07-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel' as const,
    laundry: 'yes' as const,
    packingProfiles: [
      { id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true },
      emilieProfile,
    ],
  };
}

describe('assembleTripFromDraft regression after per-profile extraction', () => {
  it('fetches weather once and generates once per generated profile', async () => {
    const draft = createTwoProfileDraft();
    const weather = {
      mode: 'climate' as const,
      summary: 'Sunny',
      detail: '',
      high: 24,
      low: 14,
    };

    const weatherService: WeatherService = {
      getWeatherForTrip: jest.fn(async () => weather),
    };

    const generatorCalls: string[] = [];
    const packingGenerator: PackingGenerator = {
      generate: jest.fn(async ({ profile }) => {
        generatorCalls.push(profile.id);
        return { items: [], insights: [] };
      }),
    };

    const trip = await assembleTripFromDraft(
      draft,
      { packingGenerator, weatherService },
      { packingMode: 'generated' },
    );

    expect(weatherService.getWeatherForTrip).toHaveBeenCalledTimes(1);
    expect(packingGenerator.generate).toHaveBeenCalledTimes(2);
    expect(generatorCalls).toEqual([DRAFT_SELF_PROFILE_ID, emilieProfile.id]);
    expect(trip.packingLists).toHaveLength(2);
    expect(trip.weather.summary).toBe('Sunny');
  });

  it('does not invoke generator for manual lists but still injects Important per profile', async () => {
    const draft = createTwoProfileDraft();
    const importantByProfileId = saveImportantItemNamesForProfile(
      saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport')
        .store,
      emilieProfile.id,
      ['Teddy'],
      () => 'imp-teddy',
    ).store;

    const weatherService: WeatherService = {
      getWeatherForTrip: jest.fn(async () => ({
        mode: 'climate' as const,
        summary: 'Mild',
        detail: '',
        high: 18,
        low: 10,
      })),
    };

    const packingGenerator: PackingGenerator = {
      generate: jest.fn(async () => ({ items: [], insights: [] })),
    };

    const trip = await assembleTripFromDraft(
      draft,
      { packingGenerator, weatherService },
      { packingMode: 'manual', importantByProfileId },
    );

    expect(packingGenerator.generate).not.toHaveBeenCalled();
    expect(
      trip.packingLists[0].items.some((item) => item.importantItemId === 'imp-passport'),
    ).toBe(true);
    expect(
      trip.packingLists[1].items.some((item) => item.importantItemId === 'imp-teddy'),
    ).toBe(true);
  });
});
