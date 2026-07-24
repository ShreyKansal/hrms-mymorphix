import { useEffect, useState } from 'react';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore } from './store';
import { SelectField } from '../../lib/SelectField';

interface FormData {
  legalName: string;
  personalEmail: string;
  joiningDate: string;
  departmentId: string;
  designationId: string;
  gradeId: string;
  managerId: string;
}

// docs/build/build-guides/01-core-hr-employee-information.md screen #3 — "a focused
// Modal ... one task per modal" per Atlaskit's own usage guidance.
// NOTE: <StrictMode> is deliberately not used in main.tsx — @atlaskit/modal-dialog has a
// genuine bug under React 18 StrictMode (closes itself immediately on open). See
// docs/build/verification-evidence/README.md Bug 1. Nothing about the Supabase rewrite
// changes that finding — it's an Atlaskit/React issue, unrelated to the backend.
export default function CreateEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const legalEntityId = useAuthStore((s) => s.legalEntityId);
  const { employees, createEmployee } = useEmployeesStore();
  const { departments, designations, grades, fetchAll } = useOrgManagementStore();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModalTransition>
      <Modal onClose={onClose}>
        <Form<FormData>
          onSubmit={async (data) => {
            if (!legalEntityId) {
              setError('No legal entity found for this workspace — run setup again.');
              return;
            }
            const { error } = await createEmployee({
              legalEntityId,
              legalName: data.legalName,
              joiningDate: data.joiningDate,
              personalEmail: data.personalEmail,
              departmentId: data.departmentId || undefined,
              designationId: data.designationId || undefined,
              gradeId: data.gradeId || undefined,
              managerId: data.managerId || undefined,
            });
            if (error) setError(error);
            else onCreated();
          }}
        >
          {({ formProps }) => (
            <form {...formProps} id="create-employee-form">
              <ModalHeader hasCloseButton>
                <ModalTitle>Add employee</ModalTitle>
              </ModalHeader>
              <ModalBody>
                {error && (
                  <MessageWrapper>
                    <ErrorMessage>{error}</ErrorMessage>
                  </MessageWrapper>
                )}
                <FormSection>
                  <Field name="legalName" label="Full legal name" isRequired defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} autoFocus />}
                  </Field>
                  <Field name="personalEmail" label="Personal email" defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} type="email" />}
                  </Field>
                  <Field name="joiningDate" label="Joining date" isRequired defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} type="date" />}
                  </Field>
                  <Field<string, HTMLSelectElement> name="departmentId" label="Department" defaultValue="">
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">—</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="designationId" label="Designation" defaultValue="">
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">—</option>
                        {designations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="gradeId" label="Grade" defaultValue="">
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">—</option>
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.code} — {g.name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="managerId" label="Reports to" defaultValue="">
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">—</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.legal_name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                </FormSection>
              </ModalBody>
              <ModalFooter>
                <Button appearance="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary">
                  Create
                </Button>
              </ModalFooter>
            </form>
          )}
        </Form>
      </Modal>
    </ModalTransition>
  );
}
