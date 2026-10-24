let stagedPackingNotice = false;

export function stageTripEditPackingNotice(): void {
  stagedPackingNotice = true;
}

export function consumeTripEditPackingNotice(): boolean {
  if (!stagedPackingNotice) {
    return false;
  }

  stagedPackingNotice = false;
  return true;
}

export function resetTripEditSaveNoticeHandoffForTests(): void {
  stagedPackingNotice = false;
}
