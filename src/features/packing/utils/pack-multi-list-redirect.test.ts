import { shouldRedirectPackTabToListPicker } from '@/features/packing/utils/pack-multi-list-redirect';

describe('shouldRedirectPackTabToListPicker', () => {
  const multiListNoSelection = {
    isPackFocused: true,
    isCommitDraftInFlight: false,
    hasActiveTrip: true,
    hasMultipleLists: true,
    activePackingListId: null,
  } as const;

  it('redirects when Pack is focused and a multi-list trip has no selection', () => {
    expect(shouldRedirectPackTabToListPicker(multiListNoSelection)).toBe(true);
  });

  it('does not redirect when Pack is mounted but not focused (post-commit during generating)', () => {
    expect(
      shouldRedirectPackTabToListPicker({
        ...multiListNoSelection,
        isPackFocused: false,
      }),
    ).toBe(false);
  });

  it('does not redirect while post-create navigation is still in flight', () => {
    expect(
      shouldRedirectPackTabToListPicker({
        ...multiListNoSelection,
        isCommitDraftInFlight: true,
      }),
    ).toBe(false);
  });

  it('does not redirect for a single-list trip (one traveller)', () => {
    expect(
      shouldRedirectPackTabToListPicker({
        ...multiListNoSelection,
        hasMultipleLists: false,
        activePackingListId: 'list-a',
      }),
    ).toBe(false);
  });

  it('does not redirect when a packing list is already selected', () => {
    expect(
      shouldRedirectPackTabToListPicker({
        ...multiListNoSelection,
        activePackingListId: 'list-b',
      }),
    ).toBe(false);
  });
});
