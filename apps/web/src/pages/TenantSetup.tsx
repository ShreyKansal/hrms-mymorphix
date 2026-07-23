import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import Form, { Field, FormFooter, FormHeader, FormSection } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Heading from '@atlaskit/heading';
import { api, setCurrentTenantId, setDefaultLegalEntityId } from '../api/client';
import type { ProvisionTenantResponse } from '../api/types';

// The minimal setup wizard from docs/build/build-guides/22-system-administration.md —
// "a brand-new small customer should be able to finish setup in a few minutes."
// This IS the bootstrapping flow: nobody has a role to grant before this runs
// (docs/hrms-prd/modules/21-roles-permissions.md §24).
export default function TenantSetup() {
  const navigate = useNavigate();
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
          try {
            const result = await api.post<ProvisionTenantResponse>('/api/v1/tenants', data);
            setCurrentTenantId(result.tenant.id);
            setDefaultLegalEntityId(result.legalEntity.id);
            navigate('/employees');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
          }
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
