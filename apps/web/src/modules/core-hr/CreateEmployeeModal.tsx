import { useState } from 'react';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { useAuthStore } from '../auth/store';
import { useEmployeesStore } from './store';

interface FormData {
  legalName: string;
  personalEmail: string;
  joiningDate: string;
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
  const createEmployee = useEmployeesStore((s) => s.createEmployee);

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
