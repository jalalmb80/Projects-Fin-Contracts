export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

export function initGoogleDrive(): void {
  if (!window.google) {
    console.warn('Google Identity Services not loaded');
    return;
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: () => {},
  });
}

export function requestDriveAccess(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Drive not initialized'));
      return;
    }
    
    // Re-initialize to update the callback
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });
    
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function isConnected(): boolean {
  return !!accessToken;
}

export function disconnect(): void {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
  }
}

async function findOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<string> {
  const query = parentId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;

  const metadata: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  const folder = await createRes.json();
  return folder.id;
}

export async function uploadPdfToDrive(
  pdfBlob: Blob,
  fileName: string,
  entityName: string,
  clientName?: string
): Promise<DriveUploadResult> {
  if (!accessToken) throw new Error('Not authenticated');

  // Create folder structure: عقود دراية / EntityName / ClientName (optional)
  const rootFolderId = await findOrCreateFolder('عقود دراية');
  const entityFolderId = await findOrCreateFolder(entityName, rootFolderId);
  const targetFolderId = clientName
    ? await findOrCreateFolder(clientName, entityFolderId)
    : entityFolderId;

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: [targetFolderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', pdfBlob, fileName);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Upload failed');
  }

  const file = await res.json();
  return {
    fileId: file.id,
    fileName: file.name,
    webViewLink: file.webViewLink,
  };
}
