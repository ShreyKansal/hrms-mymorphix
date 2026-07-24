import { useEffect, useState } from 'react';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore } from './store';
import type { EmploymentAssignment } from '../../lib/database.types';
import { SelectField } from '../../lib/SelectField';

const REASON_CODES = ['Promotion', 'Transfer', 'ManagerChange', 'Correction'];

interface FormData {
  effectiveFrom: string;
  reasonCode: string;
  departmentId: string;
  designationId: string;
  gradeId: string;
  employmentType: string;
}

// docs/hrms-prd/modules/01-core-hr-employee-information.md §7.2 — a transfer never edits the
// current assignment row in place, it closes it out and inserts a new one. That's entirely the
// transfer_employee() RPC's job (already verified end-to-end, including the tenant-ownership
// fix); this modal is just the form in front of it. Fields default to the current assignment's
// values — a transfer is usually a change to ONE thing (e.g. just the designation), not a
// from-scratch re-entry of everything.
export default function TransferEmployeeModal({
  employeeId,
  current,
  onClose,
  onTransferred,
}: {
  employeeId: string;
  current: EmploymentAssignment | undefined;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const transferEmployee = useEmployeesStore((s) => s.transferEmployee);
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
            setError(null);
            const { error } = await transferEmployee({
              employeeId,
              effectiveFrom: data.effectiveFrom,
              reasonCode: data.reasonCode,
              departmentId: data.departmentId || undefined,
              designationId: data.designationId || undefined,
              gradeId: data.gradeId || undefined,
              employmentType: data.employmentType || undefined,
            });
            if (error) setError(error);
            else onTransferred();
          }}
        >
          {({ formProps }) => (
            <form {...formProps} id="transfer-employee-form">
              <ModalHeader hasCloseButton>
                <ModalTitle>Transfer employee</ModalTitle>
              </ModalHeader>
              <ModalBody>
                {error && (
                  <MessageWrapper>
                    <ErrorMessage>{error}</ErrorMessage>
                  </MessageWrapper>
                )}
                <FormSection>
                  <Field name="effectiveFrom" label="Effective from" isRequired defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} type="date" autoFocus />}
                  </Field>
                  <Field<string, HTMLSelectElement> name="reasonCode" label="Reason" isRequired defaultValue={REASON_CODES[0]}>
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        {REASON_CODES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="departmentId" label="Department" defaultValue={current?.department_id ?? ''}>
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">— unchanged —</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="designationId" label="Designation" defaultValue={current?.designation_id ?? ''}>
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">— unchanged —</option>
                        {designations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field<string, HTMLSelectElement> name="gradeId" label="Grade" defaultValue={current?.grade_id ?? ''}>
                    {({ fieldProps }) => (
                      <SelectField fieldProps={fieldProps}>
                        <option value="">— unchanged —</option>
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.code} — {g.name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </Field>
                  <Field name="employmentType" label="Employment type" defaultValue={current?.employment_type ?? ''}>
                    {({ fieldProps }) => <TextField {...fieldProps} />}
                  </Field>
                </FormSection>
              </ModalBody>
              <ModalFooter>
                <Button appearance="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary">
                  Transfer
                </Button>
              </ModalFooter>
            </form>
          )}
        </Form>
      </Modal>
    </ModalTransition>
  );
}
