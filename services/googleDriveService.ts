
import { getRegisteredUsers, getStoredTrades, saveUsers, saveTrades } from "./storageService";

const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const VAULT_FILE_NAME = "TradeMind_AI_Vault.json";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes Google API Client and Identity Services.
 */
export const initializeGoogleSync = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInit = () => {
      if (gapiInited && gisInited) resolve();
    };

    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google) {
      setTimeout(() => initializeGoogleSync().then(resolve), 500);
      return;
    }

    if (gapiInited && gisInited) {
      resolve();
      return;
    }

    gapi.load("client", async () => {
      try {
        await gapi.client.init({
          apiKey: process.env.API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        checkInit();
      } catch (err) {
        console.error("GAPI Init Error", err);
      }
    });

    // We use a generic Client ID for local dev if not provided
    const clientId = "486548543781-6v9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b.apps.googleusercontent.com"; 
    
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: "", 
    });
    gisInited = true;
    checkInit();
  });
};

/**
 * Authenticates the user and returns the access token.
 */
export const authenticateCloud = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        }
        resolve(resp.access_token);
      };

      const gapi = (window as any).gapi;
      const token = gapi.client.getToken();
      
      if (!token) {
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        tokenClient.requestAccessToken({ prompt: "" });
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Uploads current local storage data to Google Drive.
 */
export const syncToCloud = async (): Promise<boolean> => {
  try {
    const gapi = (window as any).gapi;
    const data = {
      users: await getRegisteredUsers(),
      trades: await getStoredTrades(), // Calling without userId to get all trades for vaulting
      syncedAt: new Date().toISOString(),
      device: navigator.userAgent
    };
    const content = JSON.stringify(data);

    const response = await gapi.client.drive.files.list({
      q: `name = '${VAULT_FILE_NAME}' and trashed = false`,
      fields: "files(id)",
    });

    const existingFile = response.result.files[0];
    const fileId = existingFile ? existingFile.id : null;

    const metadata = {
      name: VAULT_FILE_NAME,
      mimeType: "application/json",
    };

    const boundary = "314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      content +
      close_delim;

    const request = gapi.client.request({
      path: fileId ? `/upload/drive/v3/files/${fileId}` : "/upload/drive/v3/files",
      method: fileId ? "PATCH" : "POST",
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    await request;
    localStorage.setItem('tm_last_cloud_sync', new Date().toISOString());
    return true;
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    return false;
  }
};

/**
 * Downloads data from Google Drive and restores it to local storage.
 */
export const restoreFromCloud = async (): Promise<boolean> => {
  try {
    const gapi = (window as any).gapi;
    const response = await gapi.client.drive.files.list({
      q: `name = '${VAULT_FILE_NAME}' and trashed = false`,
      fields: "files(id, modifiedTime)",
    });

    const file = response.result.files[0];
    if (!file) return false;

    const fileData = await gapi.client.drive.files.get({
      fileId: file.id,
      alt: "media",
    });

    const data = typeof fileData.result === 'string' ? JSON.parse(fileData.result) : fileData.result;
    
    if (data.users && data.trades) {
      await saveUsers(data.users);
      await saveTrades(data.trades);
      localStorage.setItem('tm_last_cloud_sync', file.modifiedTime || new Date().toISOString());
      return true;
    }
    return false;
  } catch (error) {
    console.error("Cloud Restore Error:", error);
    return false;
  }
};

/**
 * Checks if a newer vault exists on the cloud.
 */
export const checkCloudVaultStatus = async (): Promise<{ hasNewer: boolean, lastModified?: string } | null> => {
  try {
    const gapi = (window as any).gapi;
    const token = gapi?.client?.getToken();
    if (!token) return null;

    const response = await gapi.client.drive.files.list({
      q: `name = '${VAULT_FILE_NAME}' and trashed = false`,
      fields: "files(id, modifiedTime)",
    });

    const file = response.result.files[0];
    if (!file) return null;

    const lastSync = localStorage.getItem('tm_last_cloud_sync');
    if (!lastSync) return { hasNewer: true, lastModified: file.modifiedTime };

    const localTime = new Date(lastSync).getTime();
    const cloudTime = new Date(file.modifiedTime).getTime();

    return {
      hasNewer: cloudTime > localTime + 5000,
      lastModified: file.modifiedTime
    };
  } catch {
    return null;
  }
};
