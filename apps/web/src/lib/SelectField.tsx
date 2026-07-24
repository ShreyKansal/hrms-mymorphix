import { useState } from 'react';
import type { ReactNode } from 'react';
import { token } from '@atlaskit/tokens';
import type { FieldProps } from '@atlaskit/form';

// @atlaskit/form has no built-in select control (only TextField-shaped inputs). fieldProps
// carries Atlaskit-only boolean props (isDisabled/isRequired/isInvalid) meant for components
// that know to translate them — spreading them straight onto a native <select> leaks them as
// invalid DOM attributes (confirmed via real browser console warnings). This maps them to their
// actual native equivalents once, instead of repeating the mapping at every call site.
//
// Also styled to actually match TextField instead of rendering as a bare, tiny native control
// next to it — measured TextField's real rendered box (40px height, 3px radius, 1px border)
// and its actual design tokens (color.border.input at rest, color.border.focused on focus)
// directly from a live page rather than guessing, so this isn't an approximation.
export function SelectField({
  fieldProps: { isDisabled, isRequired, isInvalid, ...selectProps },
  children,
}: {
  fieldProps: FieldProps<string, HTMLSelectElement>;
  children: ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <select
      {...selectProps}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={isInvalid}
      onFocus={() => {
        setFocused(true);
        selectProps.onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        selectProps.onBlur?.();
      }}
      style={{
        height: 40,
        minWidth: 160,
        padding: '0 6px',
        fontSize: 14,
        fontFamily: 'inherit',
        color: token('color.text', '#172B4D'),
        backgroundColor: isDisabled
          ? token('color.background.disabled', '#F1F2F4')
          : token('color.background.input', '#FFFFFF'),
        border: `1px solid ${
          isInvalid
            ? token('color.border.danger', '#E2483D')
            : focused
              ? token('color.border.focused', '#388BFF')
              : token('color.border.input', '#8590A2')
        }`,
        borderRadius: 3,
        boxSizing: 'border-box',
        outline: 'none',
      }}
    >
      {children}
    </select>
  );
}
