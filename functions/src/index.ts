import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const db = getFirestore();

/**
 * Scheduled function to reset `karmaWeekly` for all users every Monday at midnight IST.
 * Uses batch writes to handle multiple updates efficiently.
 */
export const resetWeeklyKarma = onSchedule({
  schedule: "0 0 * * 1",
  timeZone: "Asia/Kolkata",
  memory: "256MiB",
  region: "asia-south1",
}, async (): Promise<void> => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("karmaWeekly", ">", 0).get();

  if (snapshot.empty) {
    console.log("No users with weekly karma found.");
    return;
  }

  // Firestore allows up to 500 operations per batch
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let count = 0;
  let totalReset = 0;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { karmaWeekly: 0 });
    count++;
    totalReset++;

    if (count === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`Weekly Reset complete: Successfully reset karma for ${totalReset} users.`);
});
