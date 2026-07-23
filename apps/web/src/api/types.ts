// Sprint-1 subset of docs/hrms-prd/08-conceptual-data-model.md's Employee/EmploymentAssignment
// entities. Move to packages/shared-types (generated from the Prisma schema) once more than
// one app needs these — see docs/build/00-architecture-and-tech-stack.md §10.

export interface EmploymentAssignment {
  id: string;
  employeeId: string;
  departmentId: string | null;
  designationId: string | null;
  gradeId: string | null;
  managerId: string | null;
  employmentType: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reasonCode: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  grade?: { id: string; name: string } | null;
}

export interface Employee {
  id: string;
  employeeCode: string;
  legalName: string;
  personalEmail: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'SEPARATION_INITIATED' | 'SEPARATED';
  createdAt: string;
  employmentAssignments: EmploymentAssignment[];
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
}

export interface LegalEntity {
  id: string;
  name: string;
}

export interface ProvisionTenantResponse {
  tenant: Tenant;
  organisation: { id: string; name: string };
  legalEntity: LegalEntity;
}
