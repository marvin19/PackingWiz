import { runMp4InvariantChecks } from '@/dev/mp4-invariants';
import { runMp1InvariantChecks } from '@/dev/mp1-invariants';

async function main(): Promise<void> {
  await runMp1InvariantChecks();
  await runMp4InvariantChecks();
}

main()
  .then(() => {
    console.log('MP1 invariant checks passed.');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
