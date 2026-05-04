import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  enableIndexedDbPersistence,
  Timestamp,
} from 'firebase/firestore';
import { db as localDb } from './db';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Init Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestore = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});

// ─── SCHOOL ID HELPER ───────────────────────────────────────────────────────
function getSchoolId(): string {
  return localStorage.getItem('rankit_school_id') || 'default_school';
}

// ─── SYNC: LOCAL → FIRESTORE ─────────────────────────────────────────────────

/**
 * Push all local IndexedDB data up to Firestore.
 * Called when the app comes online or after a major data change.
 */
export async function syncToFirestore(): Promise<void> {
  const schoolId = getSchoolId();
  console.log('🔄 Syncing to Firestore...', schoolId);

  try {
    const [classes, learners, subjects, scores, school, settings] = await Promise.all([
      localDb.getAllClasses(),
      localDb.getAllLearners(),
      localDb.getAllSubjects(),
      localDb.getAllScores(),
      localDb.getAllSchools(),
      localDb.getAllSchoolSettings(),
    ]);

    const batch: Promise<void>[] = [];

    // Classes
    for (const cls of classes) {
      if (!cls.id) continue;
      const ref = doc(firestore, `schools/${schoolId}/classes/${cls.syncId || cls.id}`);
      batch.push(setDoc(ref, { ...cls, updatedAt: Timestamp.now() }, { merge: true }));
    }

    // Learners
    for (const learner of learners) {
      if (!learner.id) continue;
      const ref = doc(firestore, `schools/${schoolId}/learners/${learner.syncId || learner.id}`);
      batch.push(setDoc(ref, { ...learner, updatedAt: Timestamp.now() }, { merge: true }));
    }

    // Subjects
    for (const subject of subjects) {
      if (!subject.id) continue;
      const ref = doc(firestore, `schools/${schoolId}/subjects/${subject.syncId || subject.id}`);
      batch.push(setDoc(ref, { ...subject, updatedAt: Timestamp.now() }, { merge: true }));
    }

    // Test Scores (composite key → joined string)
    for (const score of scores) {
      const key = `${score.learnerId}_${score.subjectId}_${score.testType}_${score.term}_${score.year}_${score.weekNumber}`;
      const ref = doc(firestore, `schools/${schoolId}/testScores/${key}`);
      batch.push(setDoc(ref, { ...score, updatedAt: Timestamp.now() }, { merge: true }));
    }

    // School info
    for (const s of school) {
      if (!s.id) continue;
      const ref = doc(firestore, `schools/${schoolId}/info/${s.id}`);
      batch.push(setDoc(ref, { ...s, updatedAt: Timestamp.now() }, { merge: true }));
    }

    // School settings
    for (const setting of settings) {
      const key = `${setting.term?.replace(/\s+/g, '')}_${setting.year}`;
      const ref = doc(firestore, `schools/${schoolId}/settings/${key}`);
      batch.push(setDoc(ref, { ...setting, updatedAt: Timestamp.now() }, { merge: true }));
    }

    await Promise.all(batch);
    console.log(`✅ Synced ${batch.length} records to Firestore`);
  } catch (err) {
    console.error('❌ Firestore sync failed:', err);
    throw err;
  }
}

// ─── SYNC: FIRESTORE → LOCAL ─────────────────────────────────────────────────

/**
 * Pull Firestore data down into local IndexedDB.
 * Used for first-time setup or multi-device sync.
 */
export async function syncFromFirestore(): Promise<void> {
  const schoolId = getSchoolId();
  console.log('⬇️ Pulling from Firestore...', schoolId);

  try {
    // Clear local data first
    await localDb.clearAll();

    const [classSnap, learnerSnap, subjectSnap, scoreSnap, settingsSnap] = await Promise.all([
      getDocs(collection(firestore, `schools/${schoolId}/classes`)),
      getDocs(collection(firestore, `schools/${schoolId}/learners`)),
      getDocs(collection(firestore, `schools/${schoolId}/subjects`)),
      getDocs(collection(firestore, `schools/${schoolId}/testScores`)),
      getDocs(collection(firestore, `schools/${schoolId}/settings`)),
    ]);

    for (const snap of classSnap.docs) {
      await localDb.addClass(snap.data() as any);
    }
    for (const snap of learnerSnap.docs) {
      await localDb.addLearner(snap.data() as any);
    }
    for (const snap of subjectSnap.docs) {
      await localDb.addSubject(snap.data() as any);
    }
    for (const snap of scoreSnap.docs) {
      await localDb.addScore(snap.data() as any);
    }
    for (const snap of settingsSnap.docs) {
      await localDb.updateSchoolSettings(snap.data() as any);
    }

    console.log('✅ Local DB refreshed from Firestore');
  } catch (err) {
    console.error('❌ Firestore pull failed:', err);
    throw err;
  }
}

// ─── AI REPORT STORAGE ───────────────────────────────────────────────────────

export interface AIReportRecord {
  id: string;
  schoolId: string;
  classId: number;
  className: string;
  term: string;
  year: number;
  testType: string;
  generatedAt: Timestamp;
  reports: {
    learnerId: number;
    learnerName: string;
    comment: string;
    overallGrade: string;
    performance: string;
  }[];
  summary: string;
}

export async function saveAIReport(report: Omit<AIReportRecord, 'schoolId'>): Promise<void> {
  const schoolId = getSchoolId();
  const ref = doc(firestore, `schools/${schoolId}/aiReports/${report.id}`);
  await setDoc(ref, { ...report, schoolId }, { merge: true });
  console.log('✅ AI Report saved to Firestore:', report.id);
}

export async function getAIReports(classId: number): Promise<AIReportRecord[]> {
  const schoolId = getSchoolId();
  const q = query(
    collection(firestore, `schools/${schoolId}/aiReports`),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AIReportRecord);
}

export async function deleteAIReport(reportId: string): Promise<void> {
  const schoolId = getSchoolId();
  await deleteDoc(doc(firestore, `schools/${schoolId}/aiReports/${reportId}`));
}

export default app;