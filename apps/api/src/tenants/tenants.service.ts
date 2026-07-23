import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';

// Sprint 0's bootstrapping problem, solved per docs/build/build-guides/22-system-administration.md
// "Key user flow: new tenant setup" — this is the one flow allowed to create a tenant with
// nobody yet holding a role to grant it (see docs/hrms-prd/modules/21-roles-permissions.md §24).
@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async provision(dto: ProvisionTenantDto) {
    // The ID is generated here, in application code, instead of left to the database's
    // default(uuid()) — specifically so the Row-Level Security session variable can be set
    // to it *before* the first INSERT. See
    // prisma/migrations/20260724010000_rls_tenant_provisioning_fix/migration.sql for why:
    // without this, `INSERT ... RETURNING` (which Prisma's .create() always does) fails
    // RLS's implicit "can this session see the row it just inserted" check, because there's
    // no tenant context yet for a tenant that doesn't exist yet. Setting the context to the
    // ID we're *about* to insert closes that gap and lets tenant provisioning use the exact
    // same uniformly-scoped policies as every other write in the app — no special-cased
    // "unconditional insert" policy needed, which was the actual bug.
    const tenantId = randomUUID();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const tenant = await tx.tenant.create({
        data: { id: tenantId, name: dto.companyName, status: 'ACTIVE' },
      });

      const organisation = await tx.organisation.create({
        data: { tenantId: tenant.id, name: dto.companyName },
      });

      const legalEntity = await tx.legalEntity.create({
        data: { tenantId: tenant.id, organisationId: organisation.id, name: dto.legalEntityName },
      });

      return { tenant, organisation, legalEntity };
    });
  }

  // Deliberately narrow: returns only tenants matching the caller's own session context —
  // per RLS this can genuinely never return more than one row now, which is correct.
  // Full cross-tenant enumeration is a platform-operator (System Administrator, not HR
  // Administrator) capability that doesn't exist yet — see
  // docs/hrms-prd/modules/22-system-administration.md and Persona 13 in
  // docs/hrms-prd/04-personas-and-roles.md. This method stays for local dev convenience only.
  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) => tx.tenant.findMany({ include: { organisations: true } }));
  }
}
