import type { PackingItem, PackingCategory } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';
import type { TripDraft } from '@/domain/trip-draft';

let itemCounter = 0;

function nextItemId(): string {
  itemCounter += 1;
  return `mock-item-${itemCounter}`;
}

function createItem(
  name: string,
  category: PackingCategory,
  overrides: Partial<PackingItem> = {},
): PackingItem {
  return {
    id: nextItemId(),
    name,
    quantity: overrides.quantity ?? 1,
    category,
    packed: overrides.packed ?? false,
    needToBuy: overrides.needToBuy ?? false,
    assignedTo: overrides.assignedTo ?? null,
    note: overrides.note,
    source: overrides.source ?? 'generated',
    importantItemId: overrides.importantItemId,
  };
}

function tripDurationDays(draft: TripDraft): number {
  if (!draft.startDate || !draft.endDate) {
    return 1;
  }
  const start = new Date(draft.startDate);
  const end = new Date(draft.endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function includesContext(tags: string[], keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return tags.some((tag) => tag.toLowerCase().includes(lower));
}

/**
 * Lightweight mock generator for development.
 * Returns a representative list without mirroring the v0 rule engine.
 * Profile-aware: child profiles receive a small deterministic extra item (MP2B plumbing).
 */
export function buildMockPackingList(draft: TripDraft, profile: PackingProfile): PackingItem[] {
  const days = tripDurationDays(draft);
  const laundry = draft.laundry === 'yes';
  const shirtCount = laundry ? Math.min(days, 6) : Math.min(days, 8);
  const tags = draft.tripContext;

  const items: PackingItem[] = [
    createItem('Passport', 'Essentials'),
    createItem('Wallet & cards', 'Essentials'),
    createItem('Travel insurance', 'Essentials'),
    createItem('Medication', 'Essentials'),
    createItem('Local cash', 'Essentials'),
    createItem('T-shirts', 'Clothing', { quantity: shirtCount }),
    createItem('Trousers', 'Clothing', { quantity: Math.max(1, Math.ceil(days / 5)) }),
    createItem('Underwear', 'Clothing', { quantity: laundry ? Math.min(days, 7) : days }),
    createItem('Socks', 'Clothing', { quantity: laundry ? Math.min(days, 7) : days }),
    createItem('Lightweight jacket', 'Clothing'),
    createItem('Sleepwear', 'Clothing'),
    createItem('Walking shoes', 'Shoes'),
    createItem('Toothbrush & paste', 'Toiletries'),
    createItem('Deodorant', 'Toiletries'),
    createItem('Sunscreen', 'Toiletries'),
    createItem('Phone charger', 'Electronics'),
    createItem('Power bank', 'Electronics'),
    createItem('Travel adapter', 'Electronics', { needToBuy: true }),
    createItem('Headphones', 'Electronics'),
    createItem('Compact umbrella', 'Weather', { needToBuy: true }),
    createItem('Light rain jacket', 'Weather'),
    createItem('Sunglasses', 'Weather'),
  ];

  if (includesContext(tags, 'run') || includesContext(tags, 'marathon')) {
    items.push(
      createItem('Running shoes', 'Shoes'),
      createItem('Running shorts', 'Activities', { quantity: 2 }),
      createItem('Energy gels', 'Activities', { quantity: 4, needToBuy: true }),
    );
  }

  if (includesContext(tags, 'beach') || includesContext(tags, 'swim')) {
    items.push(createItem('Swimwear', 'Activities', { quantity: 2 }));
  }

  if (profile.age !== undefined && profile.age < 18) {
    items.push(
      createItem('Child pajamas', 'Clothing'),
    );
  }

  if (draft.note.toLowerCase().includes('light')) {
    return items.filter((item) => item.name !== 'Sleepwear' || days > 5);
  }

  return items;
}

export function buildMockInsights(draft: TripDraft, profile: PackingProfile): string[] {
  const insights: string[] = [];
  const tags = draft.tripContext;

  if (draft.laundry === 'yes') {
    insights.push(
      "You'll have laundry available, so we've reduced the amount of clothing you need to pack.",
    );
  }

  if (includesContext(tags, 'run') || includesContext(tags, 'marathon')) {
    insights.push('Because you are running, we added race-day essentials to your list.');
  }

  if (profile.age !== undefined && profile.age < 18) {
    insights.push(`We added child-sized essentials for ${profile.name}.`);
  }

  if (draft.note.toLowerCase().includes('light')) {
    insights.push('You asked to pack light, so we kept clothing to versatile pieces you can mix and match.');
  }

  if (insights.length < 2) {
    insights.push('We tailored quantities to your trip length so you are covered without overpacking.');
  }

  return insights.slice(0, 4);
}
