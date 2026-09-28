/**
 * Process exit codes used by the CLI.
 *
 * oclif exits 0 on success and 2 on error by default. Codes defined here are
 * deliberate, documented signals for scripts/CI to branch on.
 */
/**
 * A deploy/destroy was accepted but the CLI could not confirm completion
 * (e.g. the operation status endpoint was unavailable). The operation may or
 * may not have finished; rerun `blueprints info` to check. Mirrors EX_TEMPFAIL
 * from sysexits.h ("temporary failure; the user is invited to retry").
 */
export const EXIT_OPERATION_UNCONFIRMED = 75;
/** Machine-readable error code paired with {@link EXIT_OPERATION_UNCONFIRMED}. */
export const CODE_OPERATION_UNCONFIRMED = 'OPERATION_UNCONFIRMED';
