import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { listDocuments, syncGoogleDrive, uploadDocument, deleteDocument } from '@/lib/agent/actions';

export function useDocuments(clientId: string | null) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const { data, error: sbError } = await listDocuments(clientId);
      if (sbError) {
        throw new Error(sbError);
      }
      
      const { checkGoogleConnection } = await import('@/lib/agent/actions');
      const connected = await checkGoogleConnection();
      setIsConnected(connected);
      
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const sync = async () => {
    if (!clientId) return;
    try {
      setSyncing(true);
      const result = await syncGoogleDrive(clientId);
      if (!result.success) throw new Error(result.error);
      await fetchDocuments();
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  };

  const upload = async (file: File) => {
    if (!clientId) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadDocument(clientId, formData);
      if (!result.success) throw new Error(result.error);
      await fetchDocuments();
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setDeleting(id);
      const result = await deleteDocument(id);
      if (!result.success) throw new Error(result.error || 'Error unknown');
      setDocuments(prev => prev.filter(d => d.id !== id));
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  return { documents, loading, syncing, uploading, deleting, isConnected, error, refresh: fetchDocuments, sync, upload, remove };
}


