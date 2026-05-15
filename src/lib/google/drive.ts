import { google } from 'googleapis';
import { getAuthorizedCalendar } from '@/lib/google'; // This helper already gets authorized client
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import { Readable } from 'stream';

/**
 * Returns a Google Drive client using the stored refresh tokens.
 */
export async function getAuthorizedDrive() {
  // Reuse the same logic from calendar to get authorized credentials
  // The calendar helper already sets the credentials on the singleton oauth2Client
  await getAuthorizedCalendar();
  
  // We need to re-import or use the global oauth2Client from @/lib/google.ts
  // Since @/lib/google.ts exports the client, we can use it.
  const { google: googleApi } = await import('googleapis');
  const { oauth2Client } = await import('@/lib/google');
  
  return googleApi.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Ensures a client has a dedicated folder in Google Drive.
 */
export async function ensureClientFolder(clientId: string, clientName: string) {
  const drive = await getAuthorizedDrive();
  const supabase = createSupabaseClientForUser('system');

  // 1. Check if folder already exists in DB
  const { data: client } = await supabase
    .from('clients')
    .select('google_drive_folder_id')
    .eq('id', clientId)
    .single();

  if (client?.google_drive_folder_id) {
    return client.google_drive_folder_id;
  }

  // 2. Search in Drive just in case
  const folderName = `ELITOR.IA CRM - ${clientName}`;
  const search = await drive.files.list({
    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  });

  if (search.data.files && search.data.files.length > 0) {
    const folderId = search.data.files[0].id!;
    await supabase.from('clients').update({ google_drive_folder_id: folderId }).eq('id', clientId);
    return folderId;
  }

  // 3. Create new folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  const newFolderId = folder.data.id!;
  await supabase.from('clients').update({ google_drive_folder_id: newFolderId }).eq('id', clientId);
  
  return newFolderId;
}

/**
 * Syncs files from a Google Drive folder to the CRM documents table.
 */
export async function syncFolderFiles(clientId: string) {
  const drive = await getAuthorizedDrive();
  const supabase = createSupabaseClientForUser('system');

  const { data: client } = await supabase
    .from('clients')
    .select('google_drive_folder_id, first_name, last_name')
    .eq('id', clientId)
    .single();

  if (!client) return { error: 'Client not found' };

  const folderId = client.google_drive_folder_id || await ensureClientFolder(clientId, `${client.first_name} ${client.last_name || ''}`);

  // List files in folder
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, createdTime)',
  });

  const driveFiles = response.data.files || [];

  // Upsert into Supabase documents table
  for (const file of driveFiles) {
    const docData = {
      client_id: clientId,
      name: file.name,
      type: null,
      status: null,
      google_drive_id: file.id,
      google_drive_link: file.webViewLink,
      storage_path: `google_drive://${file.id}`,
    };

    const { error: upsertError } = await supabase
      .from('documents')
      .upsert(docData, { onConflict: 'google_drive_id' });

    if (upsertError) {
      console.error('Error upserting document:', upsertError);
    }
  }

  return { count: driveFiles.length };
}

const TEAM_EMAILS = ['yuriescu78@gmail.com', 'lutisco@gmail.com'];

async function shareFileWithTeam(drive: any, fileId: string) {
  for (const email of TEAM_EMAILS) {
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'writer', type: 'user', emailAddress: email },
        sendNotificationEmail: false,
      });
    } catch (err: any) {
      console.error(`Error sharing ${fileId} with ${email}:`, err?.message);
    }
  }
}

/**
 * Deletes a file from Google Drive by its file ID.
 */
export async function deleteFileFromDrive(googleDriveId: string): Promise<void> {
  const drive = await getAuthorizedDrive();
  await drive.files.delete({ fileId: googleDriveId });
}

/**
 * Uploads a file to a client's Google Drive folder.
 */
export async function uploadFileToDrive(clientId: string, fileData: { name: string, mimeType: string, body: Buffer }) {
  // Validate OAuth before attempting upload — gives a clear error if token is revoked
  const { oauth2Client } = await import('@/lib/google');
  try {
    await oauth2Client.getAccessToken();
  } catch (authErr: any) {
    const desc = authErr?.response?.data?.error_description || authErr?.response?.data?.error || authErr.message;
    throw new Error(`Google OAuth inválido: ${desc}. Ve a Ajustes → Google y vuelve a conectar la cuenta.`);
  }

  const drive = await getAuthorizedDrive();
  const supabase = createSupabaseClientForUser('system');

  const { data: client } = await supabase
    .from('clients')
    .select('google_drive_folder_id, first_name, last_name')
    .eq('id', clientId)
    .single();

  if (!client) throw new Error('Client not found');

  const folderId = client.google_drive_folder_id || await ensureClientFolder(clientId, `${client.first_name} ${client.last_name || ''}`);

  const mimeType = fileData.mimeType || 'application/octet-stream';

  const response = await drive.files.create({
    requestBody: {
      name: fileData.name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from([fileData.body]),
    },
    fields: 'id, name, webViewLink, mimeType',
  });

  const newFile = response.data;

  await shareFileWithTeam(drive, newFile.id!);

  // Insert into Supabase documents table
  const docData = {
    client_id: clientId,
    name: newFile.name,
    type: null,
    status: null,
    google_drive_id: newFile.id,
    google_drive_link: newFile.webViewLink,
    storage_path: `google_drive://${newFile.id}`,
  };

  await supabase.from('documents').insert(docData);

  return JSON.parse(JSON.stringify(newFile));
}

