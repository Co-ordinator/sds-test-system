'use strict';

const migration = require('../migrations/20260711192000-purge-deleted-user-audit-references');

describe('deleted-user audit reference purge migration', () => {
  it('removes scalar and bulk audit metadata for users that no longer exist', async () => {
    const query = jest.fn().mockResolvedValue([[], {}]);
    await migration.up({ sequelize: { query } });

    const sql = query.mock.calls[0][0];
    expect(sql).toContain("al.details ? 'resourceId'");
    expect(sql).toContain("al.details ? 'userId'");
    expect(sql).toContain("jsonb_array_elements_text(al.details->'ids')");
    expect(sql).toContain('NOT EXISTS');
  });
});
