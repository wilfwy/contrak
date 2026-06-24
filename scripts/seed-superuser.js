/**
 * Seed script to promote an existing Firebase user to super_admin.
 * Run: node scripts/seed-superuser.js
 *
 * Prerequisites:
 *   - The user must already exist in Firebase Authentication
 *   - FIREBASE_SERVICE_ACCOUNT env var OR config/firebase-service-account.json must exist
 *
 * Usage:
 *   node scripts/seed-superuser.js <email>
 *   (defaults to wilfriedezi7@gmail.com)
 */
const admin = require('firebase-admin');
const readline = require('readline');

async function main() {
  const email = process.argv[2] || 'wilfriedezi7@gmail.com';

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('../config/firebase-service-account.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();
  const auth = admin.auth();

  // Find user by email
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    console.error(`User with email "${email}" not found in Firebase Auth.`);
    console.error('Create them via the app registration first, then run this script.');
    process.exit(1);
  }

  console.log(`Found user: ${userRecord.uid} (${userRecord.email})`);

  // Check current Firestore doc
  const userDoc = await db.collection('users').doc(userRecord.uid).get();
  if (!userDoc.exists) {
    // Create the Firestore record if it doesn't exist
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      plan: 'pro',
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created Firestore user record with role=super_admin, plan=pro');
  } else {
    const current = userDoc.data();
    console.log(`Current role: "${current.role || 'user'}", plan: "${current.plan || 'basic'}"`);

    // Confirm before updating
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question(`Promote ${email} to super_admin? (y/N) `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Aborted.');
      process.exit(0);
    }

    await db.collection('users').doc(userRecord.uid).update({
      role: 'super_admin',
      plan: 'pro'
    });
    console.log('Updated user: role=super_admin, plan=pro');
  }

  console.log(`\n✅ ${email} is now a super_admin!`);
  console.log('You can now access /api/auth/make-super to promote other users.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
