import { IsNotEmpty, IsString } from 'class-validator';

// Minimal version of docs/build/build-guides/22-system-administration.md's setup wizard —
// company name + one legal entity, nothing else forced up front.
export class ProvisionTenantDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  legalEntityName!: string;
}
