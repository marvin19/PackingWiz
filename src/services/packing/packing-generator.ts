import type { TripDraft } from '@/domain/trip-draft';
import type { PackingItem } from '@/domain/packing-item';

export interface PackingGenerationInput {
  draft: TripDraft;
}

export interface PackingGenerationResult {
  items: PackingItem[];
  insights: string[];
}

export interface PackingGenerator {
  generate(input: PackingGenerationInput): Promise<PackingGenerationResult>;
}
