import type {
  PackingGenerationInput,
  PackingGenerationResult,
  PackingGenerator,
} from '@/services/packing/packing-generator';
import { buildMockInsights, buildMockPackingList } from '@/mocks/mock-packing-generator-logic';

export class MockPackingGenerator implements PackingGenerator {
  async generate(input: PackingGenerationInput): Promise<PackingGenerationResult> {
    if (input.draft.note.trim() === 'GENERATION_FAIL') {
      throw new Error('Mock packing generation failed.');
    }

    return {
      items: buildMockPackingList(input.draft, input.profile),
      insights: buildMockInsights(input.draft, input.profile),
    };
  }
}

export const mockPackingGenerator = new MockPackingGenerator();
