import {
  importantNameListsEqual,
  mergeImportantWizardProfileDrafts,
  normalizeImportantNameList,
} from '@/features/trip-creation/utils/important-wizard-draft';

describe('mergeImportantWizardProfileDrafts', () => {
  it('preserves collapsed staged rows when canonical saved data is still empty', () => {
    const current = {
      'draft-profile-jonas': {
        rows: ['Medication'],
        expanded: false,
      },
    };
    const next = {
      'draft-profile-jonas': {
        rows: [''],
        expanded: false,
      },
    };

    const merged = mergeImportantWizardProfileDrafts(current, next);

    expect(merged['draft-profile-jonas']?.rows).toEqual(['Medication']);
  });

  it('adopts rebuilt canonical rows for collapsed cards without local additions', () => {
    const current = {
      me: {
        rows: ['Passport'],
        expanded: false,
      },
    };
    const next = {
      me: {
        rows: ['Passport', 'Glasses'],
        expanded: false,
      },
    };

    const merged = mergeImportantWizardProfileDrafts(current, next);

    expect(merged.me?.rows).toEqual(['Passport', 'Glasses']);
  });

  it('preserves expanded editor state across profile rebuilds', () => {
    const current = {
      me: {
        rows: ['Passport', ''],
        expanded: true,
      },
    };
    const next = {
      me: {
        rows: [''],
        expanded: false,
      },
    };

    const merged = mergeImportantWizardProfileDrafts(current, next);

    expect(merged.me?.expanded).toBe(true);
    expect(merged.me?.rows).toEqual(['Passport', '']);
  });
});

describe('important wizard staged names', () => {
  it('detects uncommitted staged changes', () => {
    expect(importantNameListsEqual(['Medication'], [])).toBe(false);
    expect(normalizeImportantNameList([' Medication ', 'Medication'])).toEqual(['Medication']);
  });
});
