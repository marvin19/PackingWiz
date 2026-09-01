import { formatNaturalEnglishList } from '@/domain/natural-list-format';

describe('formatNaturalEnglishList', () => {
  it('formats one name', () => {
    expect(formatNaturalEnglishList(['Me'])).toBe('Me');
  });

  it('formats two names with and', () => {
    expect(formatNaturalEnglishList(['Me', 'Jonas'])).toBe('Me and Jonas');
  });

  it('formats three names without an Oxford comma', () => {
    expect(formatNaturalEnglishList(['Me', 'Jonas', 'Emilie'])).toBe('Me, Jonas and Emilie');
  });

  it('formats four names without an Oxford comma', () => {
    expect(formatNaturalEnglishList(['Me', 'Jonas', 'Emilie', 'Anna'])).toBe(
      'Me, Jonas, Emilie and Anna',
    );
  });
});
