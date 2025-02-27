import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveProcessedImage } from './offlineStorage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export const downloadFileOnMobile = async (fileUrl, fileName, metadata = {}) => {
  try {
    // Fetch the file data
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');    
    }

    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });

    // Save file to device's gallery
    const savedFile = await Filesystem.writeFile({
      path: `Pictures/${fileName}`,
      data: base64Data,
      directory: Directory.ExternalStorage,
      recursive: true
    });

    // Save to offline storage for backup and offline access
    await saveProcessedImage(base64Data, {
      fileName,
      uri: savedFile.uri,
      ...metadata
    });

    return savedFile.uri;
  } catch (error) {
    console.error('Error downloading file:', error);
    if (error.message === 'File size exceeds 10MB limit') {
      throw new Error('The file is too large. Please try a smaller file (max 10MB).');
    } else if (error.message.includes('Permission')) {
      // If offline and permission denied, try saving to IndexedDB only
      if (!navigator.onLine) {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Data = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });

        const saved = await saveProcessedImage(base64Data, {
          fileName,
          ...metadata,
          pendingDownload: true
        });

        if (saved) {
          return 'Saved offline. Will download when permission is granted.';
        }
      }
      throw new Error('Storage permission denied. Please grant permission to save files.');
    } else {
      throw new Error('Failed to save file. Please try again.');
    }
  }
};