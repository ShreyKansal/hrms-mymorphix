import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';

// Sprint 0's bootstrapping problem, solved per docs/build/build-guides/22-system-administration.md
// "Key user flow: new tenant setup" — this is the one flow allowed to create a tenant with
// nobody yet holding a role to grant it (see docs/hrms-prd/modules/21-roles-permissions.md §24).
@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async provision(dto: ProvisionTenantDto) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.companyName, status: 'ACTIVE' },
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

  async findAll() {
    return this.prisma.tenant.findMany({ include: { organisations: true } });
  }
}
