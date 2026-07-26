const DB_NAME = "UWW_DocumentStorage";
const DB_VERSION = 1;
const STORE_NAME = "documents";

export interface StoredDocument {
  id: string;
  blob: Blob;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject("Failed to open database");
    
    request.onsuccess = (e: any) => {
      resolve(e.target.result);
    };
    
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const saveDocumentBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, blob });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to save document blob");
  });
};

export const getDocumentBlob = async (id: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = (e: any) => {
      const result = e.target.result;
      if (result && result.blob) {
        resolve(result.blob);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject("Failed to get document blob");
  });
};

export const deleteDocumentBlob = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to delete document blob");
  });
};
