import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google OAuth 액세스 토큰을 가져오지 못했습니다. 팝업 창에서 Google 드라이브 권한을 허용해 주세요.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem('hills_drive_folder_id');
  } catch {
    // ignore
  }
};

export interface DriveUploadResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

/**
 * Gets the app-created folder from localStorage or creates a new 'Hills Blind Lab' folder.
 * Note: Under drive.file scope, searching all spaces (files.list) requires broader scopes,
 * so we create the dedicated folder using files.create (allowed by drive.file)
 * and persist its ID in localStorage.
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName = 'Hills Blind Lab'
): Promise<string | null> {
  const cachedId = localStorage.getItem('hills_drive_folder_id');

  if (cachedId) {
    try {
      // Check if previously created folder is still accessible
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,name,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const folderData = await checkRes.json();
        if (!folderData.trashed) {
          return folderData.id;
        }
      }
    } catch {
      // ignore check error and recreate
    }
  }

  // Create dedicated folder with files.create (fully supported by drive.file scope)
  try {
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const createdData = await createRes.json();
      if (createdData?.id) {
        localStorage.setItem('hills_drive_folder_id', createdData.id);
        return createdData.id;
      }
    }
  } catch (err) {
    console.warn('Could not create dedicated folder, will fallback to root My Drive:', err);
  }

  return null;
}

/**
 * Uploads a photo with standardized filename to Google Drive using multipart upload.
 * Works seamlessly with the drive.file scope.
 */
export async function uploadPhotoToGoogleDrive(
  accessToken: string,
  file: File,
  fileName: string,
  options: {
    description?: string;
    folderId?: string;
  }
): Promise<DriveUploadResult> {
  // Try to get or create target folder; if null, upload directly to My Drive root
  let targetFolderId = options.folderId;
  if (!targetFolderId) {
    targetFolderId = (await getOrCreateFolder(accessToken, 'Hills Blind Lab')) || undefined;
  }

  const doMultipartUpload = async (folderId?: string): Promise<DriveUploadResult> => {
    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: file.type || 'image/jpeg',
      description: options.description || 'Uploaded via Hills Blind Lab Uploader',
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const reader = new FileReader();
    const fileArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const metadataPart = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type || 'image/jpeg'}\r\n` +
      'Content-Transfer-Encoding: binary\r\n\r\n';

    const encoder = new TextEncoder();
    const metadataBuffer = encoder.encode(metadataPart);
    const closeBuffer = encoder.encode(closeDelimiter);

    const combinedLength = metadataBuffer.byteLength + fileArrayBuffer.byteLength + closeBuffer.byteLength;
    const combinedBuffer = new Uint8Array(combinedLength);

    combinedBuffer.set(metadataBuffer, 0);
    combinedBuffer.set(new Uint8Array(fileArrayBuffer), metadataBuffer.byteLength);
    combinedBuffer.set(closeBuffer, metadataBuffer.byteLength + fileArrayBuffer.byteLength);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: combinedBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `구글 드라이브 업로드 실패 (${uploadRes.status})`);
    }

    return uploadRes.json();
  };

  try {
    return await doMultipartUpload(targetFolderId);
  } catch (err: any) {
    // If folder upload failed due to folder access issues, retry once directly to My Drive root
    if (targetFolderId && err.message?.includes('insufficient')) {
      console.warn('Folder upload failed with scope issue, retrying upload directly to root My Drive...');
      return await doMultipartUpload(undefined);
    }
    throw err;
  }
}
