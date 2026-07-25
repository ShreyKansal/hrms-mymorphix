import { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Card, CardFooter } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import type { Document } from '../../lib/database.types';

const CATEGORIES: Document['category'][] = ['resume', 'certificate', 'id_proof', 'offer_letter', 'other'];

// A file input styled to match the other form controls.
const fileInputClass =
  'focus-ring flex h-[34px] w-full min-w-[12rem] rounded-md border border-control bg-foreground/[0.026] text-sm text-foreground-light ' +
  'file:mr-3 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-control file:bg-surface-200 file:px-3 file:text-xs file:font-medium file:text-foreground';

// Module 13 (Documents and Letters), first slice — storage + preview only. Bucket is private;
// every link handed to the browser is a short-lived signed URL generated on demand.
export default function DocumentsTab({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState<Document['category']>('resume');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
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
    setFileName('');
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
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>File</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-8 text-center">
                <FileText className="mx-auto mb-2 h-6 w-6 text-foreground-muted" strokeWidth={1.5} />
                <p className="text-sm text-foreground">No documents yet</p>
                <p className="mt-0.5 text-sm text-foreground-lighter">Upload a resume, certificate, or ID proof below.</p>
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-foreground-lighter" />
                    {doc.file_name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {doc.category.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="small" onClick={() => handleView(doc)}>
                    View
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Upload failed">
            {error}
          </Alert>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="doc-category">Category</Label>
            <Select id="doc-category" value={category} onChange={(e) => setCategory(e.target.value as Document['category'])} className="w-40">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="doc-file">File</Label>
            <input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
              className={fileInputClass}
            />
          </div>
          <Button onClick={handleUpload} variant="primary" loading={uploading} disabled={uploading || !fileName}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
