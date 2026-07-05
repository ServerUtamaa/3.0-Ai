
/**
 * Device Identification Service
 * Generates and persists a unique identifier for the browser/device.
 */

const DEVICE_ID_KEY = 'VINZX_DEVICE_FINGERPRINT';

/**
 * Generates a simple fingerprint based on browser properties.
 * In a real app, you'd use a library like FingerprintJS.
 */
const generateFingerprint = (): string => {
  const nav = window.navigator as any;
  const screen_info = window.screen;
  
  let uid = '';
  uid += nav.userAgent || '';
  uid += nav.language || '';
  uid += nav.hardwareConcurrency ? nav.hardwareConcurrency.toString() : '';
  uid += nav.deviceMemory ? nav.deviceMemory.toString() : '';
  uid += nav.platform || '';
  uid += screen_info.colorDepth ? screen_info.colorDepth.toString() : '';
  uid += screen_info.width ? screen_info.width.toString() : '';
  uid += screen_info.height ? screen_info.height.toString() : '';
  uid += Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Deterministic, no random!
  return 'VINZX-HW-' + Math.abs(hash).toString(16).toUpperCase();
};

/**
 * Gets the device ID from storage or generates a new one.
 */
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Try to get from cookie as fallback
    const cookies = document.cookie.split(';');
    const deviceCookie = cookies.find(c => c.trim().startsWith(DEVICE_ID_KEY + '='));
    if (deviceCookie) {
      deviceId = deviceCookie.split('=')[1];
    }
  }

  if (!deviceId) {
    deviceId = generateFingerprint();
    // Save to multiple places for persistence
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    // Set cookie for 10 years
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${DEVICE_ID_KEY}=${deviceId};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  return deviceId;
};
