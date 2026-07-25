import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuthStore } from './store';

// Real Supabase Auth — replaces the Sprint-1 "no login, just a tenant ID in localStorage"
// placeholder entirely. This is the actual front door now.
export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto mt-20 max-w-[420px]">
      <h1 className="text-2xl font-medium text-foreground">{mode === 'sign-in' ? 'Log in' : 'Create an account'}</h1>

      {signedUpEmail ? (
        <p className="mt-4 text-sm text-text-subtle">
          Check <strong className="text-foreground">{signedUpEmail}</strong> for a confirmation link, then come back and log in.
        </p>
      ) : (
        <>
          {error && <p className="mt-4 text-sm text-text-danger">{error}</p>}
          <form
            className="mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const data = new FormData(e.currentTarget);
              const email = String(data.get('email'));
              const password = String(data.get('password'));
              setSubmitting(true);
              if (mode === 'sign-in') {
                const { error } = await signIn(email, password);
                setSubmitting(false);
                if (error) setError(error);
                else navigate('/employees');
              } else {
                const { error } = await signUp(email, password);
                setSubmitting(false);
                if (error) setError(error);
                else setSignedUpEmail(email);
              }
            }}
          >
            <div className="mb-4">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" name="email" type="email" required autoFocus />
            </div>
            <div className="mb-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input id="password" name="password" type="password" required />
              {mode === 'sign-up' && <p className="mt-1 text-xs text-text-subtlest">At least 6 characters.</p>}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button type="submit" variant="primary" loading={submitting}>
                {mode === 'sign-in' ? 'Log in' : 'Sign up'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
                {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
