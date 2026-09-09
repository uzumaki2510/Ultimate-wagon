import { it, expect } from 'vitest';
import { lineForStage } from './navigation';
it('routes canonical workflow stages to their correct queues', () => {
  expect(lineForStage('DE_GASSING')).toBe('degassing');
  expect(lineForStage('GAS_FREE_VERIFICATION')).toBe('degassing');
  expect(lineForStage('POST_REPAIR_EXAM')).toBe('inspection');
  expect(lineForStage('RECTIFICATION')).toBe('repair');
  expect(lineForStage('AIR_BRAKE_TEST')).toBe('testing');
});
