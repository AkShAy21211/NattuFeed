
import * as admin from 'firebase-admin';

// Initialize Admin SDK
// NOTE: To seed live database, you need a service account key or GOOGLE_APPLICATION_CREDENTIALS
// This script defaults to the emulator if NO service account is provided.
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🌍 Seeding LIVE Firebase Database...");
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    admin.initializeApp({
      projectId: 'nattufeed-d59c9' // Match your project ID
    });
    console.log("🔥 Seeding LOCAL Emulator Database...");
  }
}

const db = admin.firestore();

const ANCHORS = [
  {
    name: "Thavakkara New Bus Stand",
    location: new admin.firestore.GeoPoint(11.8674, 75.3706),
    verified: true,
    routes: ["Kozhikode Superfast", "Kasaragod FP", "Iritty Limited", "Taliparamba Fast"],
    verifiedCount: 100
  },
  {
    name: "Kannur Old Bus Stand",
    location: new admin.firestore.GeoPoint(11.8763, 75.3662),
    verified: true,
    routes: ["City Bus", "Payyambalam-Beach", "Stadium-Circular"],
    verifiedCount: 85
  },
  {
    name: "Kannur KSRTC Bus Stand",
    location: new admin.firestore.GeoPoint(11.8755, 75.3745),
    verified: true,
    routes: ["KSRTC Low Floor", "Pampa Special", "Bangalore Multi-Axle"],
    verifiedCount: 92
  },
  {
    name: "Vankulathvayal Junction",
    location: new admin.firestore.GeoPoint(11.9213, 75.3337),
    verified: true,
    routes: ["Kannur-Azhikode", "City-Challad", "Mele Chovva"],
    verifiedCount: 45
  },
  {
    name: "Azhikode High School Stop",
    location: new admin.firestore.GeoPoint(11.9282, 75.3284),
    verified: true,
    routes: ["Vankulathvayal-Kannur", "Azhikkal-City"],
    verifiedCount: 30
  },
  {
    name: "Kozhikode KSRTC Terminal",
    location: new admin.firestore.GeoPoint(11.2592, 75.7828),
    verified: true,
    routes: ["TVM Superfast", "Kochi Volvo", "Kannur Fast"],
    verifiedCount: 120
  },
  {
    name: "Vytilla Mobility Hub",
    location: new admin.firestore.GeoPoint(9.9693, 76.3212),
    verified: true,
    routes: ["Metro Feeder", "Alappuzha Fast", "Airport Bus"],
    verifiedCount: 200
  }
];

const seedAnchors = async () => {
  console.log('🚀 Starting Anchor Seeding...');

  try {
    const batch = db.batch();
    const collectionRef = db.collection('bus_anchors');

    for (const anchor of ANCHORS) {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        ...anchor,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    // Now seed some actual posts in Kannur so the feed isn't empty
    console.log('📝 Seeding some live updates for Kannur...');
    const postsRef = db.collection('posts');
    const kannurPosts = [
        {
            authorId: "test_user_1",
            authorName: "Arjun K",
            headline: "Heavy Rain in Thavakkara",
            details: "Stay safe, roads are slippery near the stand.",
            landmark: "Thavakkara",
            category: "Alerts",
            type: "general",
            lat: 11.8674, lng: 75.3706,
            district: "Kannur",
            verifiedCount: 5,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isHidden: false
        },
        {
            authorId: "test_user_2",
            authorName: "Saritha V",
            headline: "KSRTC to Kozhikode started",
            landmark: "Kannur KSRTC",
            category: "Traffic",
            type: "bus_spott",
            lat: 11.8755, lng: 75.3745,
            district: "Kannur",
            verifiedCount: 12,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 15 * 60000),
            isHidden: false
        }
    ];

    for (const post of kannurPosts) {
        await postsRef.add(post);
    }

    console.log(`✅ Success! Seeded ${ANCHORS.length} anchors and ${kannurPosts.length} posts.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAnchors();
