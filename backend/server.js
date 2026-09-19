const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Druk Notifier API is up and running!');
});

// Initialize Firebase Admin for FCM Push Notifications
// Add your Firebase Service Account JSON string in environment variable: FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", err);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT missing. Running push notifications in dry-run mode.");
}

// 1. Endpoint: Subscribe device token to specific topics (e.g., 'travel', 'thimphu', 'education')
app.post('/api/v1/subscribe', async (req, res) => {
  const { token, topic } = req.body;

  if (!token || !topic) {
    return res.status(400).json({ error: 'Device token and target topic are required.' });
  }

  try {
    if (admin.apps.length > 0) {
      await admin.messaging().subscribeToTopic(token, topic.toLowerCase());
      return res.status(200).json({ success: true, message: `Subscribed to ${topic}` });
    }
    res.status(200).json({ success: true, message: `Mock mode: Subscribed to ${topic}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint: Trigger Push Notification to users
app.post('/api/v1/notify', async (req, res) => {
  const { title, body, category, dzongkhag, isUrgent } = req.body;

  const targetTopic = category ? category.toLowerCase() : 'all';

  const payload = {
    notification: {
      title: title || 'Druk Notifier Alert',
      body: body || 'A new public notice has been issued.',
    },
    data: {
      category: category || 'General',
      dzongkhag: dzongkhag || 'National',
      isUrgent: String(isUrgent || false),
    },
    topic: targetTopic,
  };

  try {
    if (admin.apps.length > 0) {
      const response = await admin.messaging().send(payload);
      return res.status(200).json({ success: true, messageId: response });
    }
    res.status(200).json({ success: true, mockMode: true, sentPayload: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint: Feed API for mobile client app
const announcements = [
  {
    id: 'moit-2026-001',
    agency: 'Ministry of Infrastructure and Transport',
    category: 'Travel',
    dzongkhag: 'Thimphu',
    title_en: 'Road Block Alert: Phuentsholing-Thimphu Highway',
    title_dz: 'ཕུན་ཚོགས་གླིང་-ཐིམ་ཕུག་གཞུང་ལམ་བཀག་ཆད་གསལ་བསྒྲགས།',
    content_en: 'Landslide cleared near Sorchen. One-way traffic restored.',
    content_dz: 'སོར་ཅན་གྱི་ཉེ་སར་ས་རུད་བསལ་ཡོད། ལམ་ཕྱོགས་གཅིག་གི་སྐྱེལ་འདྲེན་སླར་གསོ་བྱས་ཡོད།',
    is_urgent: true,
    published_at: new Date().toISOString()
  }
];

app.get('/api/v1/feed', (req, res) => {
  res.status(200).json({ status: 'success', data: announcements });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Druk Notifier Server running on port ${PORT}`);
});
