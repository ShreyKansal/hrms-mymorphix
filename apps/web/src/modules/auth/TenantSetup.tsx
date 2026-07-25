import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuthStore } from './store';

// The minimal setup wizard from docs/build/build-guides/22-system-administration.md —
// "a brand-new small customer should be able to finish setup in a few minutes." Now calls
// the provision_tenant() Postgres function (SECURITY DEFINER) instead of a custom API
// endpoint — see supabase/migrations/20260724010000_foundation_schema.sql for why that
// function needs elevated privilege: nobody has a tenant_id yet at this point, so normal
// RLS would otherwise block every insert this flow needs to make.
//
// Checks for a pending invitation before rendering the create-company form at all — a user
// who was invited to an existing tenant should land straight in it, not be offered to create
// a second, unrelated company by mistake.
//
// Migrated off @atlaskit/form: no form library here, just a plain <form> read via FormData
// and native `required` for validation — @atlaskit/form's main value (required-asterisk
// styling, inline error slots) is reproduced directly with Label's `required` prop and plain
// browser-native validation, not lost by dropping the library.
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
    <div className="mx-auto mt-20 max-w-[480px]">
      <h1 className="text-2xl font-medium text-foreground">Set up your company</h1>
      <p className="mb-6 mt-2 text-sm text-text-subtle">
        Just the basics for now — everything else (departments, policies, more legal entities) can be added later, whenever you
        actually need it.
      </p>
      {error && <p className="mb-4 text-sm text-text-danger">{error}</p>}
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
        <div className="mb-4">
          <Label htmlFor="companyName" required>
            Company name
          </Label>
          <Input id="companyName" name="companyName" required autoFocus />
        </div>
        <div className="mb-6">
          <Label htmlFor="legalEntityName" required>
            Primary legal entity name
          </Label>
          <Input id="legalEntityName" name="legalEntityName" required />
        </div>
        <Button type="submit" variant="primary" loading={submitting}>
          Create workspace
        </Button>
      </form>
    </div>
  );
}
