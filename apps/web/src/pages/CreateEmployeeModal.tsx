import { useState } from 'react';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { api, getDefaultLegalEntityId, ApiError } from '../api/client';
import type { Employee } from '../api/types';

interface FormData {
  legalName: string;
  personalEmail: string;
  joiningDate: string;
}

// docs/build/build-guides/01-core-hr-employee-information.md screen #3 — "a focused
// Modal ... one task per modal" per Atlaskit's own usage guidance
// (docs/hrms-prd/00-existing-system-audit.md §7).
export default function CreateEmployeeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const legalEntityId = getDefaultLegalEntityId();

  return (
    <ModalTransition>
      <Modal onClose={onClose}>
        <Form<FormData>
          onSubmit={async (data) => {
            if (!legalEntityId) {
              setError('No legal entity found for this workspace — run setup again.');
              return;
            }
            try {
              await api.post<Employee>('/api/v1/employees', {
                ...data,
                legalEntityId,
                employmentType: 'Permanent',
              });
              onCreated();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : 'Could not create employee');
            }
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
