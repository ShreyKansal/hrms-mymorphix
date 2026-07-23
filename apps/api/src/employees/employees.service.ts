import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

// Implements the core of docs/hrms-prd/modules/01-core-hr-employee-information.md.
// The one rule that matters most: we never overwrite an EmploymentAssignment row.
// A "change" is always a new row, with the old row's effectiveTo closed out to match.
//
// Every method runs through prisma.withTenant(...) — this both scopes the Postgres
// session for Row-Level Security (docs/hrms-prd/10-security-privacy-audit.md §1) and
// gives us one transaction per request, so a partial write (e.g. employee created but
// its first assignment failing) can never happen.
@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateEmployeeDto) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      // Employee ID generation is a stub here — Module 22's configurable numbering scheme
      // replaces this once that module exists. For now: EMP-<timestamp> is good enough to
      // prove the flow end-to-end without colliding in dev.
      const employeeCode = `EMP-${Date.now()}`;

      if (dto.panNumber) {
        const existing = await tx.employee.findFirst({
          where: { tenantId, panNumber: dto.panNumber },
        });
        if (existing) {
          throw new ConflictException(
            `An employee with PAN ${dto.panNumber} already exists in this tenant (id: ${existing.id}). ` +
              `See docs/hrms-prd/modules/01-core-hr-employee-information.md §11 — government IDs must be unique per tenant.`,
          );
        }
      }

      const employee = await tx.employee.create({
        data: {
          tenantId,
          legalEntityId: dto.legalEntityId,
          employeeCode,
          legalName: dto.legalName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender,
          panNumber: dto.panNumber,
          personalEmail: dto.personalEmail,
          personalPhone: dto.personalPhone,
          status: 'DRAFT',
        },
      });

      await tx.employmentAssignment.create({
        data: {
          tenantId,
          employeeId: employee.id,
          departmentId: dto.departmentId,
          designationId: dto.designationId,
          gradeId: dto.gradeId,
          managerId: dto.managerId,
          employmentType: dto.employmentType,
          effectiveFrom: new Date(dto.joiningDate),
          effectiveTo: null,
          reasonCode: 'Hire',
        },
      });

      return tx.employee.findUniqueOrThrow({
        where: { id: employee.id },
        include: { employmentAssignments: { where: { effectiveTo: null } } },
      });
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: {
          employmentAssignments: {
            where: { effectiveTo: null },
            include: { department: true, designation: true, grade: true },
          },
        },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id, tenantId },
        include: {
          employmentAssignments: {
            orderBy: { effectiveFrom: 'desc' },
            include: { department: true, designation: true, grade: true, location: true },
          },
          compensations: { orderBy: { effectiveFrom: 'desc' } },
        },
      });
      if (!employee) {
        // Deliberately the same "not found" whether the row doesn't exist at all or
        // belongs to a different tenant and RLS hid it — never leak *which* case it was.
        throw new NotFoundException(`No employee ${id} in this tenant`);
      }
      return employee;
    });
  }

  // The "transfer" action — docs/hrms-prd/modules/01-core-hr-employee-information.md §7.2.
  async createAssignment(tenantId: string, employeeId: string, dto: CreateAssignmentDto) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const employee = await tx.employee.findFirst({ where: { id: employeeId, tenantId } });
      if (!employee) {
        throw new NotFoundException(`No employee ${employeeId} in this tenant`);
      }

      const currentAssignment = await tx.employmentAssignment.findFirst({
        where: { tenantId, employeeId, effectiveTo: null },
      });

      const effectiveFrom = new Date(dto.effectiveFrom);

      // Module 1 §7.2's decision point: block backdating into what will later be a locked
      // payroll period. Payroll doesn't exist yet, so this is a placeholder check — the
      // real one queries Module 6's payroll_locked_periods once that table exists.
      if (currentAssignment && effectiveFrom < currentAssignment.effectiveFrom) {
        throw new BadRequestException(
          'Effective date is before the current assignment started. Backdated corrections need the ' +
            'retroactive-correction path (docs/hrms-prd/modules/01-core-hr-employee-information.md §7.3), not this endpoint.',
        );
      }

      if (currentAssignment) {
        await tx.employmentAssignment.update({
          where: { id: currentAssignment.id },
          data: { effectiveTo: effectiveFrom },
        });
      }

      return tx.employmentAssignment.create({
        data: {
          tenantId,
          employeeId,
          departmentId: dto.departmentId ?? currentAssignment?.departmentId,
          locationId: dto.locationId ?? currentAssignment?.locationId,
          designationId: dto.designationId ?? currentAssignment?.designationId,
          gradeId: dto.gradeId ?? currentAssignment?.gradeId,
          managerId: dto.managerId ?? currentAssignment?.managerId,
          employmentType: dto.employmentType ?? currentAssignment?.employmentType ?? 'Permanent',
          effectiveFrom,
          effectiveTo: null,
          reasonCode: dto.reasonCode,
        },
      });
    });
  }

  // Direct implementation of the acceptance criterion in
  // docs/hrms-prd/modules/01-core-hr-employee-information.md §25 —
  // "who was employee X's manager on date Y" as a simple range query, no audit-log replay.
  async findAssignmentAsOf(tenantId: string, employeeId: string, asOfDate: Date) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.employmentAssignment.findFirst({
        where: {
          tenantId,
          employeeId,
          effectiveFrom: { lte: asOfDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOfDate } }],
        },
        include: { department: true, designation: true, grade: true },
      }),
    );
  }
}
