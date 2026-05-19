import admin from 'firebase-admin';

// Initialize Firebase Admin (Mock or Real)
if (process.env.FIREBASE_MOCK !== 'true') {
  // Try to initialize real Firebase Admin if credentials are provided
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin Initialized (Real)');
  } catch (error) {
    console.warn('Firebase Admin Real Initialization Failed, falling back to mock mode.', error.message);
  }
} else {
  console.log('Firebase Admin Initialized (Mock Mode)');
}

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  if (process.env.FIREBASE_MOCK === 'true' || !admin.apps.length) {
    console.log(`[MOCK PUSH NOTIFICATION] To: ${fcmToken} | Title: ${title} | Body: ${body}`);
    return { success: true, mock: true };
  }

  try {
    const payload = {
      token: fcmToken,
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard cross-platform hook
      }
    };

    const response = await admin.messaging().send(payload);
    console.log('Successfully sent message:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};
