import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EmptyStringToUndefined } from '../../common/empty-string-to-undefined';

// Mirrors the mandatory-at-creation fields from
// docs/hrms-prd/modules/01-core-hr-employee-information.md §11.
export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  legalEntityId!: string;

  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  gender?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  personalPhone?: string;

  @IsDateString()
  @IsNotEmpty()
  joiningDate!: string;

  @IsString()
  @IsNotEmpty()
  employmentType!: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  designationId?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  gradeId?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  managerId?: string;
}
