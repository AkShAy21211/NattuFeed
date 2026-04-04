
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
  // --- KANNUR CITY CENTER & MAJOR HUBS ---
  {
    name: "KANNUR NEW BUS TERMINAL",
    location: new admin.firestore.GeoPoint(11.8670, 75.3715),
    verified: true,
    routes: ["Kozhikode", "Thalassery", "Payyanur", "Mattannur", "Iritty", "Bangalore"],
    verifiedCount: 0
  },
  {
    name: "KSRTC Bus Stand Kannur (Caltex)",
    location: new admin.firestore.GeoPoint(11.8751, 75.3745),
    verified: true,
    routes: ["Thiruvananthapuram", "Kochi", "Coimbatore", "Madurai", "Sultan Bathery", "Palakkad", "Kasaragod", "Taliparamba"],
    verifiedCount: 0
  },
  {
    name: "Kannur Railway Station",
    location: new admin.firestore.GeoPoint(11.8718, 75.3676),
    verified: true,
    routes: ["Mangalore", "Kochi", "Trivandrum", "Chennai", "Coimbatore"],
    verifiedCount: 0
  },
  {
    name: "Thavakkara Junction",
    location: new admin.firestore.GeoPoint(11.8682, 75.3702),
    verified: true,
    routes: ["Railway Station Link", "New Bus Stand Link", "City Center"],
    verifiedCount: 0
  },
  {
    name: "SN Park Bus Stop",
    location: new admin.firestore.GeoPoint(11.8695, 75.3732),
    verified: true,
    routes: ["Thana", "Caltex", "Railway Station", "Fort Road"],
    verifiedCount: 0
  },
  {
    name: "Plaza Junction",
    location: new admin.firestore.GeoPoint(11.8712, 75.3695),
    verified: true,
    routes: ["Railway Station", "Fort Road", "Thavakkara", "Thana"],
    verifiedCount: 0
  },
  {
    name: "Thana Junction",
    location: new admin.firestore.GeoPoint(11.8742, 75.3830),
    verified: true,
    routes: ["Mattannur", "Airport", "Thalassery (via Highway)", "Melechowa"],
    verifiedCount: 0
  },
  {
    name: "Civil Station Stop",
    location: new admin.firestore.GeoPoint(11.8757, 75.3725),
    verified: true,
    routes: ["Caltex Junction", "Talap", "Collectorate Staff Routes"],
    verifiedCount: 0
  },

  // --- REGIONAL STANDS ---
  {
    name: "Thalassery New Bus Stand",
    location: new admin.firestore.GeoPoint(11.7503, 75.4925),
    verified: true,
    routes: ["Kuthuparamba", "Mananthavady", "Nadapuram", "Panoor", "Kozhikode", "Vatakara"],
    verifiedCount: 0
  },
  {
    name: "KSRTC Bus Stand Payyanur (Perumba)",
    location: new admin.firestore.GeoPoint(12.0975, 75.2057),
    verified: true,
    routes: ["Kanhangad", "Kasaragod", "Taliparamba", "Mangalore", "Cherupuzha", "Pariyaram"],
    verifiedCount: 0
  },
  {
    name: "Taliparamba Bus Stand",
    location: new admin.firestore.GeoPoint(12.0345, 75.3611),
    verified: true,
    routes: ["Alakode", "Cherupuzha", "Payyavoor", "Sreekandapuram", "Irikkur", "Iritty"],
    verifiedCount: 0
  },
  {
    name: "Mattannur Bus Stand",
    location: new admin.firestore.GeoPoint(11.9189, 75.5761),
    verified: true,
    routes: ["Kannur Airport", "Iritty", "Sivapuram", "Thalassery", "Kuthuparamba"],
    verifiedCount: 0
  },
  {
    name: "Iritty Bus Station",
    location: new admin.firestore.GeoPoint(11.9815, 75.6645),
    verified: true,
    routes: ["Virajpet", "Mysore", "Bangalore", "Peravoor", "Vallithode", "Ulikkal"],
    verifiedCount: 0
  },
  {
    name: "Kuthuparamba Bus Stand",
    location: new admin.firestore.GeoPoint(11.8315, 75.5645),
    verified: true,
    routes: ["Panoor", "Thalassery", "Mattannur", "Uruvachal", "Kannur City"],
    verifiedCount: 0
  },

  // --- LOCAL JUNCTIONS & STOPS ---
  {
    name: "Pappinisseri Junction",
    location: new admin.firestore.GeoPoint(11.9333, 75.3562),
    verified: true,
    routes: ["Parassinikkadavu", "Valapattanam", "Vellikkeel", "Pazhayangadi"],
    verifiedCount: 0
  },
  {
    name: "Pazhayangadi Bus Stand",
    location: new admin.firestore.GeoPoint(12.0234, 75.2678),
    verified: true,
    routes: ["Payyanur", "Cherukunnu", "Madayi Para", "Mattool", "Ezhome"],
    verifiedCount: 0
  },
  {
    name: "Chakkarakkal Junction",
    location: new admin.firestore.GeoPoint(11.8687, 75.4674),
    verified: true,
    routes: ["Anjarakandy", "Eachur", "Mamba", "Kannur City", "Mattannur"],
    verifiedCount: 0
  },
  {
    name: "Panoor Bus Stand",
    location: new admin.firestore.GeoPoint(11.7589, 75.5812),
    verified: true,
    routes: ["Thalassery", "Kuthuparamba", "Nadapuram", "Mahe", "Peringathur"],
    verifiedCount: 0
  },
  {
    name: "Alakode Bus Stand",
    location: new admin.firestore.GeoPoint(12.1289, 75.4812),
    verified: true,
    routes: ["Taliparamba", "Cherupuzha", "Udayagiri", "Karthikapuram", "Karuvanchal"],
    verifiedCount: 0
  },
  {
    name: "Cherupuzha Bus Stand",
    location: new admin.firestore.GeoPoint(12.2745, 75.3611),
    verified: true,
    routes: ["Payyanur", "Alakode", "Pulingome", "Thirumeni", "Karnataka Border"],
    verifiedCount: 0
  },
  {
    name: "Sreekandapuram Junction",
    location: new admin.firestore.GeoPoint(12.0289, 75.5212),
    verified: true,
    routes: ["Taliparamba", "Iritty", "Irikkur", "Payyavoor", "Chengalayi"],
    verifiedCount: 0
  },
  {
    name: "Pilathara Junction",
    location: new admin.firestore.GeoPoint(12.0721, 75.2456),
    verified: true,
    routes: ["Pariyaram Medical College", "Payyanur", "Taliparamba", "Mathil"],
    verifiedCount: 0
  },
  {
    name: "Dharmasala (Anthoor)",
    location: new admin.firestore.GeoPoint(11.9567, 75.3712),
    verified: true,
    routes: ["Parassinikkadavu Temple", "Kannur University", "Bakkalam", "Taliparamba"],
    verifiedCount: 0
  },
  {
    name: "Eachur Junction",
    location: new admin.firestore.GeoPoint(11.8745, 75.4321),
    verified: true,
    routes: ["Mowanchery", "Chakkarakkal", "Melechowa", "Kannur City"],
    verifiedCount: 0
  },
  {
    name: "Anjarakandy Junction",
    location: new admin.firestore.GeoPoint(11.8389, 75.4856),
    verified: true,
    routes: ["Chakkarakkal", "Mattannur", "Mamba", "Thalassery"],
    verifiedCount: 0
  },
  {
    name: "Peravoor Bus Stand",
    location: new admin.firestore.GeoPoint(11.8945, 75.7321),
    verified: true,
    routes: ["Iritty", "Kuthuparamba", "Nidumpoil", "Mananthavady"],
    verifiedCount: 0
  },
  {
    name: "Peralassery Stop",
    location: new admin.firestore.GeoPoint(11.8212, 75.4612),
    verified: true,
    routes: ["Thalassery", "Kannur", "Mamba", "Kadachira"],
    verifiedCount: 0
  },
  {
    name: "Chala Junction (Bypass)",
    location: new admin.firestore.GeoPoint(11.8512, 75.4123),
    verified: true,
    routes: ["Thalassery Bypass", "Melechowa", "Thazhe Chovva", "Nadal"],
    verifiedCount: 0
  },
  {
    name: "Valapattanam Ferry Stop",
    location: new admin.firestore.GeoPoint(11.9112, 75.3521),
    verified: true,
    routes: ["Pappinisseri", "Puthiyatheru", "Azhikkal", "Mannad"],
    verifiedCount: 0
  },

  // --- AZHIKODE LOCAL NETWORK ---
  {
    name: "Azhikode High School Stop",
    location: new admin.firestore.GeoPoint(11.9168, 75.3375),
    verified: true,
    routes: ["Kannur City", "Azhikkal Ferry", "Valapattanam", "Chalad"],
    verifiedCount: 0
  },
  {
    name: "Moonunirath Junction",
    location: new admin.firestore.GeoPoint(11.9056, 75.3421),
    verified: true,
    routes: ["Azhikode", "Kannur City", "Alavil", "Vankulathuvayal"],
    verifiedCount: 0
  },
  {
    name: "Poothapara Stop",
    location: new admin.firestore.GeoPoint(11.8982, 75.3456),
    verified: true,
    routes: ["Azhikkal", "Alavil", "Kannur Town", "Valapattanam"],
    verifiedCount: 0
  },
  {
    name: "Alavil Junction",
    location: new admin.firestore.GeoPoint(11.8894, 75.3528),
    verified: true,
    routes: ["Kannur City", "Azhikode", "Pallikunnu", "Manal"],
    verifiedCount: 0
  },
  {
    name: "Chalad Junction",
    location: new admin.firestore.GeoPoint(11.8828, 75.3484),
    verified: true,
    routes: ["Azhikode", "Kannur Town", "Payyambalam", "Padanapalam"],
    verifiedCount: 0
  },
  {
    name: "Padanapalam Stop",
    location: new admin.firestore.GeoPoint(11.8812, 75.3615),
    verified: true,
    routes: ["Chalad", "Talap", "Civil Station", "Kannur City"],
    verifiedCount: 0
  },

  // --- OTHER NOTABLE LOCATIONS ---
  {
    name: "Melechowa Junction",
    location: new admin.firestore.GeoPoint(11.8543, 75.3957),
    verified: true,
    routes: ["Thalassery", "Eachur", "Mowanchery", "Chala Bypass"],
    verifiedCount: 0
  },
  {
    name: "Thazhe Chovva Junction",
    location: new admin.firestore.GeoPoint(11.8475, 75.4055),
    verified: true,
    routes: ["Thalassery", "Kozhikode", "NH66 South Bound", "Chala"],
    verifiedCount: 0
  },
  {
    name: "Payyambalam Beach Stop",
    location: new admin.firestore.GeoPoint(11.8689, 75.3565),
    verified: true,
    routes: ["Pallikunnu", "Chalad", "City Circular"],
    verifiedCount: 0
  },
  {
    name: "Puthiyatheru Junction",
    location: new admin.firestore.GeoPoint(11.9054, 75.3678),
    verified: true,
    routes: ["Payyanur", "Taliparamba", "Pappinisseri", "Valapattanam"],
    verifiedCount: 0
  }
];

const seedAnchors = async () => {
  console.log('🚀 Starting Anchor Seeding...');

  try {
    const batch = db.batch();
    const collectionRef = db.collection('bus_anchors');

    for (const anchor of ANCHORS) {
      process.stdout.write(`📍 Seeding ${anchor.name}... `);
      // Check for existing anchor with same name to override duplicates
      const existingQuery = await collectionRef.where('name', '==', anchor.name).limit(1).get();
      
      if (!existingQuery.empty) {
        const docRef = existingQuery.docs[0].ref;
        batch.update(docRef, {
          ...anchor,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Updated');
      } else {
        const docRef = collectionRef.doc();
        batch.set(docRef, {
          ...anchor,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✨ Created');
      }
    }

    console.log('📦 Committing batch...');
    await batch.commit();

      process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAnchors();
