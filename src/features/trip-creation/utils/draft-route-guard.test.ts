import { shouldRedirectFromDraftRoute } from '@/features/trip-creation/utils/draft-route-guard';

describe('shouldRedirectFromDraftRoute', () => {
  it('redirects only for focused screens without a valid active draft', () => {
    expect(
      shouldRedirectFromDraftRoute({
        isFocused: true,
        hasValidActiveDraft: false,
        isCommitDraftInFlight: false,
      }),
    ).toBe(true);
  });

  it('does not redirect while commit navigation is in flight after draft consumption', () => {
    expect(
      shouldRedirectFromDraftRoute({
        isFocused: true,
        hasValidActiveDraft: false,
        isCommitDraftInFlight: true,
      }),
    ).toBe(false);
  });

  it('does not redirect when Summary is unfocused under Generating', () => {
    expect(
      shouldRedirectFromDraftRoute({
        isFocused: false,
        hasValidActiveDraft: false,
        isCommitDraftInFlight: false,
      }),
    ).toBe(false);
  });

  it('does not redirect while a valid active draft remains on the creation flow', () => {
    expect(
      shouldRedirectFromDraftRoute({
        isFocused: true,
        hasValidActiveDraft: true,
        isCommitDraftInFlight: false,
      }),
    ).toBe(false);
  });

  it('redirects focused Summary after destination acknowledge clears in-flight guard', () => {
    expect(
      shouldRedirectFromDraftRoute({
        isFocused: true,
        hasValidActiveDraft: false,
        isCommitDraftInFlight: false,
      }),
    ).toBe(true);
  });

  it('combines consumed draft with in-flight guard to block Home redirect during transition', () => {
    const consumedDraftWithoutInFlight = {
      isFocused: true,
      hasValidActiveDraft: false,
      isCommitDraftInFlight: false,
    };
    const consumedDraftWithInFlight = {
      isFocused: true,
      hasValidActiveDraft: false,
      isCommitDraftInFlight: true,
    };

    expect(shouldRedirectFromDraftRoute(consumedDraftWithoutInFlight)).toBe(true);
    expect(shouldRedirectFromDraftRoute(consumedDraftWithInFlight)).toBe(false);
  });
});
