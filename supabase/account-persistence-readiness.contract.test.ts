import fs from 'node:fs';
import path from 'node:path';

import {
  ACCOUNT_PERSISTENCE_SCHEMA_MIGRATIONS,
  DIRECT_AUTH_USER_OWNED_TABLES,
  PROFILE_SCOPED_USER_OWNED_TABLES,
  TRIP_OWNED_CHILD_TABLES,
} from './account-persistence.contract';
import { USER_PREFERENCES_SCHEMA_MIGRATION } from './data-api-grants.contract';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function readMigration(filename: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
}

function combinedSchemaSql(): string {
  return ACCOUNT_PERSISTENCE_SCHEMA_MIGRATIONS.map(readMigration).join('\n');
}

function extractCreateTableBlock(sql: string, table: string): string {
  const start = sql.search(new RegExp(`CREATE TABLE public\\.${table}\\b`, 'i'));
  if (start < 0) {
    return '';
  }

  const tail = sql.slice(start);
  const end = tail.indexOf(');');
  return end >= 0 ? tail.slice(0, end + 2) : tail;
}

describe('account persistence readiness contract', () => {
  const schemaSql = combinedSchemaSql();
  const preferencesSql = readMigration(USER_PREFERENCES_SCHEMA_MIGRATION);

  it('anchors direct user-owned tables to auth.users', () => {
    for (const { table, ownerColumn } of DIRECT_AUTH_USER_OWNED_TABLES) {
      const block = extractCreateTableBlock(schemaSql, table);
      expect(block).toMatch(new RegExp(`${ownerColumn}`, 'i'));
      expect(block).toMatch(/REFERENCES auth\.users/i);
    }
  });

  it('anchors Important master tables to packing_profiles ownership chain', () => {
    for (const { table } of PROFILE_SCOPED_USER_OWNED_TABLES) {
      const block = extractCreateTableBlock(schemaSql, table);
      expect(block).toMatch(/REFERENCES public\.packing_profiles/i);
    }
  });

  it('enables RLS with auth.uid ownership on user-owned tables', () => {
    for (const { table, ownerColumn } of [
      ...DIRECT_AUTH_USER_OWNED_TABLES,
      ...PROFILE_SCOPED_USER_OWNED_TABLES,
    ]) {
      expect(schemaSql).toMatch(
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'),
      );
      expect(schemaSql).toMatch(
        new RegExp(`CREATE POLICY \\w+ ON public\\.${table}[\\s\\S]*?auth\\.uid\\(\\)`, 'i'),
      );
      expect(schemaSql).toMatch(
        new RegExp(`auth\\.uid\\(\\) = ${ownerColumn}`, 'i'),
      );
    }
  });

  it('scopes trip-owned child tables through parent trip ownership', () => {
    for (const table of TRIP_OWNED_CHILD_TABLES) {
      expect(schemaSql).toMatch(
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'),
      );
      expect(schemaSql).toMatch(
        new RegExp(
          `CREATE POLICY \\w+ ON public\\.${table}[\\s\\S]*?trips\\.user_id = auth\\.uid\\(\\)`,
          'i',
        ),
      );
    }
  });

  it('does not use packing-domain profile-self as a persistence owner key', () => {
    expect(preferencesSql).not.toMatch(/profile-self/i);
    expect(preferencesSql).toMatch(/user_id UUID PRIMARY KEY REFERENCES auth\.users/i);
  });
});
