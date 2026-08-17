import type {
  PackingGenerationInput,
  PackingGenerationResult,
  PackingGenerator,
} from '@/services/packing/packing-generator';
import { buildMockInsights, buildMockPackingList } from '@/mocks/mock-packing-generator-logic';

export class MockPackingGenerator implements PackingGenerator {
  async generate(input: PackingGenerationInput): Promise<PackingGenerationResult> {
    return {
      items: buildMockPackingList(input.draft),
      insights: buildMockInsights(input.draft),
    };
  }
}

export const mockPackingGenerator = new MockPackingGenerator();
