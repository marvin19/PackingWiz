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
});
