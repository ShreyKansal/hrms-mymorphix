const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Sprint-1 stand-in for real auth — mirrors apps/api/src/common/tenant-id.decorator.ts's
// own "temporary" note. Once Module 21's real login exists, this becomes "read from the
// authenticated session" instead of localStorage.
export function getCurrentTenantId(): string | null {
  return localStorage.getItem('hrms_dev_tenant_id');
}

export function setCurrentTenantId(tenantId: string) {
  localStorage.setItem('hrms_dev_tenant_id', tenantId);
}

// Sprint 1 only ever creates one legal entity at setup time (Module 2's multi-entity
// support comes later) — stash it so Create Employee doesn't need a picker yet.
export function getDefaultLegalEntityId(): string | null {
  return localStorage.getItem('hrms_dev_legal_entity_id');
}

export function setDefaultLegalEntityId(legalEntityId: string) {
  localStorage.setItem('hrms_dev_legal_entity_id', legalEntityId);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tenantId = getCurrentTenantId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
