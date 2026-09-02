import { runMp4InvariantChecks } from '@/dev/mp4-invariants';
import { runMp1InvariantChecks } from '@/dev/mp1-invariants';
import { runMp5bInvariantChecks } from '@/dev/mp5b-invariants';
import { runMp5cInvariantChecks } from '@/dev/mp5c-invariants';

async function main(): Promise<void> {
  await runMp1InvariantChecks();
  await runMp4InvariantChecks();
  await runMp5bInvariantChecks();
  await runMp5cInvariantChecks();
}

main()
  .then(() => {
    console.log('MP1 invariant checks passed.');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
