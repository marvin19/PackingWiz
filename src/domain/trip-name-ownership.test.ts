import { createDestinationFromText } from '@/domain/destination';
import { getTripName } from '@/domain/trip-name';
import {
  coalesceTripNameOwnership,
  inferTripNameUserEdited,
  resolveTripDisplayName,
  tripNameEditState,
} from '@/domain/trip-name-ownership';

describe('trip name ownership', () => {
  const barcelona = createDestinationFromText('Barcelona', 'Spain');

  it('infers automatic naming when stored label matches destination', () => {
    expect(
      inferTripNameUserEdited({
        name: 'Barcelona',
        title: 'Barcelona',
        destination: barcelona,
      }),
    ).toBe(false);
  });

  it('infers custom naming when stored label differs from destination', () => {
    expect(
      inferTripNameUserEdited({
        name: 'Hyttetur',
        title: 'Hyttetur',
        destination: barcelona,
      }),
    ).toBe(true);
  });

  it('does not re-infer when explicit flag is set', () => {
    expect(
      coalesceTripNameOwnership({
        name: 'Barcelona',
        title: 'Barcelona',
        destination: barcelona,
        isTripNameUserEdited: true,
      }).isTripNameUserEdited,
    ).toBe(true);
  });

  it('resolves display from destination when automatic', () => {
    const lisbon = createDestinationFromText('Lisbon', 'Portugal');
    expect(
      resolveTripDisplayName({
        name: '',
        title: 'Barcelona',
        destination: lisbon,
        isTripNameUserEdited: false,
      }),
    ).toBe('Lisbon');
  });

  it('keeps explicit custom text equal to destination when flag is true', () => {
    expect(
      resolveTripDisplayName({
        name: 'Barcelona',
        title: 'Barcelona',
        destination: barcelona,
        isTripNameUserEdited: true,
      }),
    ).toBe('Barcelona');
    expect(getTripName({
      name: 'Barcelona',
      title: 'Barcelona',
      destination: barcelona,
      isTripNameUserEdited: true,
    })).toBe('Barcelona');
  });

  it('exposes custom text only when user-edited', () => {
    expect(
      tripNameEditState({
        name: '',
        title: 'Barcelona',
        destination: barcelona,
        isTripNameUserEdited: false,
      }),
    ).toEqual({
      isTripNameUserEdited: false,
      customName: '',
    });
  });
});
