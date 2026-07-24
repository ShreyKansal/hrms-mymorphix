import type { ReactNode } from 'react';
import type { FieldProps } from '@atlaskit/form';

// @atlaskit/form has no built-in select control (only TextField-shaped inputs). fieldProps
// carries Atlaskit-only boolean props (isDisabled/isRequired/isInvalid) meant for components
// that know to translate them — spreading them straight onto a native <select> leaks them as
// invalid DOM attributes (confirmed via real browser console warnings). This maps them to their
// actual native equivalents once, instead of repeating the mapping at every call site.
export function SelectField({
  fieldProps: { isDisabled, isRequired, isInvalid, ...selectProps },
  children,
}: {
  fieldProps: FieldProps<string, HTMLSelectElement>;
  children: ReactNode;
}) {
  return (
    <select {...selectProps} disabled={isDisabled} required={isRequired} aria-invalid={isInvalid}>
      {children}
    </select>
  );
}
