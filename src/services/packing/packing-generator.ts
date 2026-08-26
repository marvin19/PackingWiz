import type { TripDraft } from '@/domain/trip-draft';
import type { PackingProfile } from '@/domain/packing-profile';
import type { PackingItem } from '@/domain/packing-item';

export interface PackingGenerationInput {
  draft: TripDraft;
  /** Person this list is generated for (MP2B+). */
  profile: PackingProfile;
}

export interface PackingGenerationResult {
  items: PackingItem[];
  insights: string[];
}

export interface PackingGenerator {
  generate(input: PackingGenerationInput): Promise<PackingGenerationResult>;
}
