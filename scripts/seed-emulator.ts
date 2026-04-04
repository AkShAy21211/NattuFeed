
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
  // ── Kozhikode Users ──
  { uid: 'test_user_1', name: 'Rahul K', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
  { uid: 'test_user_2', name: 'Anjali S', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali' },
  { uid: 'test_user_3', name: 'Sabin Das', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sabin' },
  { uid: 'test_user_4', name: 'Manoj P', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manoj' },
  { uid: 'test_user_5', name: 'Deepa V', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepa' },
  // ── Kannur Users ──
  { uid: 'knr_user_1', name: 'Akhil M', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Akhil' },
  { uid: 'knr_user_2', name: 'Sreelakshmi R', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sreelakshmi' },
  { uid: 'knr_user_3', name: 'Vineeth Kumar', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vineeth' },
  { uid: 'knr_user_4', name: 'Fathima N', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fathima' },
  { uid: 'knr_user_5', name: 'Suresh Babu', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh' },
  { uid: 'knr_user_6', name: 'Priya Menon', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { uid: 'knr_user_7', name: 'Nishanth T', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nishanth' },
  { uid: 'knr_user_8', name: 'Divya Krishnan', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya' },
];

// ── Kannur user → location mapping ──
const KANNUR_USER_PROFILES: Record<string, { district: string; localBody: string; ward?: string }> = {
  knr_user_1: { district: 'Kannur', localBody: 'Kannur', ward: 'Fort Area' },
  knr_user_2: { district: 'Kannur', localBody: 'Thalassery Municipality', ward: 'Thalassery Town' },
  knr_user_3: { district: 'Kannur', localBody: 'Payyannur Municipality', ward: 'Payyannur Central' },
  knr_user_4: { district: 'Kannur', localBody: 'Thaliparambu Municipality', ward: 'Taliparamba Town' },
  knr_user_5: { district: 'Kannur', localBody: 'Iritty Municipality', ward: 'Iritty Town' },
  knr_user_6: { district: 'Kannur', localBody: 'Mattannur Municipality', ward: 'Mattannur Town' },
  knr_user_7: { district: 'Kannur', localBody: 'Panoor Municipality', ward: 'Panoor Junction' },
  knr_user_8: { district: 'Kannur', localBody: 'Koothuparamba Municipality', ward: 'Koothuparamba Town' },
};

// Coordinates centered around Kozhikode, Kerala
const BASE_LAT = 11.2588;
const BASE_LNG = 75.7804;

// ── Kannur area coordinates (real approximate centers) ──
const KANNUR_COORDS = {
  kannurCity: { lat: 11.8745, lng: 75.3704 },   // Kannur Corporation
  thalassery: { lat: 11.7480, lng: 75.4890 },   // Thalassery
  payyannur: { lat: 12.1050, lng: 75.2050 },   // Payyannur
  taliparamba: { lat: 12.0370, lng: 75.3600 },   // Taliparamba
  iritty: { lat: 11.8460, lng: 75.6390 },   // Iritty
  mattannur: { lat: 11.9300, lng: 75.5730 },   // Mattannur
  panoor: { lat: 11.8050, lng: 75.5400 },   // Panoor
  koothuparamba: { lat: 11.8650, lng: 75.5500 },   // Koothuparamba
};

const seedData = async () => {
  console.log('🚀 Seeding expanded test data via Admin SDK (Bypassing Rules)...');

  try {
    // ═══════════════════════════════════════════════════
    // 1. Seed Kozhikode Users
    // ═══════════════════════════════════════════════════
    const kozhikodeUsers = TEST_USERS.filter(u => u.uid.startsWith('test_'));
    for (const u of kozhikodeUsers) {
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

    // ═══════════════════════════════════════════════════
    // 2. Seed Kannur Users
    // ═══════════════════════════════════════════════════
    const kannurUsers = TEST_USERS.filter(u => u.uid.startsWith('knr_'));
    for (const u of kannurUsers) {
      const loc = KANNUR_USER_PROFILES[u.uid];
      await db.collection('users').doc(u.uid).set({
        displayName: u.name,
        photoURL: u.photo,
        karmaTotal: Math.floor(Math.random() * 400) + 20,
        karmaWeekly: Math.floor(Math.random() * 40) + 5,
        district: loc.district,
        localBody: loc.localBody,
        ward: loc.ward,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }




    console.log('✅ Expanded Seed Complete via Admin SDK!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
