import { Transform } from 'class-transformer';

/**
 * Every optional field in this codebase needs this, not just email fields.
 *
 * The bug this fixes (found via an actual browser test, not spotted by code review):
 * @atlaskit/form always submits every declared field, including untouched optional ones,
 * as their defaultValue (almost always ""), never as `undefined`. class-validator's
 * @IsOptional() only skips remaining validators for `null`/`undefined` — an empty string
 * is neither, so e.g. @IsEmail() on an untouched optional email field fails validation
 * on a perfectly valid "the user left this blank" submission. Real forms will hit this
 * on every optional field, every time a user reasonably leaves one blank.
 *
 * Usage: put @EmptyStringToUndefined() *before* @IsOptional() on any optional DTO field
 * (decorators apply bottom-up, so this needs to run first to normalize "" to undefined
 * before IsOptional decides whether to skip the rest).
 */
export function EmptyStringToUndefined() {
  return Transform(({ value }) => (value === '' ? undefined : value));
}
