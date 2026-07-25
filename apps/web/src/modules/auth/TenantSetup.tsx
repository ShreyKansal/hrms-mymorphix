import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { useAuthStore } from './store';

// The minimal setup wizard ("a brand-new small customer should be able to finish setup in a few
// minutes"). Calls provision_tenant() (SECURITY DEFINER). Checks for a pending invitation first —
// an invited user should land straight in their tenant, not be offered to create a second one.
export default function TenantSetup() {
  const navigate = useNavigate();
  const provisionTenant = useAuthStore((s) => s.provisionTenant);
  const tryAcceptInvitation = useAuthStore((s) => s.tryAcceptInvitation);
  const [checkingInvitation, setCheckingInvitation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const joined = await tryAcceptInvitation();
      if (joined) {
        navigate('/employees');
        return;
      }
      setCheckingInvitation(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingInvitation) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-default bg-surface-200 text-foreground-light">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Set up your company</h1>
          <p className="mt-1 max-w-sm text-sm text-foreground-lighter">
            Just the basics for now — departments, policies, and more legal entities can be added later, whenever you need them.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setSubmitting(true);
            setError(null);
            const { error } = await provisionTenant(String(data.get('companyName')), String(data.get('legalEntityName')));
            setSubmitting(false);
            if (error) setError(error);
            else navigate('/employees');
          }}
        >
          <Card>
            <CardContent className="space-y-4 py-5">
              {error && (
                <Alert variant="destructive" title="Couldn't create your workspace">
                  {error}
                </Alert>
              )}
              <Field
                label="Company name"
                htmlFor="companyName"
                required
                description="The name of your organisation as your team will recognise it."
              >
                <Input id="companyName" name="companyName" required autoFocus placeholder="Acme Inc." />
              </Field>
              <Field
                label="Primary legal entity name"
                htmlFor="legalEntityName"
                required
                description="The registered entity employees are hired under."
              >
                <Input id="legalEntityName" name="legalEntityName" required placeholder="Acme Technologies Pvt. Ltd." />
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" variant="primary" loading={submitting}>
                Create workspace
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
