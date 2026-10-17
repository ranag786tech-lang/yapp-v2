/**
 * ============================================================================
 * ENGINE 5: DEVICE PERMISSION LAYER (SECP & Privacy Compliant)
 * ============================================================================
 * 
 * Strict Privacy & Web API Device Permission Manager for "Yapp It".
 * 
 * Compliance & Privacy Standards:
 * - Explicit User Consent: Invoked exclusively upon direct user action (e.g. calling, toggling alerts).
 * - SECP & Zero-Surveillance Compliance:
 *    * STRICTLY ZERO background contact scraping / phonebook harvesting.
 *    * STRICTLY ZERO root/local filesystem scanning or arbitrary directory access.
 *    * Minimal Scope: Only camera & microphone during active calls, and browser notifications for incoming messages.
 * - Strictly typed: Zero 'any' types.
 */

export type HardwarePermissionType = 'camera' | 'microphone';
export type AppPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface MediaPermissionResult {
  granted: boolean;
  state: AppPermissionState;
  stream?: MediaStream;
  errorMessage?: string;
}

export interface NotificationPermissionResult {
  granted: boolean;
  state: NotificationPermission | 'unsupported';
  errorMessage?: string;
}

/**
 * Check if the browser runtime supports the MediaDevices Web API.
 */
export function isMediaDevicesSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

/**
 * Check if the browser runtime supports the Notifications Web API.
 */
export function isNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Query permission status using the Permissions API if supported by the browser.
 */
export async function queryPermissionStatus(
  name: HardwarePermissionType | 'notifications'
): Promise<AppPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }

  try {
    // Note: TypeScript's PermissionDescriptor name allows 'camera' | 'microphone' in modern DOM lib
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });
    return status.state as AppPermissionState;
  } catch {
    // If querying specific hardware name is rejected by browser, return 'prompt'
    return 'prompt';
  }
}

/**
 * Request Camera and/or Microphone permission via navigator.mediaDevices.getUserMedia.
 * 
 * @param constraints Desired audio and video constraints
 * @param keepStreamIfGranted If true, returns the active MediaStream for immediate calling.
 *                            If false, releases hardware tracks immediately after consent check.
 */
export async function requestMediaPermissions(
  constraints: { audio: boolean; video: boolean } = { audio: true, video: true },
  keepStreamIfGranted = true
): Promise<MediaPermissionResult> {
  if (!isMediaDevicesSupported()) {
    return {
      granted: false,
      state: 'unsupported',
      errorMessage: 'Audio and Video hardware access is not supported by your current browser.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: constraints.audio,
      video: constraints.video,
    });

    if (!keepStreamIfGranted) {
      // Clean up hardware tracks immediately if we only needed to verify permission
      stream.getTracks().forEach((track) => track.stop());
      return {
        granted: true,
        state: 'granted',
      };
    }

    return {
      granted: true,
      state: 'granted',
      stream,
    };
  } catch (err: unknown) {
    const error = err as Error & { name?: string };
    let state: AppPermissionState = 'denied';
    let errorMessage = 'Media device permission was denied.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      state = 'denied';
      errorMessage = 'Permission to access microphone or camera was denied by user or browser policy.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      state = 'unsupported';
      errorMessage = 'No camera or microphone hardware found on this device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      state = 'denied';
      errorMessage = 'Hardware device is currently in use by another application.';
    }

    return {
      granted: false,
      state,
      errorMessage,
    };
  }
}

/**
 * Request Web Push / Desktop Notification permissions.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  if (!isNotificationsSupported()) {
    return {
      granted: false,
      state: 'unsupported',
      errorMessage: 'Push notifications are not supported in this browser.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      state: permission,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      granted: false,
      state: 'denied',
      errorMessage: error.message || 'Failed to request notification permission.',
    };
  }
}

/**
 * Safely trigger a local notification for incoming messages when app is in background.
 */
export function showIncomingMessageNotification(
  senderName: string,
  messagePreview: string,
  iconUrl?: string,
  onClickHandler?: () => void
): void {
  if (!isNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }

  // Only trigger desktop alert if the document does not have active focus
  if (typeof document !== 'undefined' && document.hasFocus && document.hasFocus()) {
    return;
  }

  try {
    const notification = new Notification(`New message from ${senderName}`, {
      body: messagePreview,
      icon: iconUrl || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `yapp_msg_${senderName}`,
      silent: false,
    });

    if (onClickHandler) {
      notification.onclick = () => {
        window.focus();
        onClickHandler();
        notification.close();
      };
    }
  } catch (e) {
    console.warn('[PermissionsEngine] Could not dispatch notification:', e);
  }
}
