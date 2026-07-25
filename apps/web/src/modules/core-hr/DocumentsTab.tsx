import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/table';
import type { Document } from '../../lib/database.types';

const CATEGORIES: Document['category'][] = ['resume', 'certificate', 'id_proof', 'offer_letter', 'other'];

// Module 13 (Documents and Letters), first slice — storage + preview only, no template-driven
// letter generation (needs Module 17/23, neither built). Bucket is private
// ("employee-documents", not public); every link handed to the browser is a short-lived signed
// URL generated on demand, never a stored/cached public link — matches the RLS-first posture
// everywhere else in this app.
export default function DocumentsTab({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState<Document['category']>('resume');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const { data } = await supabase.from('documents').select('*').eq('employee_id', employeeId).order('uploaded_at', { ascending: false });
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
    const { data, error: signError } = await supabase.storage.from('employee-documents').createSignedUrl(doc.storage_path, 60);
    if (signError || !data) {
      setError(signError?.message ?? 'Could not generate a link for this document');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Documents</h3>
      <Table>
        <TableBody>
          {documents.length === 0 && (
            <TableRow>
              <TableCell>No documents yet.</TableCell>
            </TableRow>
          )}
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.file_name}</TableCell>
              <TableCell>{doc.category.replace('_', ' ')}</TableCell>
              <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="link" size="small" onClick={() => handleView(doc)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {error && <p className="mb-2 mt-2 text-sm text-text-danger">{error}</p>}

      <div className="mt-3 flex items-end gap-2">
        <div>
          <Label htmlFor="doc-category">Category</Label>
          <Select id="doc-category" value={category} onChange={(e) => setCategory(e.target.value as Document['category'])} className="w-40">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <input ref={fileInputRef} type="file" className="text-sm" />
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
