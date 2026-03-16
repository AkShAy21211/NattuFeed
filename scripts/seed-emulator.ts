
import * as admin from 'firebase-admin';

// Initialize Admin SDK for the local emulator
// The project ID must match your firebase.json / app config
if (!admin.apps.length) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  admin.initializeApp({
    projectId: 'nattufeed-d59c9'
  });
}

const db = admin.firestore();

const TEST_USERS = [
  { uid: 'test_user_1', name: 'Rahul K', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
  { uid: 'test_user_2', name: 'Anjali S', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali' },
  { uid: 'test_user_3', name: 'Sabin Das', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sabin' },
  { uid: 'test_user_4', name: 'Manoj P', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manoj' },
  { uid: 'test_user_5', name: 'Deepa V', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepa' }
];

// Coordinates centered around Kozhikode, Kerala
const BASE_LAT = 11.2588;
const BASE_LNG = 75.7804;

const seedData = async () => {
  console.log('🚀 Seeding expanded test data via Admin SDK (Bypassing Rules)...');

  try {
    // 1. Seed Users
    for (const u of TEST_USERS) {
      await db.collection('users').doc(u.uid).set({
        displayName: u.name,
        photoURL: u.photo,
        karmaTotal: Math.floor(Math.random() * 500),
        karmaWeekly: Math.floor(Math.random() * 50),
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 2. Seed General Posts (Diverse Categories)
    const generalPosts = [
      {
        id: 'post_utility_1',
        authorId: 'test_user_1',
        authorName: 'Rahul K',
        headline: 'Water Supply Restored in Civil Station Area',
        details: 'The pipe repair work is complete. Water pressure should return to normal by evening.',
        landmark: 'Civil Station',
        category: 'Utility',
        lat: BASE_LAT + 0.0012,
        lng: BASE_LNG + 0.0015,
        verifiedCount: 5,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Civil Station',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        createdAt: admin.firestore.Timestamp.fromMillis(Date.now() - 3600000)
      },
      {
        id: 'post_health_1',
        authorId: 'test_user_2',
        authorName: 'Anjali S',
        headline: 'Blood Donation Camp at Medical College',
        details: 'O+ and B+ donors needed urgently. Join us at the main auditorium.',
        landmark: 'Medical College',
        category: 'Health',
        lat: BASE_LAT - 0.0015,
        lng: BASE_LNG - 0.0018,
        verifiedCount: 12,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Medical College Area',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
        createdAt: admin.firestore.Timestamp.fromMillis(Date.now() - 7200000)
      },
      {
        id: 'post_market_1',
        authorId: 'test_user_4',
        authorName: 'Manoj P',
        headline: 'Fresh Fish Available at Central Market',
        details: 'Today\'s catch: Mackerel and Kingfish at great prices.',
        landmark: 'Central Market',
        category: 'Market',
        lat: BASE_LAT + 0.003,
        lng: BASE_LNG + 0.003,
        verifiedCount: 8,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Central Market',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manoj',
        createdAt: admin.firestore.Timestamp.now()
      },
      {
        id: 'post_services_1',
        authorId: 'test_user_5',
        authorName: 'Deepa V',
        headline: 'Electrician Available in West Hill',
        details: 'Experienced licensed electrician for all home repairs and wiring.',
        landmark: 'West Hill',
        category: 'Services',
        lat: BASE_LAT + 0.012,
        lng: BASE_LNG - 0.005,
        verifiedCount: 4,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'West Hill',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepa',
        createdAt: admin.firestore.Timestamp.now()
      },
      {
        id: 'post_alerts_1',
        authorId: 'test_user_1',
        authorName: 'Rahul K',
        headline: 'Heavy Traffic Block near Eranhipalam',
        details: 'Avoid Eranhipalam junction due to a protest. Traffic moving very slowly.',
        landmark: 'Eranhipalam',
        category: 'Alerts',
        lat: BASE_LAT + 0.008,
        lng: BASE_LNG + 0.002,
        verifiedCount: 25,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Eranhipalam',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        createdAt: admin.firestore.Timestamp.now()
      }
    ];

    for (const p of generalPosts) {
      await db.collection('posts').doc(p.id).set(p);
    }

    // 3. Seed Bus Radar Posts
    const now = Date.now();
    const busPosts = [
      {
        id: 'bus_1',
        authorId: 'test_user_3',
        authorName: 'Sabin Das',
        headline: 'KSRTC Fast Passenger: Mananthavady',
        landmark: 'Mofussil Stand',
        details: 'to_village',
        type: 'bus_spott',
        category: 'Traffic',
        lat: BASE_LAT + 0.0024,
        lng: BASE_LNG + 0.0028,
        verifiedCount: 6,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Mofussil',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sabin',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromMillis(now + 18 * 60000)
      },
      {
        id: 'bus_2',
        authorId: 'test_user_1',
        authorName: 'Rahul K',
        headline: 'Private Bus: Elathur - Thondayad',
        landmark: 'Palayam',
        details: 'to_city',
        type: 'bus_spott',
        category: 'Traffic',
        lat: BASE_LAT + 0.0051,
        lng: BASE_LNG - 0.0032,
        verifiedCount: 1,
        flagCount: 0,
        isHidden: false,
        isBusinessPost: false,
        district: 'Kozhikode',
        localBody: 'Kozhikode Corporation',
        ward: 'Palayam',
        authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromMillis(now + 4 * 60000)
      }
    ];

    for (const b of busPosts) {
      await db.collection('posts').doc(b.id).set(b);
    }

    console.log('✅ Expanded Seed Complete via Admin SDK!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
