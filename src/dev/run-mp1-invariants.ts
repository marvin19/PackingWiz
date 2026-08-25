import { runMp1InvariantChecks } from '@/dev/mp1-invariants';

runMp1InvariantChecks()
  .then(() => {
    console.log('MP1 invariant checks passed.');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
