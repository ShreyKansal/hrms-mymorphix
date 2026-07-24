// Hand-written to match supabase/migrations/20260724010000_foundation_schema.sql.
// Once connected to a real project, regenerate and replace this file with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
// Keeping it hand-written for now so the app type-checks before that project exists.
//
// Everything below uses `type X = {...}` (never `interface X {...}`), and Insert/Update are
// written as fully literal object types — no `Partial<Row>`, no mapped types
// (`{ [K in keyof T]?: T[K] }`), no indexed-access references like `Employee['status']`.
// Confirmed by isolated bisection against this exact supabase-js/postgrest-js version: any of
// those three patterns — including a plain `interface` used as a table's `Row` type — makes
// the select-query-parser's recursive generic resolution bail out to `never` for that table's
// `.select()`, silently (`never[]` instead of a type error, with no indication of the cause).
// Worse, it's not scoped to the offending table: a single bad field anywhere in the `Tables`
// map poisons the whole client's `Schema` generic, breaking `.select('*')` on every table.
// Real `supabase gen types` output always uses `type`, not `interface`, and always spells out
// literal unions inline — this file now matches that shape for exactly this reason. If a
// future schema regeneration reintroduces `interface`, a mapped type, or an indexed-access
// type here, expect the same silent-`never` failure mode.

export type Employee = {
  id: string;
  tenant_id: string;
  legal_entity_id: string;
  employee_code: string;
  legal_name: string;
  date_of_birth: string | null;
  gender: string | null;
  pan_number: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  status: 'draft' | 'active' | 'on_leave' | 'suspended' | 'separation_initiated' | 'separated';
  created_at: string;
  updated_at: string;
};

export type EmploymentAssignment = {
  id: string;
  tenant_id: string;
  employee_id: string;
  department_id: string | null;
  location_id: string | null;
  designation_id: string | null;
  grade_id: string | null;
  manager_id: string | null;
  employment_type: string;
  effective_from: string;
  effective_to: string | null;
  reason_code: string;
  created_at: string;
  // joined relations, present when selected with .select('*, department:departments(*), ...')
  departments?: { id: string; name: string } | null;
  designations?: { id: string; title: string } | null;
  grades?: { id: string; name: string } | null;
  manager?: { id: string; legal_name: string } | null;
};

export type Tenant = {
  id: string;
  name: string;
  status: string;
};

export type LegalEntity = {
  id: string;
  name: string;
  tenant_id: string;
  organisation_id: string;
};

export type Profile = {
  id: string;
  tenant_id: string | null;
  employee_id: string | null;
};

export type Department = {
  id: string;
  tenant_id: string;
  legal_entity_id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Designation = {
  id: string;
  tenant_id: string;
  title: string;
};

export type Grade = {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
};

export type EmployeeEducation = {
  id: string;
  tenant_id: string;
  employee_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  created_at: string;
};

export type EmployeePreviousEmployment = {
  id: string;
  tenant_id: string;
  employee_id: string;
  company_name: string;
  designation: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type Document = {
  id: string;
  tenant_id: string;
  employee_id: string;
  category: 'resume' | 'certificate' | 'id_proof' | 'offer_letter' | 'other';
  file_name: string;
  storage_path: string;
  content_type: string | null;
  uploaded_at: string;
};

// Minimal shape satisfying @supabase/supabase-js's generic Database type parameter —
// enough for typed .from()/.rpc() calls without hand-writing the full generated schema.
// Every table needs `Relationships` and the schema needs `Views`, even if empty — the
// library's GenericSchema/GenericTable constraints require those keys to be present, and
// without them TS silently fails the constraint check and every .from()/.rpc() call
// collapses to `never` instead of erroring, which is a much more confusing thing to debug.
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: Employee;
        Insert: {
          id?: string;
          tenant_id: string;
          legal_entity_id: string;
          employee_code: string;
          legal_name: string;
          date_of_birth?: string | null;
          gender?: string | null;
          pan_number?: string | null;
          personal_email?: string | null;
          personal_phone?: string | null;
          status?: 'draft' | 'active' | 'on_leave' | 'suspended' | 'separation_initiated' | 'separated';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          legal_entity_id?: string;
          employee_code?: string;
          legal_name?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          pan_number?: string | null;
          personal_email?: string | null;
          personal_phone?: string | null;
          status?: 'draft' | 'active' | 'on_leave' | 'suspended' | 'separation_initiated' | 'separated';
          created_at?: string;
          updated_at?: string;
        };
        // Deliberately empty, not a mirror of employment_assignments' FK. The select-query-
        // parser tries two lookups for an embed: first "reverse" (does the CURRENT table's own
        // Relationships array have an entry pointing at the embedded table?), then falls back
        // to "forward" (does the EMBEDDED table's array have an entry pointing back at the
        // current table?). A "reverse" match is hardcoded to produce a single nested object,
        // never an array — it's meant for the child->parent direction (e.g. an assignment
        // embedding its one employee), not parent->children. One employee has MANY employment
        // assignments, so that result has to come from the "forward" fallback instead, which
        // means this array must stay empty so the lookup actually falls through to it. (Found
        // by isolated repro: populating this with a mirrored entry made
        // `.select('*, employment_assignments(*))')` silently type as a single object instead
        // of an array, with no error — same "confidently wrong instead of loud" failure mode as
        // the other bugs in this file's history.)
        Relationships: [];
      };
      employment_assignments: {
        Row: EmploymentAssignment;
        Insert: {
          id?: string;
          tenant_id: string;
          employee_id: string;
          department_id?: string | null;
          location_id?: string | null;
          designation_id?: string | null;
          grade_id?: string | null;
          manager_id?: string | null;
          employment_type: string;
          effective_from: string;
          effective_to?: string | null;
          reason_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          employee_id?: string;
          department_id?: string | null;
          location_id?: string | null;
          designation_id?: string | null;
          grade_id?: string | null;
          manager_id?: string | null;
          employment_type?: string;
          effective_from?: string;
          effective_to?: string | null;
          reason_code?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'employment_assignments_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_assignments_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_assignments_designation_id_fkey';
            columns: ['designation_id'];
            isOneToOne: false;
            referencedRelation: 'designations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_assignments_grade_id_fkey';
            columns: ['grade_id'];
            isOneToOne: false;
            referencedRelation: 'grades';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_assignments_manager_id_fkey';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      departments: {
        Row: Department;
        Insert: {
          id?: string;
          tenant_id: string;
          legal_entity_id: string;
          name: string;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          legal_entity_id?: string;
          name?: string;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      designations: {
        Row: Designation;
        Insert: { id?: string; tenant_id: string; title: string };
        Update: { id?: string; tenant_id?: string; title?: string };
        Relationships: [];
      };
      grades: {
        Row: Grade;
        Insert: { id?: string; tenant_id: string; code: string; name: string };
        Update: { id?: string; tenant_id?: string; code?: string; name?: string };
        Relationships: [];
      };
      tenants: {
        Row: Tenant;
        Insert: { id?: string; name: string; status?: string };
        Update: { id?: string; name?: string; status?: string };
        Relationships: [];
      };
      legal_entities: {
        Row: LegalEntity;
        Insert: { id?: string; name: string; tenant_id: string; organisation_id: string };
        Update: { id?: string; name?: string; tenant_id?: string; organisation_id?: string };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: { id: string; tenant_id?: string | null; employee_id?: string | null };
        Update: { id?: string; tenant_id?: string | null; employee_id?: string | null };
        Relationships: [];
      };
      employee_education: {
        Row: EmployeeEducation;
        Insert: {
          id?: string;
          tenant_id: string;
          employee_id: string;
          institution: string;
          degree: string;
          field_of_study?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          employee_id?: string;
          institution?: string;
          degree?: string;
          field_of_study?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      employee_previous_employment: {
        Row: EmployeePreviousEmployment;
        Insert: {
          id?: string;
          tenant_id: string;
          employee_id: string;
          company_name: string;
          designation?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          employee_id?: string;
          company_name?: string;
          designation?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: {
          id?: string;
          tenant_id: string;
          employee_id: string;
          category?: 'resume' | 'certificate' | 'id_proof' | 'offer_letter' | 'other';
          file_name: string;
          storage_path: string;
          content_type?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          employee_id?: string;
          category?: 'resume' | 'certificate' | 'id_proof' | 'offer_letter' | 'other';
          file_name?: string;
          storage_path?: string;
          content_type?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      provision_tenant: {
        Args: { company_name: string; legal_entity_name: string };
        Returns: { tenant_id: string; organisation_id: string; legal_entity_id: string }[];
      };
      create_employee: {
        Args: {
          p_legal_entity_id: string;
          p_legal_name: string;
          p_joining_date: string;
          p_employment_type: string;
          p_personal_email?: string | null;
          p_department_id?: string | null;
          p_designation_id?: string | null;
          p_grade_id?: string | null;
          p_manager_id?: string | null;
        };
        Returns: Employee;
      };
      transfer_employee: {
        Args: {
          p_employee_id: string;
          p_effective_from: string;
          p_reason_code: string;
          p_department_id?: string | null;
          p_location_id?: string | null;
          p_designation_id?: string | null;
          p_grade_id?: string | null;
          p_manager_id?: string | null;
          p_employment_type?: string | null;
        };
        Returns: EmploymentAssignment;
      };
    };
  };
};
