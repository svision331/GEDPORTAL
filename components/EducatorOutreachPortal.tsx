/**
 * Backwards-compatibility shim.
 * The portal has been restructured to src/features/portal/.
 * This file exists only to avoid breaking any external imports.
 */
export type { Language, Student } from "@/src/models";
export { default } from "@/src/features/portal/Portal";
