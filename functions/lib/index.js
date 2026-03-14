"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetWeeklyKarma = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Scheduled function to reset `karmaWeekly` for all users every Monday at midnight IST.
 * Uses batch writes to handle multiple updates efficiently.
 */
exports.resetWeeklyKarma = (0, scheduler_1.onSchedule)({
    schedule: "0 0 * * 1",
    timeZone: "Asia/Kolkata",
    memory: "256MiB",
    region: "asia-south1",
}, async () => {
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
//# sourceMappingURL=index.js.map