import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EmptyStringToUndefined } from '../../common/empty-string-to-undefined';

// Creating a new EmploymentAssignment row is how every transfer/promotion/manager-change
// happens — see docs/hrms-prd/05-organisation-data-model.md §7 and §8.
//
// EmptyStringToUndefined matters here for a second reason beyond validation: the service's
// "keep the current value if not explicitly changed" logic (dto.departmentId ?? current...)
// only works if an untouched field arrives as undefined, not "" — otherwise a transfer form
// that only changes one field would silently blank out every other field.
export class CreateAssignmentDto {
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  locationId?: string;

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

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveFrom!: string;

  @IsString()
  @IsNotEmpty()
  reasonCode!: string; // "Promotion" | "Transfer" | "ManagerChange" | "LocationChange" | "Correction"
}
