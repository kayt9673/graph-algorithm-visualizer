import type { ExampleGraph } from './types';

export function validateGraph(_graph: ExampleGraph): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] };
}
