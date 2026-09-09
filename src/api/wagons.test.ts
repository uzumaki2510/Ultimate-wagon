import { expect, it, vi } from 'vitest';
vi.mock('./client', () => ({ default: { get: vi.fn() } }));
import client from './client';
import { wagonApi } from './wagons';
it('loads subsequent pages instead of truncating the registry', async () => {
  vi.mocked(client.get).mockResolvedValueOnce({ data: { data: [{ _id: 'first' }], pagination: { hasNextPage: true } } });
  vi.mocked(client.get).mockResolvedValueOnce({ data: { data: [{ _id: 'last' }], pagination: { hasNextPage: false } } });
  expect((await wagonApi.getWagons()).data).toHaveLength(2);
  expect(client.get).toHaveBeenLastCalledWith('/wagons', { params: { page: 2, limit: 100, sort: '_id' } });
});
