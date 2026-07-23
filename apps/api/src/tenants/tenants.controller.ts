import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';

@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  provision(@Body() dto: ProvisionTenantDto) {
    return this.tenantsService.provision(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }
}
