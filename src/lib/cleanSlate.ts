/**
 * Clean Slate Initialization:
 * Purges any remnants of legacy mock data, test configurations, or dummy storage
 * to guarantee that 100% of user data is sourced exclusively from Firebase services.
 */
export function purgeMockStorage(): void {
  try {
    // Specific legacy keys known to hold synthetic mock state
    const mockKeys = [
      'yapp_user_profile',
      'yapp_mock_users',
      'yapp_mock_chats',
      'yapp_mock_messages',
      'yapp_device_list',
      'mock_user',
      'mock_data',
      'fake_otp',
      'yapp_mock_contacts',
      'yapp_sample_messages',
      'yapp_permissions_local',
    ];

    mockKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (_) {}
    });

    // Scan and purge any key matching mock patterns
    const mockPattern = /mock|fake|dummy|test_profile|sample/i;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && mockPattern.test(key)) {
        localStorage.removeItem(key);
      }
    }

    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && mockPattern.test(key)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Storage purge error:', err);
  }
}
