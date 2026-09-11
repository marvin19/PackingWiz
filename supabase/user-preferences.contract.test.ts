import fs from 'node:fs';
import path from 'node:path';

import {
  USER_PREFERENCES_DATA_API_GRANTS_MIGRATION,
  USER_PREFERENCES_SCHEMA_MIGRATION,
  USER_PREFERENCES_TABLE,
} from './data-api-grants.contract';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function readMigration(filename: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
}

describe('user_preferences migration contract', () => {
  const schemaSql = readMigration(USER_PREFERENCES_SCHEMA_MIGRATION);
  const grantsSql = readMigration(USER_PREFERENCES_DATA_API_GRANTS_MIGRATION);

  it('defines user_preferences with explicit persisted columns', () => {
    expect(schemaSql).toMatch(/CREATE TABLE public\.user_preferences/i);
    expect(schemaSql).toMatch(/smart_quantities BOOLEAN/i);
    expect(schemaSql).toMatch(/metric_units BOOLEAN/i);
    expect(schemaSql).not.toMatch(/packing_reminders BOOLEAN/i);
  });

  it('enables RLS with auth.uid ownership policies', () => {
    expect(schemaSql).toMatch(
      new RegExp(`ALTER TABLE public\\.${USER_PREFERENCES_TABLE} ENABLE ROW LEVEL SECURITY`, 'i'),
    );
    expect(schemaSql).toMatch(/auth\.uid\(\) = user_id/i);
    expect(schemaSql).toMatch(new RegExp(`CREATE POLICY \\w+ ON public\\.${USER_PREFERENCES_TABLE}`, 'i'));
  });

  it('grants authenticated minimum privileges and revokes anon access', () => {
    expect(grantsSql).toMatch(
      new RegExp(`GRANT SELECT, INSERT, UPDATE ON TABLE public\\.${USER_PREFERENCES_TABLE} TO authenticated`, 'i'),
    );
    expect(grantsSql).toMatch(
      new RegExp(`REVOKE ALL ON TABLE public\\.${USER_PREFERENCES_TABLE} FROM anon`, 'i'),
    );
  });
});
