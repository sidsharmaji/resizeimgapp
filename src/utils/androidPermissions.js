import { Toast } from '@capacitor/toast';
import { Filesystem } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

export const requestStoragePermission = async () => {
  try {
    // For Android 13+ (SDK 33+), we need READ_MEDIA_IMAGES permission
    // For older versions, we use READ_EXTERNAL_STORAGE
    const deviceInfo = await Device.getInfo();
    const permissionName = parseInt(deviceInfo.androidSDKVersion) >= 33 ? 'photos' : 'storage';
    
    // Use the Capacitor Plugins API for permissions
    const { camera } = await Device.requestPermissions({ permissions: [permissionName] });
    
    if (camera !== 'granted') {
      await Toast.show({
        text: 'Permission is required to access and save images',
        duration: 'long',
        position: 'bottom'
      });
      return false;
    }
    
    // Check if we can write to filesystem
    try {
      await Filesystem.checkPermissions();
      return true;
    } catch (error) {
      console.error('Filesystem permission error:', error);
      return false;
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

export const checkAndRequestPermissions = async () => {
  const hasStoragePermission = await requestStoragePermission();
  return hasStoragePermission;
};