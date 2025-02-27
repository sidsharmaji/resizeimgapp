import { openDB } from 'idb';

const DB_NAME = 'imageToolsDB';
const STORE_NAME = 'processedImages';
const DB_VERSION = 1;
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'metadata.timestamp');
        store.createIndex('fileName', 'metadata.fileName');
      }
    },
  });
};

const calculateStorageUsage = async () => {
  try {
    const db = await initDB();
    const items = await db.getAll(STORE_NAME);
    return items.reduce((total, item) => {
      const size = new Blob([item.data]).size;
      return total + size;
    }, 0);
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
};

const cleanupOldEntries = async (requiredSpace) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const items = await store.index('timestamp').getAll();
    
    items.sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));
    
    let freedSpace = 0;
    for (const item of items) {
      if (freedSpace >= requiredSpace) break;
      const size = new Blob([item.data]).size;
      await store.delete(item.id);
      freedSpace += size;
    }
    
    await tx.done;
    return freedSpace;
  } catch (error) {
    console.error('Error cleaning up old entries:', error);
    return 0;
  }
};

export const saveProcessedImage = async (imageData, metadata) => {
  try {
    const db = await initDB();
    const imageSize = new Blob([imageData]).size;
    const currentUsage = await calculateStorageUsage();
    
    if (currentUsage + imageSize > MAX_STORAGE_SIZE) {
      const spaceNeeded = currentUsage + imageSize - MAX_STORAGE_SIZE;
      const freedSpace = await cleanupOldEntries(spaceNeeded);
      if (freedSpace < spaceNeeded) {
        throw new Error('Storage quota exceeded. Please delete some images.');
      }
    }

    const timestamp = new Date().toISOString();
    const entry = {
      data: imageData,
      metadata: {
        ...metadata,
        timestamp,
        processedOffline: !navigator.onLine,
        size: imageSize,
        lastAccessed: timestamp
      }
    };
    
    await db.add(STORE_NAME, entry);
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

export const getProcessedImages = async () => {
  try {
    const db = await initDB();
    const items = await db.getAll(STORE_NAME);
    return items.map(item => ({
      ...item,
      metadata: {
        ...item.metadata,
        lastAccessed: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Error retrieving from IndexedDB:', error);
    throw error;
  }
};

export const deleteProcessedImage = async (id) => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
    return true;
  } catch (error) {
    console.error('Error deleting from IndexedDB:', error);
    throw error;
  }
};

export const clearProcessedImages = async () => {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
    return true;
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
    throw error;
  }
};

export const getStorageStats = async () => {
  try {
    const currentUsage = await calculateStorageUsage();
    return {
      used: currentUsage,
      total: MAX_STORAGE_SIZE,
      available: MAX_STORAGE_SIZE - currentUsage
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
};

export const isOfflineStorageAvailable = async () => {
  try {
    const db = await initDB();
    return !!db;
  } catch {
    return false;
  }
};