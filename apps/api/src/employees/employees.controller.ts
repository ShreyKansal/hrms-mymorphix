import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { TenantId } from '../common/tenant-id.decorator';

// Endpoints per docs/build/build-guides/01-core-hr-employee-information.md "API endpoints to build".
// NOTE: no permission-guard is wired in yet — that's Module 21, built next. Every endpoint here
// is a placeholder for "will be permission-checked" until that Guard exists. Do not treat this
// as done from a security standpoint — see docs/hrms-prd/modules/01-core-hr-employee-information.md §12.
@Controller('api/v1/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.employeesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.employeesService.findOne(tenantId, id);
  }

  @Post(':id/assignments')
  createAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.employeesService.createAssignment(tenantId, id, dto);
  }

  @Get(':id/assignment-as-of')
  findAssignmentAsOf(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.employeesService.findAssignmentAsOf(tenantId, id, new Date(date));
  }
}
