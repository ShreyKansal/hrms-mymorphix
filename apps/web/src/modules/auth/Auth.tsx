import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import Form, { Field, FormFooter, FormSection, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Heading from '@atlaskit/heading';
import { useAuthStore } from './store';

interface FormData {
  email: string;
  password: string;
}

// Real Supabase Auth — replaces the Sprint-1 "no login, just a tenant ID in localStorage"
// placeholder entirely. This is the actual front door now.
export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 420, margin: '80px auto' }}>
      <Heading size="large">{mode === 'sign-in' ? 'Log in' : 'Create an account'}</Heading>

      {signedUpEmail ? (
        <p>Check <strong>{signedUpEmail}</strong> for a confirmation link, then come back and log in.</p>
      ) : (
        <>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <Form<FormData>
            onSubmit={async (data) => {
              setError(null);
              if (mode === 'sign-in') {
                const { error } = await signIn(data.email, data.password);
                if (error) setError(error);
                else navigate('/employees');
              } else {
                const { error } = await signUp(data.email, data.password);
                if (error) setError(error);
                else setSignedUpEmail(data.email);
              }
            }}
          >
            {({ formProps }) => (
              <form {...formProps}>
                <FormSection>
                  <Field name="email" label="Email" isRequired defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} type="email" autoFocus />}
                  </Field>
                  <Field name="password" label="Password" isRequired defaultValue="">
                    {({ fieldProps }) => (
                      <>
                        <TextField {...fieldProps} type="password" />
                        {mode === 'sign-up' && <HelperMessage>At least 6 characters.</HelperMessage>}
                      </>
                    )}
                  </Field>
                </FormSection>
                <FormFooter align="start">
                  <Button type="submit" appearance="primary">
                    {mode === 'sign-in' ? 'Log in' : 'Sign up'}
                  </Button>
                  <Button appearance="subtle" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
                    {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                  </Button>
                </FormFooter>
              </form>
            )}
          </Form>
        </>
      )}
    </div>
  );
}
