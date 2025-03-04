import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveProcessedImage } from './offlineStorage';
import { Toast } from '@capacitor/toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export const downloadFileOnMobile = async (fileUrl, fileName, metadata = {}) => {
  try {
    // Check network connectivity
    if (!navigator.onLine) {
      await Toast.show({ text: 'No internet connection. Saving for offline use.' });
      return await handleOfflineDownload(fileUrl, fileName, metadata);
    }

    // Start download with progress tracking
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    const blob = await response.blob();
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Convert blob to base64
    const base64Data = await blobToBase64(blob);

    // Save file to device's gallery
    const savedFile = await Filesystem.writeFile({
      path: `Pictures/${fileName}`,
      data: base64Data,
      directory: Directory.ExternalStorage,
      recursive: true
    });

    // Save to offline storage for backup
    await saveProcessedImage(base64Data, {
      fileName,
      uri: savedFile.uri,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    await Toast.show({ text: 'File downloaded successfully!' });
    return savedFile.uri;
  } catch (error) {
    console.error('Error downloading file:', error);
    let errorMessage = 'Failed to save file. Please try again.';

    if (error.message === 'File size exceeds 10MB limit') {
      errorMessage = 'The file is too large. Please try a smaller file (max 10MB).';
    } else if (error.message.includes('Permission')) {
      errorMessage = 'Storage permission denied. Please grant permission to save files.';
      // Try offline storage if permission denied
      if (!navigator.onLine) {
        return await handleOfflineDownload(fileUrl, fileName, metadata);
      }
    } else if (error.message.includes('HTTP error')) {
      errorMessage = 'Failed to download file. Please check your internet connection.';
    }

    await Toast.show({ text: errorMessage });
    throw new Error(errorMessage);
  }
};

const handleOfflineDownload = async (fileUrl, fileName, metadata) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob);

    const saved = await saveProcessedImage(base64Data, {
      fileName,
      ...metadata,
      pendingDownload: true,
      timestamp: new Date().toISOString()
    });

    if (saved) {
      return 'Saved offline. Will download when back online.';
    }
    throw new Error('Failed to save offline');
  } catch (error) {
    console.error('Error saving offline:', error);
    throw new Error('Failed to save file offline. Please try again.');
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};