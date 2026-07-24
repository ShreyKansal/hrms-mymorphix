import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import Form, { Field, FormFooter, FormHeader, FormSection } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Heading from '@atlaskit/heading';
import { useAuthStore } from './store';

// The minimal setup wizard from docs/build/build-guides/22-system-administration.md —
// "a brand-new small customer should be able to finish setup in a few minutes." Now calls
// the provision_tenant() Postgres function (SECURITY DEFINER) instead of a custom API
// endpoint — see supabase/migrations/20260724010000_foundation_schema.sql for why that
// function needs elevated privilege: nobody has a tenant_id yet at this point, so normal
// RLS would otherwise block every insert this flow needs to make.
export default function TenantSetup() {
  const navigate = useNavigate();
  const provisionTenant = useAuthStore((s) => s.provisionTenant);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 480, margin: '80px auto' }}>
      <Heading size="large">Set up your company</Heading>
      <p style={{ marginBottom: 24 }}>
        Just the basics for now — everything else (departments, policies, more legal entities) can
        be added later, whenever you actually need it.
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Form<{ companyName: string; legalEntityName: string }>
        onSubmit={async (data) => {
          const { error } = await provisionTenant(data.companyName, data.legalEntityName);
          if (error) setError(error);
          else navigate('/employees');
        }}
      >
        {({ formProps }) => (
          <form {...formProps}>
            <FormHeader title="" />
            <FormSection>
              <Field name="companyName" label="Company name" isRequired defaultValue="">
                {({ fieldProps }) => <TextField {...fieldProps} autoFocus />}
              </Field>
              <Field name="legalEntityName" label="Primary legal entity name" isRequired defaultValue="">
                {({ fieldProps }) => <TextField {...fieldProps} />}
              </Field>
            </FormSection>
            <FormFooter align="start">
              <Button type="submit" appearance="primary">
                Create workspace
              </Button>
            </FormFooter>
          </form>
        )}
      </Form>
    </div>
  );
}
