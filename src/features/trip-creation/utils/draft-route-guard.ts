export function shouldRedirectFromDraftRoute(input: {
  isFocused: boolean;
  hasValidActiveDraft: boolean;
  isCommitDraftInFlight: boolean;
}): boolean {
  if (!input.isFocused) {
    return false;
  }

  if (input.hasValidActiveDraft || input.isCommitDraftInFlight) {
    return false;
  }

  return true;
}
