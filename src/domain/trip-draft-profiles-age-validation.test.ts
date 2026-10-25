import {
  DRAFT_PROFILE_AGE_INVALID_MESSAGE,
  DRAFT_PROFILE_AGE_REQUIRED_MESSAGE,
  getDraftProfileAgeValidationMessage,
  isValidDraftProfileAge,
} from '@/domain/trip-draft-profiles';

describe('getDraftProfileAgeValidationMessage', () => {
  it('requires age when empty', () => {
    expect(getDraftProfileAgeValidationMessage('')).toBe(DRAFT_PROFILE_AGE_REQUIRED_MESSAGE);
    expect(getDraftProfileAgeValidationMessage('   ')).toBe(DRAFT_PROFILE_AGE_REQUIRED_MESSAGE);
  });

  it('rejects invalid ages with a format message', () => {
    expect(getDraftProfileAgeValidationMessage('121')).toBe(DRAFT_PROFILE_AGE_INVALID_MESSAGE);
    expect(getDraftProfileAgeValidationMessage('12.5')).toBe(DRAFT_PROFILE_AGE_INVALID_MESSAGE);
    expect(getDraftProfileAgeValidationMessage('abc')).toBe(DRAFT_PROFILE_AGE_INVALID_MESSAGE);
  });

  it('returns null for valid boundary ages', () => {
    expect(getDraftProfileAgeValidationMessage('0')).toBeNull();
    expect(getDraftProfileAgeValidationMessage('120')).toBeNull();
    expect(isValidDraftProfileAge('0')).toBe(true);
    expect(isValidDraftProfileAge('120')).toBe(true);
  });
});
