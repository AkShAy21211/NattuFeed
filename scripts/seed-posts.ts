
import * as admin from 'firebase-admin';

// Initialize Admin SDK
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  // Auto-detect service account if env is missing
  const fs = require('fs');
  const path = require('path');
  const files = fs.readdirSync(process.cwd());
  const autoDetectedJson = files.find((f: string) => f.includes('firebase-adminsdk') && f.endsWith('.json'));

  if (serviceAccountPath || autoDetectedJson) {
    const finalPath = serviceAccountPath || path.join(process.cwd(), autoDetectedJson);
    const serviceAccount = require(finalPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log(`🌍 Seeding LIVE Firebase Database (${autoDetectedJson || 'from ENV'})...`);
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    admin.initializeApp({
      projectId: 'nattufeed-d59c9'
    });
    console.log("🔥 Seeding LOCAL Emulator Database...");
  }
}

const db = admin.firestore();

const VINOD_ID = 'duph4SzJbhdkQ3oWJbla37pCh9o1';
const AKSHAY_ID = 'YIk8fYx3n9Uwj4ygF4tnwVGFS8p2';
const ASWANTH_ID = 'eYVRlv5HoeX783b1vkG66dVcC8c2';

const NEW_POSTS = [
  // --- EXISTING POSTS CONVERTED TO MANGLISH ---
  {
    authorId: AKSHAY_ID,
    authorName: 'AKSHAY P',
    headline: 'KSRTC Kannur–Kozhikode: 90+ Services undu tto 🚌',
    details: 'Raavile 5:00 thodangi rathri 11:55 vare bus kittaum. Peak hours-il 15-20 mins idavala-yil bus undu. Enquiry-kku ee number-il vilikkaam: 04972707777.',
    landmark: 'Kannur New Bus Stand',
    category: 'Traffic',
    type: 'general',
    lat: 11.9206,
    lng: 75.3374,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Thavakkara',
    verifiedCount: 5,
    reactions: { verified: 5, hot: 1, helpful: 4, interesting: 0 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: ASWANTH_ID,
    authorName: 'ASWANTH EP',
    headline: 'District Hospital Blood Bank: 24/7 Helpline 🏥',
    details: 'Emergency aayi blood venamenkil 9496233788 or 04972733500-il vilikkaam. Collectorate-inu aduthaayi aanu ee hospital.',
    landmark: 'Kannur District Hospital',
    category: 'Health',
    type: 'general',
    lat: 11.9215,
    lng: 75.3385,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Ayikkara',
    verifiedCount: 8,
    reactions: { verified: 8, hot: 0, helpful: 10, interesting: 1 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: AKSHAY_ID,
    authorName: 'AKSHAY P',
    headline: 'St. Angelo Fort: Entry & Timing Update 🏰',
    details: 'Fort-ilekk entry 8:00 AM muthal 6:00 PM vare aanu. Entry fee: ₹25 (Indians). Vaikunneram 4 mani kazhinju poyal nalla vibe aanu. Family aayi poyko!',
    landmark: 'St. Angelo Fort',
    category: 'TownTalk',
    type: 'general',
    lat: 11.9195,
    lng: 75.3362,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Burnacherry',
    verifiedCount: 12,
    reactions: { verified: 12, hot: 3, helpful: 5, interesting: 8 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: ASWANTH_ID,
    authorName: 'ASWANTH EP',
    headline: 'KSEB 24/7 Centralized Helpline: 1912 ⚡',
    details: 'Current poyaal toll-free number 1912-il vilichal mathi. Nammuude Thana section landline: 04972706850.',
    landmark: 'Thana KSEB Office',
    category: 'Utility',
    type: 'general',
    lat: 11.9228,
    lng: 75.3398,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Thana',
    verifiedCount: 4,
    reactions: { verified: 4, hot: 0, helpful: 6, interesting: 0 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: ASWANTH_ID,
    authorName: 'ASWANTH EP',
    headline: 'Azhikkal–Mattool Ferry Timings ⛴️',
    details: 'Service starts from 06:30 AM to 09:00 PM. Azhikode commuterkku nalla help aanu. Mazha koodiyaal service-il change varaum.',
    landmark: 'Azhikkal Ferry Terminal',
    category: 'Traffic',
    type: 'general',
    lat: 11.9235,
    lng: 75.3344,
    district: 'Kannur',
    localBody: 'Azhikode Panchayat',
    ward: 'Azhikkal',
    verifiedCount: 3,
    reactions: { verified: 3, hot: 0, helpful: 4, interesting: 1 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: AKSHAY_ID,
    authorName: 'AKSHAY P',
    headline: 'Arakkal Museum: Weekly Holiday Reminder 🏛️',
    details: 'Arakkal Museum CLOSED every Monday! Timing: 09:30 AM to 05:30 PM. Ticket rate ₹10 thottu start cheiyyuna.',
    landmark: 'Arakkal Museum',
    category: 'TownTalk',
    type: 'general',
    lat: 11.9242,
    lng: 75.3402,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Ayikkara',
    verifiedCount: 6,
    reactions: { verified: 6, hot: 1, helpful: 3, interesting: 5 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },

  // --- NEW POSTS PROVIDED BY USER ---
  {
    authorId: VINOD_ID,
    authorName: 'Vinod',
    headline: 'Ayikkara-yil nalla fresh meen veno? 🐟',
    details: 'Caltex-il ninnu kurach dhooram poyaal Ayikkara Harbour-il ethum. Raavile 6:30-nu poyaal kadalil ninnu appol kittiye nalla choora, ayala, avoli okke kuranja vilayil kittaum. Nalla nadan item aanu!',
    landmark: 'Ayikkara Fishing Harbour',
    category: 'Market',
    type: 'general',
    lat: 11.8545,
    lng: 75.3722,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Ayikkara',
    verifiedCount: 10,
    reactions: { verified: 10, hot: 2, helpful: 5, interesting: 3 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: AKSHAY_ID,
    authorName: 'AKSHAY P',
    headline: 'Mele Chovva Railgate Alert! 🚂',
    details: 'Ee vazhi pokunnavar onnu sradhikuka. Train varunne time-il gate adachaal nalla block aairikkum. Airport-ilekk pokunnavar kurachu nerathe iranganam, allenkil gate-il pettu flight miss aakaan chance undu!',
    landmark: 'Mele Chovva Railway Gate',
    category: 'Traffic',
    type: 'general',
    lat: 11.8598,
    lng: 75.3985,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Mele Chovva',
    verifiedCount: 15,
    reactions: { verified: 15, hot: 8, helpful: 12, interesting: 1 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: ASWANTH_ID,
    authorName: 'ASWANTH EP',
    headline: 'Raathri marunnu veno? Caltex-il undu 🏥',
    details: 'Emergency aayi raathri marunnu venamenkil Caltex-ile Dhanalakshmi Medicals 24 hours open aanu. Home delivery service-um undu. Number save cheytho: 04972706500.',
    landmark: 'Caltex Junction',
    category: 'Health',
    type: 'general',
    lat: 11.8762,
    lng: 75.3734,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'South Bazar',
    verifiedCount: 20,
    reactions: { verified: 20, hot: 1, helpful: 18, interesting: 0 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: VINOD_ID,
    authorName: 'Vinod',
    headline: 'Payyambalam Beach Safety Warning 🌊',
    details: 'Beach-il ippo thirool (waves) kurach kooduthal aanu. Lifeguard parayunne pole mathram kadalil iranguka. Evening vibes-inu poyko, pakshe safety onnu sradhikkanam tto.',
    landmark: 'Payyambalam Beach',
    category: 'Alerts',
    type: 'general',
    lat: 11.8725,
    lng: 75.3530,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Payyambalam',
    verifiedCount: 5,
    reactions: { verified: 5, hot: 0, helpful: 7, interesting: 2 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  },
  {
    authorId: AKSHAY_ID,
    authorName: 'AKSHAY P',
    headline: 'KWA Pipe Burst Helpline 🚰',
    details: 'Paippu potti vellam pokunnathu kandaal nammude KWA toll-free number 1916-ilekk villikaam. WhatsApp complaints ee number-ilekk ayakkam: 9495998258. Photo koodi ayachaal nallath.',
    landmark: 'Civil Station Stop',
    category: 'Utility',
    type: 'general',
    lat: 11.8782,
    lng: 75.3750,
    district: 'Kannur',
    localBody: 'Kannur Municipal Corporation',
    ward: 'Collectorate',
    verifiedCount: 8,
    reactions: { verified: 8, hot: 0, helpful: 10, interesting: 1 },
    flagCount: 0,
    isHidden: false,
    isBusinessPost: false,
  }
];

const seedPosts = async () => {
  console.log('🚀 Starting Post Seeding & Cleanup...');

  try {
    const postsRef = db.collection('posts');

    // 1. Delete existing posts
    console.log('🗑️ Clearing existing posts...');
    const snapshot = await postsRef.get();
    const deleteBatch = db.batch();
    snapshot.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`✅ Deleted ${snapshot.size} posts.`);

    // 2. Ensure Users exist
    console.log('👤 Ensuring user profiles exist...');
    const usersBatch = db.batch();
    const users = [
      { id: VINOD_ID, name: 'Vinod' },
      { id: AKSHAY_ID, name: 'AKSHAY P' },
      { id: ASWANTH_ID, name: 'ASWANTH EP' }
    ];

    for (const u of users) {
      usersBatch.set(db.collection('users').doc(u.id), {
        uid: u.id,
        name: u.name,
        // photoURL intentionally omitted to test fallbacks
        district: 'Kannur',
        localBody: 'Kannur Municipal Corporation',
        onboarded: true,
        karmaTotal: 100,
        karmaWeekly: 20,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await usersBatch.commit();
    console.log('✅ Users synchronized.');

    // 3. Insert new posts
    console.log('📝 Inserting new production posts...');
    const insertBatch = db.batch();
    for (const post of NEW_POSTS) {
      const docRef = postsRef.doc();
      insertBatch.set(docRef, {
        ...post,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await insertBatch.commit();
    console.log(`✅ Successfully seeded ${NEW_POSTS.length} posts.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedPosts();
