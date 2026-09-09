import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/api/wagons', () => ({ wagonApi: { createWagon: vi.fn(), updateWagon: vi.fn(), getWagon: vi.fn(), getWagons: vi.fn(), deleteWagon: vi.fn() } }));
vi.mock('@/api/workflows', () => ({ workflowApi: { createWorkflow: vi.fn(), updateWorkflow: vi.fn(), getWorkflows: vi.fn() } }));
import { wagonApi } from '@/api/wagons';
import { workflowApi } from '@/api/workflows';
import { useAppStore } from './useAppStore';
const wagon = { id: '000000000000000000000001', wagonNo: '12345678901', type: 'BOXN', owner: 'Test', builtYear: 2020, status: 'ARRIVED' as const, updatedAt: '2026-09-01T00:00:00.000Z' };
beforeEach(() => { useAppStore.getState().resetStore(); vi.resetAllMocks(); });
describe('server-confirmed persistence', () => {
  it('uses the database ID and does not create a workflow with a temporary ID', async () => {
    vi.mocked(wagonApi.createWagon).mockResolvedValue({ data: { ...wagon, id: undefined, _id: wagon.id } });
    const result = await useAppStore.getState().addWagon(wagon);
    expect(result.id).toBe(wagon.id);
    expect(useAppStore.getState().wagons[0].id).toBe(wagon.id);
    expect(workflowApi.createWorkflow).not.toHaveBeenCalled();
  });
  it('failed wagon saves do not change displayed state', async () => {
    useAppStore.setState({ wagons: [wagon] });
    vi.mocked(wagonApi.updateWagon).mockRejectedValue(new Error('Save failed'));
    await expect(useAppStore.getState().updateWagon(wagon.id, { owner: 'Changed' })).rejects.toThrow('Save failed');
    expect(useAppStore.getState().wagons[0].owner).toBe('Test');
  });
  it('sends checklist updates and concurrency version to the API', async () => {
    useAppStore.setState({ wagons: [wagon] });
    vi.mocked(wagonApi.updateWagon).mockResolvedValue({ data: { ...wagon, inspectionChecklist: { brakePipe: { checked: true } } } });
    await useAppStore.getState().updateInspectionChecklist(wagon.id, { brakePipe: { checked: true } });
    expect(wagonApi.updateWagon).toHaveBeenCalledWith(wagon.id, { expectedUpdatedAt: wagon.updatedAt, inspectionChecklist: { brakePipe: { checked: true } } });
  });
  it('persists workflow changes and refreshes the corresponding wagon', async () => {
    const workflow = { id: '000000000000000000000002', wagonId: wagon.id, wagonNo: wagon.wagonNo, wagonType: 'BOXN', currentStage: 'YARD_EXAM', stages: [{ stageName: 'YARD_EXAM', status: 'Pending' as const, targetDurationHours: 1 }], updatedAt: wagon.updatedAt };
    useAppStore.setState({ wagons: [wagon], workflows: [workflow] });
    vi.mocked(workflowApi.updateWorkflow).mockResolvedValue({ data: { ...workflow, stages: [{ ...workflow.stages[0], status: 'In Progress' }] } });
    vi.mocked(wagonApi.getWagon).mockResolvedValue({ data: { ...wagon, status: 'REPAIR_IN_PROGRESS' } });
    await useAppStore.getState().startStage(workflow.id, 'YARD_EXAM', 'Tester');
    expect(workflowApi.updateWorkflow).toHaveBeenCalled();
    expect(useAppStore.getState().workflows[0].stages[0].status).toBe('In Progress');
    expect(useAppStore.getState().wagons[0].status).toBe('REPAIR_IN_PROGRESS');
  });
  it('failed workflow saves leave stages unchanged', async () => {
    const workflow = { id: 'wf', wagonId: wagon.id, wagonNo: wagon.wagonNo, wagonType: 'BOXN', currentStage: 'YARD_EXAM', stages: [{ stageName: 'YARD_EXAM', status: 'Pending' as const, targetDurationHours: 1 }], updatedAt: wagon.updatedAt };
    useAppStore.setState({ workflows: [workflow] });
    vi.mocked(workflowApi.updateWorkflow).mockRejectedValue(new Error('Conflict'));
    await expect(useAppStore.getState().startStage('wf', 'YARD_EXAM', 'Test')).rejects.toThrow('Conflict');
    expect(useAppStore.getState().workflows[0].stages[0].status).toBe('Pending');
  });
});
