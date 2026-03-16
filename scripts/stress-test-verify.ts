
/**
 * Firestore Concurrency Stress Test (Admin Edition)
 * 
 * This script simulates 100 simultaneous "Me Too" verifications on a single post
 * targeting the Firebase Local Emulator using the Admin SDK.
 * This bypasses security rules to test pure Firestore transaction performance.
 */

import * as admin from 'firebase-admin';

// Initialize Admin SDK for local emulator
if (!admin.apps.length) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  admin.initializeApp({
    projectId: 'nattufeed-d59c9'
  });
}

const db = admin.firestore();

const CONCURRENT_USERS = 100;
const POST_ID = 'stress-test-post-999';

async function setupTestDoc() {
  console.log("🛠 Setting up test post (Bypassing Rules)...");
  const postRef = db.collection('posts').doc(POST_ID);
  await postRef.set({
    headline: "Stress Test Post",
    verifiedCount: 0,
    authorId: "test-admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isHidden: false,
    category: "Traffic",
    district: "Kozhikode",
    localBody: "Kozhikode Corporation",
    ward: "Test Ward",
    authorName: "Stress Master",
    authorPhoto: "",
    landmark: "Test Lab",
    lat: 11.2588,
    lng: 75.7804,
    flagCount: 0,
    isBusinessPost: false
  });
}

async function simulateVerify(userId: string) {
  const postRef = db.collection('posts').doc(POST_ID);
  const verifyRef = db.collection('verifications').doc(`${POST_ID}_${userId}`);

  try {
    return await db.runTransaction(async (transaction) => {
      const verifyDoc = await transaction.get(verifyRef);
      if (verifyDoc.exists) {
        return "ALREADY_VERIFIED";
      }
      
      transaction.set(verifyRef, { 
        postId: POST_ID, 
        userId, 
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      transaction.update(postRef, { 
        verifiedCount: admin.firestore.FieldValue.increment(1)
      });
      return "SUCCESS";
    });
  } catch (err) {
    console.error(`❌ User ${userId} failed:`, err);
    throw err;
  }
}

async function runTest() {
  await setupTestDoc();

  console.log(`🚀 Firing ${CONCURRENT_USERS} simultaneous verifications...`);
  const users = Array.from({ length: CONCURRENT_USERS }, (_, i) => `test-user-${i}`);
  
  const startTime = Date.now();
  const results = await Promise.allSettled(users.map(simulateVerify));
  const endTime = Date.now();

  const succeeded = results.filter(r => r.status === 'fulfilled' && (r as any).value === "SUCCESS").length;
  const alreadyVerified = results.filter(r => r.status === 'fulfilled' && (r as any).value === "ALREADY_VERIFIED").length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log("\n--- TEST RESULTS ---");
  console.log(`✅ Success: ${succeeded}`);
  console.log(`⏳ Already Verified: ${alreadyVerified}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱ Time Taken: ${endTime - startTime}ms`);

  // Final count check
  const postDoc = await db.collection('posts').doc(POST_ID).get();
  const finalCount = postDoc.data()?.verifiedCount;
  
  console.log(`📊 Final verifiedCount in Firestore: ${finalCount}`);
  
  if (finalCount === CONCURRENT_USERS) {
    console.log("🏆 PASSED: Transaction logic is rock solid!");
  } else {
    console.log("⚠️ FAILED: Count mismatch! Investigate concurrency issues.");
  }
}

runTest().catch(console.error);
