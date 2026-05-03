import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema matching Android Room entities
interface RankItSchema extends DBSchema {
  classes: {
    key: number;
    value: ClassEntity;
    indexes: { 'by-year': number; 'by-level': string };
  };
  learners: {
    key: number;
    value: LearnerEntity;
    indexes: { 'by-class': number };
  };
  subjects: {
    key: number;
    value: SubjectEntity;
    indexes: { 'by-class': number };
  };
  testScores: {
    key: [number, number, string, string, number, number]; // [learnerId, subjectId, testType, term, year, weekNumber]
    value: TestScoreEntity;
    indexes: {
      'by-learner': number;
      'by-subject': number;
      'by-test-type': string;
      'by-term-year': [string, number];
      'by-learner-term': [number, string, number];
    };
  };
  learnerRankings: {
    key: number;
    value: LearnerRankingEntity;
    indexes: {
      'by-class-test': [number, string];
    };
  };
  schoolSettings: {
    key: string; // "Term1_2025" format
    value: SchoolSettingsEntity;
  };
  school: {
    key: number;
    value: SchoolEntity;
  };
  users: {
    key: number;
    value: UserEntity;
  };
  subscriptions: {
    key: string;
    value: SubscriptionEntity;
  };
  grades: {
    key: number;
    value: GradeEntity;
  };
  classSubjectCrossRef: {
    key: [number, number]; // [classId, subjectId]
    value: ClassSubjectCrossRef;
    indexes: {
      'by-class': number;
      'by-subject': number;
    };
  };
}

// Entity type definitions (matching Kotlin entities)
export interface ClassEntity {
  id?: number;
  className: string;
  academicYear: number;
  subjectsOffered: string;
  maximumPupils: number | null;
  level: string;
  educationLevel: string;
  syncId: string;
}

export interface LearnerEntity {
  id?: number;
  name: string;
  classId: number;
  gender: string;
  parentPhone: string;
  syncId: string;
}

export interface SubjectEntity {
  id?: number;
  subjectName: string;
  subjectId: number;
  classId: number;
  maxMark: number | null;
  syncId: string;
}

export interface TestScoreEntity {
  learnerId: number;
  subjectId: number;
  testType: string; // "endofterm", "midterm", "weekly"
  score: number;
  term: string;
  year: number;
  weekNumber: number;
  dateEntered: number;
}

export interface LearnerRankingEntity {
  id?: number;
  classId: number;
  testType: string;
  learnerId: number;
  position: number;
  totalLearners: number;
}

export interface SchoolSettingsEntity {
  id?: string;
  term: string;
  year: number;
  primaryPassingRate: number;
  secondaryPassingRate: number;
  useEducationLevelRates: boolean;
  headteacherName?: string;
  deputyHeadteacherName?: string;
  lastModified: number;
  modifiedBy: string;
}

export interface SchoolEntity {
  id?: number;
  schoolName: string;
  schoolAddress: string;
  schoolPhone?: string;
  schoolEmail?: string;
  logoUri?: string;
}

export interface UserEntity {
  id?: number;
  username: string;
  hashedPassword: string;
  recoveryAnswer: string;
}

export interface SubscriptionEntity {
  id: string;
  planType: string;
  expiryDate: number;
  source: string;
  transactionId?: string;
  activatedAt: number;
}

export interface GradeEntity {
  id?: number;
  gradeName: string;
}

export interface ClassSubjectCrossRef {
  classId: number;
  subjectId: number;
}

// Database service class
class RankItDatabase {
  private db: IDBPDatabase<RankItSchema> | null = null;

  async init() {
    this.db = await openDB<RankItSchema>('RankItZM', 1, {
      upgrade(db) {
        // Classes table
        if (!db.objectStoreNames.contains('classes')) {
          const classStore = db.createObjectStore('classes', { keyPath: 'id', autoIncrement: true });
          classStore.createIndex('by-year', 'academicYear');
          classStore.createIndex('by-level', 'educationLevel');
        }

        // Learners table
        if (!db.objectStoreNames.contains('learners')) {
          const learnerStore = db.createObjectStore('learners', { keyPath: 'id', autoIncrement: true });
          learnerStore.createIndex('by-class', 'classId');
        }

        // Subjects table
        if (!db.objectStoreNames.contains('subjects')) {
          const subjectStore = db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
          subjectStore.createIndex('by-class', 'classId');
        }

        // Test Scores table (composite key)
        if (!db.objectStoreNames.contains('testScores')) {
          const scoreStore = db.createObjectStore('testScores', {
            keyPath: ['learnerId', 'subjectId', 'testType', 'term', 'year', 'weekNumber'],
          });
          scoreStore.createIndex('by-learner', 'learnerId');
          scoreStore.createIndex('by-subject', 'subjectId');
          scoreStore.createIndex('by-test-type', 'testType');
          scoreStore.createIndex('by-term-year', ['term', 'year']);
          scoreStore.createIndex('by-learner-term', ['learnerId', 'term', 'year']);
        }

        // Learner Rankings table
        if (!db.objectStoreNames.contains('learnerRankings')) {
          const rankingStore = db.createObjectStore('learnerRankings', { keyPath: 'id', autoIncrement: true });
          rankingStore.createIndex('by-class-test', ['classId', 'testType']);
        }

        // School Settings table
        if (!db.objectStoreNames.contains('schoolSettings')) {
          db.createObjectStore('schoolSettings', { keyPath: 'id' });
        }

        // School table
        if (!db.objectStoreNames.contains('school')) {
          db.createObjectStore('school', { keyPath: 'id', autoIncrement: true });
        }

        // Users table
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }

        // Subscriptions table
        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', { keyPath: 'id' });
        }

        // Grades table
        if (!db.objectStoreNames.contains('grades')) {
          db.createObjectStore('grades', { keyPath: 'id', autoIncrement: true });
        }

        // Class-Subject Cross Reference table
        if (!db.objectStoreNames.contains('classSubjectCrossRef')) {
          const crossRefStore = db.createObjectStore('classSubjectCrossRef', {
            keyPath: ['classId', 'subjectId'],
          });
          crossRefStore.createIndex('by-class', 'classId');
          crossRefStore.createIndex('by-subject', 'subjectId');
        }
      },
    });
  }

  // Ensure DB is initialized
  private async ensureInit() {
    if (!this.db) {
      await this.init();
    }
  }

  // CLASSES
  async addClass(classData: ClassEntity) {
    await this.ensureInit();
    return this.db!.add('classes', classData);
  }

  async updateClass(classData: ClassEntity) {
    await this.ensureInit();
    return this.db!.put('classes', classData);
  }

  async getClass(id: number) {
    await this.ensureInit();
    return this.db!.get('classes', id);
  }

  async getAllClasses() {
    await this.ensureInit();
    return this.db!.getAll('classes');
  }

  async deleteClass(id: number) {
    await this.ensureInit();
    return this.db!.delete('classes', id);
  }

  // LEARNERS
  async addLearner(learnerData: LearnerEntity) {
    await this.ensureInit();
    return this.db!.add('learners', learnerData);
  }

  async updateLearner(learnerData: LearnerEntity) {
    await this.ensureInit();
    return this.db!.put('learners', learnerData);
  }

  async getLearner(id: number) {
    await this.ensureInit();
    return this.db!.get('learners', id);
  }

  async getLearnersByClass(classId: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('learners', 'by-class', classId);
  }

  async getAllLearners() {
    await this.ensureInit();
    return this.db!.getAll('learners');
  }

  async deleteLearner(id: number) {
    await this.ensureInit();
    return this.db!.delete('learners', id);
  }

  // SUBJECTS
  async addSubject(subjectData: SubjectEntity) {
    await this.ensureInit();
    return this.db!.add('subjects', subjectData);
  }

  async updateSubject(subjectData: SubjectEntity) {
    await this.ensureInit();
    return this.db!.put('subjects', subjectData);
  }

  async getSubject(id: number) {
    await this.ensureInit();
    return this.db!.get('subjects', id);
  }

  async getSubjectsByClass(classId: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('subjects', 'by-class', classId);
  }

  async getAllSubjects() {
    await this.ensureInit();
    return this.db!.getAll('subjects');
  }

  async deleteSubject(id: number) {
    await this.ensureInit();
    return this.db!.delete('subjects', id);
  }

  // TEST SCORES
  async addScore(scoreData: TestScoreEntity) {
    await this.ensureInit();
    return this.db!.add('testScores', scoreData);
  }

  async updateScore(scoreData: TestScoreEntity) {
    await this.ensureInit();
    return this.db!.put('testScores', scoreData);
  }

  async getScoresByLearner(learnerId: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('testScores', 'by-learner', learnerId);
  }

  async getScoresByLearnerAndTerm(learnerId: number, term: string, year: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('testScores', 'by-learner-term', [learnerId, term, year]);
  }

  async getScoresBySubject(subjectId: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('testScores', 'by-subject', subjectId);
  }

  async getScoresByTestType(testType: string) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('testScores', 'by-test-type', testType);
  }

  async getScoresByTermYear(term: string, year: number) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('testScores', 'by-term-year', [term, year]);
  }

  async getAllScores() {
    await this.ensureInit();
    return this.db!.getAll('testScores');
  }

  // RANKINGS
  async addRanking(rankingData: LearnerRankingEntity) {
    await this.ensureInit();
    return this.db!.add('learnerRankings', rankingData);
  }

  async getRankingsByClassAndTest(classId: number, testType: string) {
    await this.ensureInit();
    return this.db!.getAllFromIndex('learnerRankings', 'by-class-test', [classId, testType]);
  }

  // SCHOOL SETTINGS
async updateSchoolSettings(settingsData: SchoolSettingsEntity) {
    await this.ensureInit();
    const key = `${settingsData.term.replace(/\s+/g, '')}_${settingsData.year}`;
    return this.db!.put('schoolSettings', { ...settingsData, id: key } as any);
  }

async getSchoolSettings(term: string, year: number) {
    await this.ensureInit();
    const key = `${term.replace(/\s+/g, '')}_${year}`;
    return this.db!.get('schoolSettings', key);
  }

  async getAllSchoolSettings() {
    await this.ensureInit();
    return this.db!.getAll('schoolSettings');
  }

  // SCHOOL
  async getAllSchools() {
    await this.ensureInit();
    return this.db!.getAll('school');
  }

  async addSchool(schoolData: SchoolEntity) {
    await this.ensureInit();
    return this.db!.add('school', schoolData);
  }

  async updateSchool(schoolData: SchoolEntity) {
    await this.ensureInit();
    return this.db!.put('school', schoolData);
  }

  async getSchool(id: number) {
    await this.ensureInit();
    return this.db!.get('school', id);
  }

  // USERS - User authentication and management
  async addUser(userData: UserEntity) {
    await this.ensureInit();
    return this.db!.add('users', userData);
  }

  async updateUser(userData: UserEntity) {
    await this.ensureInit();
    return this.db!.put('users', userData);
  }

  async getUserByUsername(username: string) {
    await this.ensureInit();
    const allUsers = await this.db!.getAll('users');
    return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async getUser(id: number) {
    await this.ensureInit();
    return this.db!.get('users', id);
  }

  async getAllUsers() {
    await this.ensureInit();
    return this.db!.getAll('users');
  }

  async deleteUser(id: number) {
    await this.ensureInit();
    return this.db!.delete('users', id);
  }

  async userExists(username: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    return !!user;
  }

  // CLEAR ALL DATA (for testing/reset)
  async clearAll() {
    await this.ensureInit();
    const tx = this.db!.transaction(
      ['classes', 'learners', 'subjects', 'testScores', 'learnerRankings', 'schoolSettings', 'school', 'users', 'subscriptions', 'grades', 'classSubjectCrossRef'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('classes').clear(),
      tx.objectStore('learners').clear(),
      tx.objectStore('subjects').clear(),
      tx.objectStore('testScores').clear(),
      tx.objectStore('learnerRankings').clear(),
      tx.objectStore('schoolSettings').clear(),
      tx.objectStore('school').clear(),
      tx.objectStore('users').clear(),
      tx.objectStore('subscriptions').clear(),
      tx.objectStore('grades').clear(),
      tx.objectStore('classSubjectCrossRef').clear(),
    ]);
  }
}

// Export singleton instance
export const db = new RankItDatabase();