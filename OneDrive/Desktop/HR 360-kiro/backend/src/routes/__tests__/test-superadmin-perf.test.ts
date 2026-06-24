import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';

jest.mock('../../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  getPool: jest.fn(),
  initializeDatabase: jest.fn()
}));

import { query } from '../../config/database';

describe('Performance Test', () => {
  it('measures performance', async () => {
    const mockQuery = query as jest.Mock;
    mockQuery.mockClear();

    // Create 100 fake orgs
    const fakeOrgs = Array.from({length: 100}).map((_, i) => ({
      id: `org-${i}`,
      name: `Org ${i}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const fakeUsers = Array.from({length: 50}).map((_, i) => ({
      id: `user-${i}`,
      organization_id: `org-x`
    }));

    mockQuery.mockImplementation((sql, params) => {
      if (sql.includes('FROM organizations')) {
        if (sql.includes('COUNT')) return { rows: [{ count: '100' }] };
        return { rows: fakeOrgs };
      }
      if (sql.includes('FROM users')) {
        if (sql.includes('COUNT')) return { rows: [{ count: '50' }] };
        return { rows: fakeUsers };
      }
      return { rows: [] };
    });

    const start1 = performance.now();

    // Original Code
    const { organizations, total } = await organizationService.getAllOrganizations({ pageSize: 1000 });
    const enrichedOrgs = await Promise.all(
      organizations.map(async (org: any) => {
        const { users: members } = await userService.getOrganizationUsers(org.id, { page: 1, pageSize: 1000 });
        return {
          ...org,
          memberCount: members.length,
        };
      })
    );

    const end1 = performance.now();
    console.log(`Original Code: ${end1 - start1} ms. Total queries: ${mockQuery.mock.calls.length}`);
    expect(mockQuery.mock.calls.length).toBeGreaterThan(100);
  });
});

describe('Optimized Performance Test', () => {
  it('measures optimized performance', async () => {
    const mockQuery = query as jest.Mock;
    mockQuery.mockClear();

    // Create 100 fake orgs
    const fakeOrgs = Array.from({length: 100}).map((_, i) => ({
      id: `org-${i}`,
      name: `Org ${i}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Member count rows (one for each org)
    const fakeMemberCounts = fakeOrgs.map((org, i) => ({
      organization_id: org.id,
      count: '50'
    }));

    mockQuery.mockImplementation((sql, params) => {
      if (sql.includes('FROM organizations')) {
        if (sql.includes('COUNT')) return { rows: [{ count: '100' }] };
        return { rows: fakeOrgs };
      }
      if (sql.includes('GROUP BY organization_id')) {
        return { rows: fakeMemberCounts };
      }
      return { rows: [] };
    });

    const start1 = performance.now();

    // Optimized Code
    const { organizations, total } = await organizationService.getAllOrganizations({ pageSize: 1000 });

    const orgIds = organizations.map(org => org.id);
    let memberCounts: Record<string, number> = {};

    if (orgIds.length > 0) {
      const countsResult = await query(
        `SELECT organization_id, COUNT(*) as count
         FROM users
         WHERE organization_id = ANY($1) AND is_active = true
         GROUP BY organization_id`,
        [orgIds]
      );

      countsResult.rows.forEach((row: any) => {
        memberCounts[row.organization_id] = parseInt(row.count, 10);
      });
    }

    const enrichedOrgs = organizations.map(org => ({
      ...org,
      memberCount: memberCounts[org.id] || 0
    }));

    const end1 = performance.now();
    console.log(`Optimized Code: ${end1 - start1} ms. Total queries: ${mockQuery.mock.calls.length}`);
    expect(mockQuery.mock.calls.length).toBeLessThan(5);
  });
});
