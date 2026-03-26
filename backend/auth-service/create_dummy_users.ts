
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(process.cwd(), '../../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase configuration in .env');
  console.log('Project ID:', projectId);
  console.log('Client Email:', clientEmail);
  process.exit(1);
}

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey,
      clientEmail,
    }),
  });
}

const db = admin.firestore();

async function createDummyElder(email: string, passwordHash: string, fullName: string) {
  const normalizedEmail = email.toLowerCase();
  
  // Check if exists
  const userQuery = await db.collection('users').where('email', '==', normalizedEmail).get();
  if (!userQuery.empty) {
    console.log(`Elder ${email} already exists. Skipping.`);
    return;
  }

  const uid = `dummy-elder-${Date.now()}`;
  const now = admin.firestore.Timestamp.now();

  const userDoc = {
    uid,
    email: normalizedEmail,
    passwordHash, // Custom field used in user's Auth Service
    fullName,
    age: 70,
    emergencyContact: '1234567890',
    familyMembers: [],
    connectionCode: Math.floor(100000 + Math.random() * 900000).toString(),
    createdAt: now,
    lastActive: now,
    profileSetupComplete: true,
    role: 'elder',
    accountStatus: 'active',
    authProvider: 'email'
  };

  await db.collection('users').doc(uid).set(userDoc);
  console.log(`Successfully created Elder user: ${email} (Code: ${userDoc.connectionCode})`);
}

async function createDummyFamily(email: string, passwordHash: string, fullName: string) {
  const normalizedEmail = email.toLowerCase();
  
  const userQuery = await db.collection('users').where('email', '==', normalizedEmail).get();
  if (!userQuery.empty) {
    console.log(`Family ${email} already exists. Skipping.`);
    return;
  }

  const uid = `dummy-family-${Date.now()}`;
  const now = admin.firestore.Timestamp.now();

  const userDoc = {
    uid,
    email: normalizedEmail,
    passwordHash, // Custom field
    fullName,
    phone: '0987654321',
    relationship: 'son',
    eldersConnected: [],
    createdAt: now,
    lastLogin: now,
    role: 'family',
    accountStatus: 'active',
    authProvider: 'email'
  };

  await db.collection('users').doc(uid).set(userDoc);
  console.log(`Successfully created Family user: ${email}`);
}

async function main() {
  try {
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Starting dummy user creation...');
    
    // Create users
    await createDummyFamily('test-family@gmail.com', hash, 'Test Family Admin');
    await createDummyElder('test-elder@gmail.com', hash, 'Test Elder User');

    console.log('\n-----------------------------------');
    console.log('LOGIN PORTALS READY');
    console.log('User: test-family@gmail.com / test-elder@gmail.com');
    console.log('Pass: password123');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    process.exit();
  }
}

main();
