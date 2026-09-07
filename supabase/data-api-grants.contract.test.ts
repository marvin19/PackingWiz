import fs from 'node:fs';
import path from 'node:path';

import {
  AUTHENTICATED_TABLE_PRIVILEGES,
  INITIAL_SCHEMA_MIGRATION,
  MP6B1_AUTHENTICATED_TABLE_GRANTS,
  MP6B2_AUTHENTICATED_RPC_EXECUTES,
  MP6B2_CANONICAL_RPCS_MIGRATION,
  MP6B2_CANONICAL_RPC_TABLE_DEPENDENCIES,
  MP6B2_DATA_API_GRANTS_MIGRATION,
  MP6B2_EXISTING_TRIP_TABLE_GRANTS,
  MP6B2_INTERNAL_RPC_HELPERS,
  MP6B2_RPC_TABLE_GRANT_MIGRATIONS,
  MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION,
} from './data-api-grants.contract';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function readMigration(filename: string): string {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
}

function expectTableGrant(
  sql: string,
  table: string,
  privileges: readonly string[],
  role: 'authenticated' | 'anon',
): void {
  expect(sql).toMatch(
    new RegExp(
      `GRANT ${privileges.join(', ')} ON TABLE public\\.${table} TO ${role}`,
      'i',
    ),
  );
}

describe('MP6-B2 Data API grants migration contract', () => {
  const b1GrantsSql = readMigration(MP6B2_DATA_API_GRANTS_MIGRATION);
  const tripGrantsSql = readMigration(MP6B2_TRIP_TABLE_DATA_API_GRANTS_MIGRATION);
  const rpcsSql = readMigration(MP6B2_CANONICAL_RPCS_MIGRATION);
  const initialSql = readMigration(INITIAL_SCHEMA_MIGRATION);

  it('grants authenticated SELECT/INSERT/UPDATE/DELETE on all B1 canonical tables', () => {
    for (const table of MP6B1_AUTHENTICATED_TABLE_GRANTS) {
      expectTableGrant(b1GrantsSql, table, AUTHENTICATED_TABLE_PRIVILEGES, 'authenticated');
    }
  });

  it('grants authenticated minimum privileges on all existing trip tables for invoker RPCs', () => {
    for (const [table, privileges] of Object.entries(MP6B2_EXISTING_TRIP_TABLE_GRANTS)) {
      expectTableGrant(tripGrantsSql, table, privileges, 'authenticated');
    }
  });

  it('covers every canonical RPC table dependency across B1 and trip-table grant migrations', () => {
    for (const table of MP6B2_CANONICAL_RPC_TABLE_DEPENDENCIES) {
      const migrationFile = MP6B2_RPC_TABLE_GRANT_MIGRATIONS[table];
      const sql = readMigration(migrationFile);
      const privileges =
        table in MP6B2_EXISTING_TRIP_TABLE_GRANTS
          ? MP6B2_EXISTING_TRIP_TABLE_GRANTS[table as keyof typeof MP6B2_EXISTING_TRIP_TABLE_GRANTS]
          : AUTHENTICATED_TABLE_PRIVILEGES;
      expectTableGrant(sql, table, privileges, 'authenticated');
    }
  });

  it('revokes anon table access on B1 and existing trip tables', () => {
    const allTables = [
      ...MP6B1_AUTHENTICATED_TABLE_GRANTS,
      ...Object.keys(MP6B2_EXISTING_TRIP_TABLE_GRANTS),
    ];

    for (const table of allTables) {
      const sql =
        table in MP6B2_EXISTING_TRIP_TABLE_GRANTS ? tripGrantsSql : b1GrantsSql;
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON TABLE public\\.${table} FROM anon`, 'i'));
    }
  });

  it('grants EXECUTE on canonical RPCs to authenticated only', () => {
    for (const rpc of MP6B2_AUTHENTICATED_RPC_EXECUTES) {
      expect(b1GrantsSql).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${rpc}\\(JSONB\\) TO authenticated`, 'i'),
      );
      expect(b1GrantsSql).toMatch(
        new RegExp(`REVOKE EXECUTE ON FUNCTION public\\.${rpc}\\(JSONB\\) FROM anon`, 'i'),
      );
    }
  });

  it('does not expose B2 helper functions to authenticated via EXECUTE grant', () => {
    const combined = `${b1GrantsSql}\n${tripGrantsSql}\n${rpcsSql}`;
    for (const helper of MP6B2_INTERNAL_RPC_HELPERS) {
      expect(combined).not.toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${helper}`, 'i'),
      );
    }
  });

  it('B1 migration defines RLS policies (grants must not replace RLS)', () => {
    const b1Sql = readMigration('20260905100000_mp6b1_canonical_packing_schema.sql');
    for (const table of MP6B1_AUTHENTICATED_TABLE_GRANTS) {
      expect(b1Sql).toMatch(new RegExp(`ENABLE ROW LEVEL SECURITY`, 'i'));
      expect(b1Sql).toMatch(new RegExp(`CREATE POLICY \\w+ ON public\\.${table}`, 'i'));
    }
  });

  it('initial schema defines RLS on all existing trip tables touched by RPCs', () => {
    for (const table of Object.keys(MP6B2_EXISTING_TRIP_TABLE_GRANTS)) {
      expect(initialSql).toMatch(
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'),
      );
      expect(initialSql).toMatch(
        new RegExp(`CREATE POLICY \\w+ ON public\\.${table}`, 'i'),
      );
    }
  });

  it('canonical RPC functions remain SECURITY INVOKER (default — no DEFINER bypass)', () => {
    for (const rpc of MP6B2_AUTHENTICATED_RPC_EXECUTES) {
      const fnBlock = rpcsSql.slice(
        rpcsSql.indexOf(`FUNCTION public.${rpc}`),
        rpcsSql.indexOf(`GRANT EXECUTE ON FUNCTION public.${rpc}`),
      );
      expect(fnBlock).not.toMatch(/SECURITY DEFINER/i);
    }
  });
});
