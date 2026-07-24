import { useEffect, useRef, useState } from 'react';
import Heading from '@atlaskit/heading';
import Button from '@atlaskit/button/new';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { rowStyle, cellStyle } from '../../lib/detailStyles';
import type { Document } from '../../lib/database.types';

const CATEGORIES: Document['category'][] = ['resume', 'certificate', 'id_proof', 'offer_letter', 'other'];

// Module 13 (Documents and Letters), first slice — storage + preview only, no template-driven
// letter generation (needs Module 17/23, neither built). Bucket is private
// ("employee-documents", not public); every link handed to the browser is a short-lived signed
// URL generated on demand, never a stored/cached public link — matches the RLS-first posture
// everywhere else in this app. Preview means "let the browser render it" (PDFs/images open
// natively in a new tab) rather than an embedded viewer — genuine preview capability without
// pulling in a PDF-rendering dependency for a first slice.
export default function DocumentsTab({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState<Document['category']>('resume');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });
    setDocuments(data ?? []);
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !tenantId) return;
    setUploading(true);
    setError(null);

    const path = `${tenantId}/${employeeId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('employee-documents').upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from('documents').insert({
      tenant_id: tenantId,
      employee_id: employeeId,
      category,
      file_name: file.name,
      storage_path: path,
      content_type: file.type || null,
    });
    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    await fetchDocuments();
  };

  const handleView = async (doc: Document) => {
    const { data, error: signError } = await supabase.storage
      .from('employee-documents')
      .createSignedUrl(doc.storage_path, 60);
    if (signError || !data) {
      setError(signError?.message ?? 'Could not generate a link for this document');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <Heading size="small">Documents</Heading>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 16 }}>
        <tbody>
          {documents.length === 0 && (
            <tr>
              <td style={cellStyle}>No documents yet.</td>
            </tr>
          )}
          {documents.map((doc) => (
            <tr key={doc.id} style={rowStyle}>
              <td style={cellStyle}>{doc.file_name}</td>
              <td style={cellStyle}>{doc.category.replace('_', ' ')}</td>
              <td style={cellStyle}>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
              <td style={cellStyle}>
                <Button appearance="subtle" spacing="none" onClick={() => handleView(doc)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, fontWeight: 600, color: '#626F86' }}>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as Document['category'])}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <input ref={fileInputRef} type="file" />
        <Button onClick={handleUpload} isDisabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
