import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';
import { TenantId } from '../common/tenant-id.decorator';

@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // Deliberately the one endpoint in the app with no @TenantId() requirement — provisioning
  // a tenant is definitionally the one action that happens before any tenant context exists.
  @Post()
  provision(@Body() dto: ProvisionTenantDto) {
    return this.tenantsService.provision(dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.tenantsService.findAll(tenantId);
  }
}
