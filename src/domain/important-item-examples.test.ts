import {
  ADD_ANOTHER_IMPORTANT_ITEM_PLACEHOLDER,
  formatImportantExamplesLine,
  importantExampleKindForProfile,
  importantItemFirstRowPlaceholder,
} from '@/domain/important-item-examples';

describe('important-item-examples', () => {
  it('classifies self as adult', () => {
    expect(importantExampleKindForProfile({ isSelf: true, age: undefined })).toBe('adult');
  });

  it('classifies child profiles by age under 18', () => {
    expect(importantExampleKindForProfile({ isSelf: false, age: 8 })).toBe('child');
    expect(importantExampleKindForProfile({ isSelf: false, age: 17 })).toBe('child');
  });

  it('classifies adult profiles at 18 and above', () => {
    expect(importantExampleKindForProfile({ isSelf: false, age: 18 })).toBe('adult');
    expect(importantExampleKindForProfile({ isSelf: false, age: 42 })).toBe('adult');
  });

  it('uses neutral examples when age is missing for non-self profiles', () => {
    expect(importantExampleKindForProfile({ isSelf: false, age: undefined })).toBe('neutral');
    expect(formatImportantExamplesLine({ isSelf: false, age: undefined })).toBe(
      'e.g. medication, house keys, passport',
    );
  });

  it('provides adult-oriented copy for adults', () => {
    const profile = { isSelf: false, age: 30 };
    expect(formatImportantExamplesLine(profile)).toBe('e.g. medication, passport, house keys');
    expect(importantItemFirstRowPlaceholder(profile)).toBe('e.g. Medication');
  });

  it('provides child-oriented copy for children', () => {
    const profile = { isSelf: false, age: 6 };
    expect(formatImportantExamplesLine(profile)).toBe(
      'e.g. favourite teddy, comfort blanket, medication',
    );
    expect(importantItemFirstRowPlaceholder(profile)).toBe('e.g. Favourite teddy');
  });

  it('uses matching kind for wizard card and empty-state lines for the same profile', () => {
    const emilie = { isSelf: false, age: 8 };
    const line = formatImportantExamplesLine(emilie);
    const placeholder = importantItemFirstRowPlaceholder(emilie);
    expect(line).toContain('favourite teddy');
    expect(placeholder).toContain('Favourite teddy');
  });

  it('documents the shared add-row placeholder', () => {
    expect(ADD_ANOTHER_IMPORTANT_ITEM_PLACEHOLDER).toBe('Add another item');
  });
});
