/** Whether Pack tab should auto-open the multi-list picker (focused entry only). */
export function shouldRedirectPackTabToListPicker(input: {
  /** False when Pack tab is mounted in the background (e.g. during trip/generating). */
  isPackFocused: boolean;
  isCommitDraftInFlight: boolean;
  hasActiveTrip: boolean;
  hasMultipleLists: boolean;
  activePackingListId: string | null;
}): boolean {
  if (!input.isPackFocused) {
    return false;
  }

  if (input.isCommitDraftInFlight) {
    return false;
  }

  if (!input.hasActiveTrip || !input.hasMultipleLists) {
    return false;
  }

  return !input.activePackingListId;
}
