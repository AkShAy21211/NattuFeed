
import * as admin from 'firebase-admin';
import * as path from 'path';

// ═══════════════════════════════════════════════════
// 1. Initialize Admin SDK
// ═══════════════════════════════════════════════════
if (!admin.apps.length) {
  const serviceAccount = require(
    path.resolve(__dirname, '..', 'nattufeed-d59c9-firebase-adminsdk-fbsvc-f3dff68116.json')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ── IDs & Roles ──
const VINOD_ID = 'duph4SzJbhdkQ3oWJbla37pCh9o1';
const AKSHAY_ID = 'YIk8fYx3n9Uwj4ygF4tnwVGFS8p2';
const ASWANTH_ID = 'eYVRlv5HoeX783b1vkG66dVcC8c2';

const PRO_USERS = [
  { uid: ASWANTH_ID, name: 'ASWANTH EP', role: 'Doctor' },
  { uid: 'knr_user_1', name: 'Akhil M', role: 'Ward Officer' },
  { uid: 'knr_user_5', name: 'Suresh Babu', role: 'Medical Staff' },
  { uid: 'knr_user_8', name: 'Divya Krishnan', role: 'Panchayat Member' }
];

// ═══════════════════════════════════════════════════
// 2. Data Source: Merged Absolute Master List
// ═══════════════════════════════════════════════════

const MASTER_POSTS = [
  // --- FROM SEED-POSTS.TS (Verified & Updated) ---
  {
    authorId: AKSHAY_ID, authorName: 'AKSHAY P',
    headline: 'KSRTC Kannur–Kozhikode: 90+ Services undu tto 🚌',
    details: 'Raavile 5:00 thodangi rathri 11:55 vare bus kittaum.',
    landmark: 'Kannur New Bus Stand', category: 'Traffic',
    lat: 11.8755, lng: 75.3742, verifiedCount: 5
  },
  {
    authorId: ASWANTH_ID, authorName: 'ASWANTH EP',
    headline: 'District Hospital Blood Bank: 24/7 Helpline 🏥',
    details: 'Emergency aayi blood venamenkil 9496233788-il vilikkaam.',
    landmark: 'Kannur District Hospital', category: 'Health',
    lat: 11.8744, lng: 75.3611, verifiedCount: 15
  },
  {
    authorId: AKSHAY_ID, authorName: 'AKSHAY P',
    headline: 'St. Angelo Fort: Entry & Timing Update 🏰',
    details: 'Fort-ilekk entry 8:00 AM muthal 6:00 PM vare aanu.',
    landmark: 'St. Angelo Fort', category: 'TownTalk',
    lat: 11.8548, lng: 75.3721, verifiedCount: 12
  },
  {
    authorId: ASWANTH_ID, authorName: 'ASWANTH EP',
    headline: 'KSEB 24/7 Centralized Helpline: 1912 ⚡',
    details: 'Current poyaal toll-free number 1912-il vilichal mathi.',
    landmark: 'Thana KSEB Office', category: 'Utility',
    lat: 11.8842, lng: 75.3792, verifiedCount: 4
  },
  {
    authorId: ASWANTH_ID, authorName: 'ASWANTH EP',
    headline: 'Azhikkal–Mattool Ferry Timings ⛴️',
    details: 'Service starts from 06:30 AM to 09:00 PM.',
    landmark: 'Azhikkal Ferry Terminal', category: 'Traffic',
    lat: 11.9354, lng: 75.3218, verifiedCount: 3
  },
  {
    authorId: AKSHAY_ID, authorName: 'AKSHAY P',
    headline: 'Arakkal Museum: Weekly Holiday Reminder 🏛️',
    details: 'Arakkal Museum CLOSED every Monday!',
    landmark: 'Arakkal Museum', category: 'TownTalk',
    lat: 11.8585, lng: 75.3789, verifiedCount: 6
  },
  {
    authorId: VINOD_ID, authorName: 'Vinod',
    headline: 'Ayikkara-yil nalla fresh meen veno? 🐟',
    details: 'Raavile 6:30-nu poyaal Harbour-il kuranja vilayil kittaum.',
    landmark: 'Ayikkara Fishing Harbour', category: 'Market',
    lat: 11.8601, lng: 75.3795, verifiedCount: 10
  },
  {
    authorId: AKSHAY_ID, authorName: 'AKSHAY P',
    headline: 'Mele Chovva Railgate Alert! 🚂',
    details: 'Airport-ilekk pokunnavar nerathe iranganam, gate-il block aavum.',
    landmark: 'Mele Chovva Railway Gate', category: 'Traffic',
    lat: 11.8615, lng: 75.3992, verifiedCount: 15
  },
  {
    authorId: ASWANTH_ID, authorName: 'ASWANTH EP',
    headline: 'Raathri marunnu veno? Caltex-il undu 🏥',
    details: 'Dhanalakshmi Medicals 24 hours open aanu.',
    landmark: 'Caltex Junction', category: 'Health',
    lat: 11.8785, lng: 75.3737, verifiedCount: 20
  },
  {
    authorId: VINOD_ID, authorName: 'Vinod',
    headline: 'Payyambalam Beach Safety Warning 🌊',
    details: 'Beach-il ippo waves kooduthal aanu. Sradhikkuka.',
    landmark: 'Payyambalam Beach', category: 'Alerts',
    lat: 11.8724, lng: 75.3528, verifiedCount: 5
  },
  {
    authorId: AKSHAY_ID, authorName: 'AKSHAY P',
    headline: 'KWA Pipe Burst Helpline 🚰',
    details: 'Vellam potti pokunnathu kandaal 1916-il villikaam.',
    landmark: 'Civil Station Stop', category: 'Utility',
    lat: 11.8784, lng: 75.3752, verifiedCount: 8
  },

  // --- EVERGREEN FROM SEED-LIVE.TS (Verified & Updated) ---
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Thavakkara vs Old Stand Confusion 🚌',
    details: 'Long distance buses New Stand-il aanu.',
    category: 'Traffic', lat: 11.8748, lng: 75.3728, verifiedCount: 15
  },
  {
    authorId: 'knr_user_2', authorName: 'Sreelakshmi R',
    headline: 'Thalassery Fish Market Fresh Arrivals 🐟',
    details: 'Raavile 07:00-nu munbe ethuna nallath.',
    category: 'Market', lat: 11.7482, lng: 75.4885, verifiedCount: 18
  },
  {
    authorId: 'knr_user_3', authorName: 'Vineeth Kumar',
    headline: 'Payyanur KSEB Complaint Office ⚡',
    details: 'Complaint-inu 1912-il vilikkuka.',
    category: 'Utility', lat: 12.1058, lng: 75.2075, verifiedCount: 9
  },
  {
    authorId: 'knr_user_5', authorName: 'Suresh Babu',
    headline: 'Iritty Night Pharmacy Access 💊',
    details: 'Main Junction-il shops open aakaarundu.',
    category: 'Health', lat: 11.9815, lng: 75.6705, verifiedCount: 12
  },
  {
    authorId: 'knr_user_6', authorName: 'Priya Menon',
    headline: 'Mattannur Auto Stand Rates 🚕',
    details: 'Meter charge mathrame nalkendullu.',
    category: 'Traffic', lat: 11.9321, lng: 75.5738, verifiedCount: 7
  },
  {
    authorId: 'knr_user_4', authorName: 'Fathima N',
    headline: 'Taliparamba Junction Peak Hour Block 🚦',
    details: '9AM and 5PM Junction-il nalla block undaakum.',
    category: 'Alerts', lat: 12.0368, lng: 75.3615, verifiedCount: 22
  },
  {
    authorId: 'knr_user_7', authorName: 'Nishanth T',
    headline: 'Panoor Sunday Market Nadan Veggies 🌶️',
    details: 'Sunday market-il nalla nadan items kittaum.',
    category: 'Market', lat: 11.8055, lng: 75.5415, verifiedCount: 6
  },
  {
    authorId: 'knr_user_8', authorName: 'Divya Krishnan',
    headline: 'Koothuparamba PHC Token System 🏥',
    details: 'Raavile thanne poyi token edukkaunne nallath.',
    category: 'Health', lat: 11.8648, lng: 75.5512, verifiedCount: 11
  },
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Railway Station 2nd Entry Hack 🚂',
    details: '2nd entry vazhi poyaal thirakku illathe keraam.',
    category: 'Traffic', lat: 11.8718, lng: 75.3676, verifiedCount: 19
  },
  {
    authorId: 'knr_user_2', authorName: 'Sreelakshmi R',
    headline: 'Thalassery Pier Evening Vibes 🌅',
    details: 'Relax cheyyaan Thalassery Pier nallath aanu.',
    category: 'TownTalk', lat: 11.7452, lng: 75.4848, verifiedCount: 16
  },
  {
    authorId: 'knr_user_4', authorName: 'Fathima N',
    headline: 'Taliparamba Civil Station Ration Card Help 🌾',
    details: 'Civil Station-il office-il poyaal mathi.',
    category: 'Utility', lat: 12.0412, lng: 75.3625, verifiedCount: 8
  },
  {
    authorId: 'knr_user_5', authorName: 'Suresh Babu',
    headline: 'Iritty Plumber/Electrician Service Help 🚰',
    details: 'Stand-inte aduthu shops-il chodichaal mathi.',
    category: 'Services', lat: 11.9822, lng: 75.6710, verifiedCount: 5
  },

  // --- NEIGHBORHOOD FROM SEED-LIVE.TS (Verified & Updated) ---
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Vankulathvayal-ile Fresh Meen Market 🐟',
    details: 'Fresh meen kittaum.',
    landmark: 'Vankulathuvayal Fish Market', category: 'Market',
    lat: 11.9055, lng: 75.3408, verifiedCount: 12
  },
  {
    authorId: 'knr_user_4', authorName: 'Fathima N',
    headline: 'Meenkunnu Beach View Point Caution 🌊',
    details: 'Slippery aakaan chance undu.',
    landmark: 'Meenkunnu View Point', category: 'Alerts',
    lat: 11.9168, lng: 75.3285, verifiedCount: 18
  },
  {
    authorId: 'knr_user_7', authorName: 'Nishanth T',
    headline: 'Azhikkal Estuary & Port Visit ⛴️',
    details: 'Evening walk-inu pogaam.',
    landmark: 'Azhikkal Ferry Terminal', category: 'TownTalk',
    lat: 11.9354, lng: 75.3218, verifiedCount: 9
  },
  {
    authorId: 'knr_user_8', authorName: 'Divya Krishnan',
    headline: 'Akshaya Poothappara E-Services 💻',
    details: 'Documentation-inu best place.',
    landmark: 'Akshaya Poothappara', category: 'Services',
    lat: 11.9021, lng: 75.3461, verifiedCount: 7
  },
  {
    authorId: 'knr_user_3', authorName: 'Vineeth Kumar',
    headline: 'Moonnunirath Junction Road Guide 🛣️',
    details: 'Main junction information.',
    landmark: 'Moonnunirath Junction', category: 'Traffic',
    lat: 11.9125, lng: 75.3361, verifiedCount: 5
  },
  {
    authorId: 'knr_user_2', authorName: 'Sreelakshmi R',
    headline: 'Shirdi Sai Baba Mandir Alavil 🛕',
    details: 'Evening bhajan vibe nallath aanu.',
    landmark: 'Shirdi Sree Sai Baba Mandir', category: 'TownTalk',
    lat: 11.8845, lng: 75.3615, verifiedCount: 14
  },
  {
    authorId: 'knr_user_6', authorName: 'Priya Menon',
    headline: 'Alavil Post Office Location 📮',
    details: 'Working hours: 10 AM to 4 PM.',
    landmark: 'Alavil Post Office', category: 'Utility',
    lat: 11.8839, lng: 75.3628, verifiedCount: 4
  },
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Chalad Beach Evening Relaxing Spot 🌊',
    details: 'Walk-inu pogaan nalla place aanu.',
    landmark: 'Chalad Beach', category: 'TownTalk',
    lat: 11.8792, lng: 75.3524, verifiedCount: 20
  },
  {
    authorId: 'knr_user_5', authorName: 'Suresh Babu',
    headline: 'Padanapalam Bus Stop Info 🚌',
    details: 'Alavil-Azhikode route bus stop.',
    landmark: 'Padanna Paalam Bus Stop', category: 'Traffic',
    lat: 11.8895, lng: 75.3582, verifiedCount: 6
  },
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Payyambalam Beach Safety - Red Flag Alert 🚩',
    details: 'Waves kooduthalaayaal safety sradhikkuka.',
    landmark: 'Payyambalam Beach', category: 'Alerts',
    lat: 11.8724, lng: 75.3528, verifiedCount: 35
  },
  {
    authorId: 'knr_user_2', authorName: 'Sreelakshmi R',
    headline: 'Mother and Child Sculpture at Payyambalam 🗿',
    details: 'Photography-kku nalla spot aanu.',
    landmark: 'Payyambalam Beach Garden', category: 'TownTalk',
    lat: 11.8708, lng: 75.3555, verifiedCount: 15
  },
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'SN Park Timings for Morning Walk 🚶',
    details: 'Morning walk timings available.',
    landmark: 'S N Park', category: 'TownTalk',
    lat: 11.8688, lng: 75.3585, verifiedCount: 11
  },
  {
    authorId: 'knr_user_4', authorName: 'Fathima N',
    headline: 'Fresh Veggies near Poothappara 🥦',
    details: 'Nadan pachakkari kittaum.',
    landmark: 'Poothappara Junction', category: 'Market',
    lat: 11.9015, lng: 75.3465, verifiedCount: 5
  },
  {
    authorId: 'knr_user_7', authorName: 'Nishanth T',
    headline: 'Azhikkal Ferry Mattool Service Update ⛴️',
    details: 'Service raavile 6:30 starts.',
    landmark: 'Azhikkal Ferry', category: 'Traffic',
    lat: 11.9354, lng: 75.3218, verifiedCount: 8
  },
  {
    authorId: 'knr_user_8', authorName: 'Divya Krishnan',
    headline: 'Chalad Sree Dharma Shastha Temple 🛕',
    details: 'Main temple in Chalad.',
    landmark: 'Chalad Sree Dharma Shastha temple', category: 'TownTalk',
    lat: 11.8798, lng: 75.3538, verifiedCount: 13
  },
  {
    authorId: 'knr_user_3', authorName: 'Vineeth Kumar',
    headline: 'Moonnunirath Junction Auto Stand 🚕',
    details: 'Stand for town/ferry service.',
    landmark: 'Moonnunirath Auto Stand', category: 'Traffic',
    lat: 11.9125, lng: 75.3361, verifiedCount: 7
  },
  {
    authorId: 'knr_user_1', authorName: 'Akhil M',
    headline: 'Payyambalam Beach Corniche Walk 🌅',
    details: 'Clean walkway for exercise.',
    landmark: 'Payyambalam Beach Corniche', category: 'TownTalk',
    lat: 11.8715, lng: 75.3542, verifiedCount: 19
  },
  {
    authorId: 'knr_user_4', authorName: 'Fathima N',
    headline: 'Chalad Beach Market Prices 🐠',
    details: 'Fresh fish available locally.',
    landmark: 'Chalad Beach Area', category: 'Market',
    lat: 11.8788, lng: 75.3525, verifiedCount: 6
  }
];

const reseed = async () => {
  console.log('🚀 UNIFIED RE-SEED STARTING...');

  // 1. Wipe current posts
  const postsRef = db.collection('posts');
  const snapshot = await postsRef.get();
  const deleteBatch = db.batch();
  snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log(`🗑️ Deleted ${snapshot.size} existing posts.`);

  // 2. Hydrate Pros
  for (const pro of PRO_USERS) {
    await db.collection('users').doc(pro.uid).set({
      isVerified: true,
      professionalRole: pro.role,
      karmaTotal: 1000,
      isInternal: true
    }, { merge: true });
    console.log(`✅ User ${pro.name} verified as: ${pro.role}`);
  }

  // 3. Batch Insert
  const insertBatch = db.batch();
  
  for (let i = 0; i < MASTER_POSTS.length; i++) {
    const raw: any = MASTER_POSTS[i];
    const isPro = PRO_USERS.find(u => u.uid === raw.authorId);
    
    const enriched = {
      ...raw,
      details: raw.details || raw.headline,
      landmark: raw.landmark || "Kannur Town",
      district: 'Kannur',
      localBody: raw.localBody || 'Kannur Municipal Corporation',
      ward: raw.ward || 'Central',
      verifiedCount: raw.verifiedCount || 0,
      reactions: raw.reactions || { verified: raw.verifiedCount || 0 },
      flagCount: 0,
      isHidden: false,
      isBusinessPost: false,
      type: 'general',
      authorKarmaAtPost: isPro ? 1000 : 100,
      authorRole: null, // Temporarily disabled as per user request
      trustScore: 0,    // Reset trust score to hide badges for "neutral" launch
      viewCount: Math.floor((raw.verifiedCount || 0) * (8 + Math.random() * 10)) + Math.floor(Math.random() * 20) + 5,
      createdAt: admin.firestore.Timestamp.fromMillis(Date.now() - (MASTER_POSTS.length - i) * 600000)
    };

    const docRef = postsRef.doc();
    insertBatch.set(docRef, enriched);
  }

  await insertBatch.commit();
  console.log(`✅ SUCCESSFULLY SEEDED ${MASTER_POSTS.length} ENRICHED POSTS!`);
  process.exit(0);
};

reseed().catch(err => {
  console.error('❌ SEED ERROR:', err);
  process.exit(1);
});
