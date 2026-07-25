import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MailCheck, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Alert } from '../../components/ui/alert';
import { Avatar } from '../../components/ui/avatar';
import { useAuthStore } from './store';

// The Google "G" mark. Inlined so it stays crisp and needs no asset/network request.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// The Microsoft four-square mark — used for the Outlook / Microsoft 365 (Azure) sign-in.
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-foreground-lighter">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// The right-hand testimonial, mirroring Supabase's own login aside: a huge, faint quotation mark
// hung above-left of a text-3xl quote, then an avatar with the attribution.
function Testimonial() {
  const name = 'Shrey Kansal';
  return (
    <div className="relative flex flex-col gap-6">
      <div className="absolute -left-11 -top-12 select-none" aria-hidden="true">
        <span className="text-[160px] leading-none text-foreground-muted/30">&ldquo;</span>
      </div>
      <blockquote className="z-10 max-w-lg text-3xl leading-snug tracking-tight text-foreground">
        Our entire people ops runs here now — hiring, records, org changes. Everything in one place, and nothing living in a
        spreadsheet anymore.
      </blockquote>
      <div className="flex items-center gap-4">
        <Avatar name={name} size="lg" />
        <div className="flex flex-col">
          <cite className="font-medium not-italic text-foreground-light">{name}</cite>
          <span className="text-sm text-foreground-lighter">Founder, MyMorphix</span>
        </div>
      </div>
    </div>
  );
}

// The front door. Two-column Supabase login: a focused form on the left, a testimonial on the
// right (shown from xl up). Google OAuth sits above the email/password form.
export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft, resetPassword } = useAuthStore();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | 'google' | 'microsoft'>(null);

  const runOAuth = async (provider: 'google' | 'microsoft') => {
    setError(null);
    setNotice(null);
    setOauthLoading(provider);
    const { error } = await (provider === 'google' ? signInWithGoogle() : signInWithMicrosoft());
    if (error) {
      setError(error);
      setOauthLoading(null);
    }
    // On success the browser redirects to the provider, so no further state handling is needed.
  };

  const handleForgot = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email first, then choose “Forgot password?”.');
      return;
    }
    const { error } = await resetPassword(email);
    if (error) setError(error);
    else setNotice(`We sent a password reset link to ${email}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
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
  };

  const switchMode = () => {
    setError(null);
    setNotice(null);
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: form */}
      <div className="flex w-full flex-col bg-background px-6 py-8 sm:px-12 xl:w-[46%]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">HRMS</span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-foreground-lighter">
              {mode === 'sign-in' ? 'Sign in to your HRMS workspace' : 'Get started with your HRMS workspace'}
            </p>

            {signedUpEmail ? (
              <Alert variant="brand" icon={<MailCheck className="h-4 w-4" />} title="Confirm your email" className="mt-6">
                <p className="text-foreground-light">
                  We sent a confirmation link to <strong className="text-foreground">{signedUpEmail}</strong>. Open it, then come
                  back and sign in.
                </p>
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive" title="Couldn't continue" className="mt-6">
                    {error}
                  </Alert>
                )}
                {notice && (
                  <Alert variant="brand" title="Check your inbox" className="mt-6">
                    {notice}
                  </Alert>
                )}

                <div className="mt-6 space-y-4">
                  <Button
                    variant="outline"
                    size="large"
                    className="w-full bg-background"
                    onClick={() => runOAuth('google')}
                    loading={oauthLoading === 'google'}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading !== 'google' && <GoogleIcon className="h-4 w-4" />}
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    size="large"
                    className="w-full bg-background"
                    onClick={() => runOAuth('microsoft')}
                    loading={oauthLoading === 'microsoft'}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading !== 'microsoft' && <MicrosoftIcon className="h-4 w-4" />}
                    Continue with Microsoft
                  </Button>
                </div>

                <OrDivider />

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Field label="Email" htmlFor="email" required>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm text-foreground-light">
                        Password <span className="text-destructive-600">*</span>
                      </label>
                      {mode === 'sign-in' && (
                        <button type="button" onClick={handleForgot} className="text-xs font-medium text-brand-link hover:underline">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-foreground-lighter transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === 'sign-up' && <p className="text-xs text-foreground-lighter">At least 6 characters.</p>}
                  </div>

                  <Button type="submit" variant="primary" size="large" loading={submitting} className="w-full">
                    {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                  </Button>
                </form>
              </>
            )}

            {!signedUpEmail && (
              <p className="mt-6 text-center text-sm text-foreground-lighter">
                {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button type="button" onClick={switchMode} className="font-medium text-foreground underline underline-offset-2 hover:text-brand-link">
                  {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-foreground-lighter">
          By continuing, you agree to our <span className="underline">Terms of Service</span> and{' '}
          <span className="underline">Privacy Policy</span>, and to receive periodic emails with updates.
        </p>
      </div>

      {/* Right: testimonial */}
      <aside className="hidden flex-1 flex-col items-center justify-center border-l border-default bg-surface-100 px-12 xl:flex">
        <Testimonial />
      </aside>
    </div>
  );
}
