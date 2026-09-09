import { Page } from '@playwright/test';
export async function mockWorkspace(page: Page, role = 'super_admin') {
  const user = { _id: '000000000000000000000001', name: 'Sample Admin', email: 'sample@example.com', role, status: 'approved', isActive: true, department: 'Mechanical', designation: 'Inspector' };
  const wagons = Array.from({ length: 14 }, (_, i) => ({ _id: String(i + 2).padStart(24, '0'), wagonNo: String(12345678901 + i), type: i % 2 ? 'BTPN' : 'BOXN', owner: 'Central Railway', builtYear: 2020, status: ['SICK_LINE', 'REPAIR_IN_PROGRESS', 'INSPECTION_PENDING', 'FIT_CERTIFICATE_PENDING'][i % 4], currentLocation: 'Yard', defect: 'Brake pipe leakage', repairTasks: [], inspectionChecklist: {}, updatedAt: '2026-09-10T00:00:00.000Z' }));
  const workflows = wagons.map((w, i) => ({ _id: String(i + 100).padStart(24, '0'), wagonId: w._id, wagonNo: w.wagonNo, wagonType: w.type, currentStage: 'YARD_EXAM', stages: [{ stageName: 'YARD_EXAM', status: 'In Progress', startedAt: '2026-09-09T00:00:00Z', targetDurationHours: 2 }], actionHistory: [] }));
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url()); const path = url.pathname;
    const respond = (data: unknown) => route.fulfill({ json: { success: true, data, pagination: { hasNextPage: false, totalPages: 1, total: Array.isArray(data) ? data.length : 0 } } });
    if (path.endsWith('/auth/refresh-token')) return respond({ accessToken: 'fixture-token' });
    if (path.endsWith('/auth/me')) return respond(user);
    if (path === '/api/v1/wagons') return respond(url.searchParams.get('archived') ? [] : wagons);
    if (path.endsWith('/wagons/deleted')) return respond([]);
    if (path.endsWith('/readiness')) return respond({ blockers: ['Complete the configured workflow'], integrity: { problems: [], canNormalize: false }, documents: [] });
    if (path.endsWith('/workflows/assignees')) return respond([user]);
    if (path.startsWith('/api/v1/wagons/')) return respond(wagons.find(w => path.endsWith(w._id)) || {});
    if (path.endsWith('/workflows')) return respond(workflows);
    if (path.endsWith('/notifications')) return respond({ notifications: [], unreadCount: 0 });
    if (path.endsWith('/master-data')) return route.fulfill({ json: [] });
    if (path.endsWith('/dashboard/team-activity')) return respond({ employees: [], activity: [] });
    if (path.endsWith('/admin/dashboard')) return respond({ totalEmployees: 8, totalAdmins: 1, pendingApprovals: 0, activeUsers: 9, rejectedUsers: 0, recentRegistrations: [] });
    if (/\/users$/.test(path)) return respond([user]);
    if (path.endsWith('/memos')) return respond([{ _id: '000000000000000000000090', memoNo: 'YM-014', memoType: 'sick', rakeName: 'Goods rake', yard: 'Main yard', date: '2026-09-10', time: '08:00', lineNo: '1', entries: [{ _id: 'entry1', wagonId: wagons[0]._id, sno: 1, position: '1', reason: 'Air Leakage', bookedTo: 'HAPA SL' }], approvals: [{ role: 'Inspector', status: 'Pending' }], archived: false }]);
    return respond([]);
  });
  return { user, wagons, workflows };
}
