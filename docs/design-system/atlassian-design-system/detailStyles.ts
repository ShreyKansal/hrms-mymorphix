// Shared style constants for the "small embedded list within a page" pattern (see
// docs/build/03-ui-patterns.md §1) — was duplicated identically across five files
// (ProfileTab, EmploymentTab, DocumentsTab, OrgManagement, Team). Not yet drifted when this
// was written, but five copies of the same object is exactly how drift starts; one shared
// source fixes that outright instead of just documenting the risk.
export const labelStyle = { color: '#626F86', fontSize: 12, fontWeight: 600, marginTop: 12 };
export const valueStyle = { margin: '2px 0 0' };
export const rowStyle = { borderBottom: '1px solid #DCDFE4' };
export const cellStyle = { padding: 8 };
