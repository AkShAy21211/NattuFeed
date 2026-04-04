import "./load-env";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

/**
 * QR Deployment Toolkit for NattuFeed (Admin Version)
 * This script uses the Firebase Admin SDK to bypass security rules
 * and generate QR stubs for all verified bus stops.
 */

if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountPath) {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🌍 Connecting to LIVE Firebase Database...");
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    admin.initializeApp({
      projectId: 'nattufeed-d59c9'
    });
    console.log("🔥 Connecting to LOCAL Emulator Database...");
  }
}

const db = admin.firestore();

async function generateQRStubs() {
  console.log("🚀 Starting QR Stub Generation...");

  try {
    const anchorsRef = db.collection("bus_anchors");
    const snapshot = await anchorsRef.where("verified", "==", true).get();

    if (snapshot.empty) {
      console.log("⚠️ No verified anchors found. Have you seeded the database?");
      return;
    }

    const stubs: any[] = [];
    const baseUrl = "https://nattufeed.com/stop/";

    snapshot.forEach((doc) => {
      const data = doc.data();
      stubs.push({
        id: doc.id,
        name: data.name,
        url: `${baseUrl}${doc.id}`,
        district: data.district || "Kannur",
        routes: data.routes?.join(", ") || ""
      });
    });

    // 1. Generate JSON
    const jsonPath = path.join(process.cwd(), "deployment-qr-stubs.json");
    fs.writeFileSync(jsonPath, JSON.stringify(stubs, null, 2));

    // 2. Generate CSV
    const csvHeader = "ID,Name,District,Routes,Landing_URL\n";
    const csvRows = stubs.map(s => `"${s.id}","${s.name}","${s.district}","${s.routes}","${s.url}"`).join("\n");
    const csvPath = path.join(process.cwd(), "deployment-qr-stubs.csv");
    fs.writeFileSync(csvPath, csvHeader + csvRows);

    console.log(`✅ Success! Generated ${stubs.length} QR stubs.`);
    console.log(`📁 JSON: ${jsonPath}`);
    console.log(`📁 CSV: ${csvPath}`);
  } catch (err) {
    console.error("❌ Generation failed:", err);
  }
}

generateQRStubs().catch(console.error);
