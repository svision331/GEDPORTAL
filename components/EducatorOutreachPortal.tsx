/**
 * Entry point — re-exports types and the main portal component.
 * The implementation is split across components/portal/ for maintainability.
 *
 * External imports (app/actions.ts, lib/aiService.ts, etc.) should import
 * types directly from @/components/portal/types going forward.
 */
export type { Language, Student } from "./portal/types";
export { default } from "./portal";
