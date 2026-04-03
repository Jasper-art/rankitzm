import { useState, useEffect, useCallback } from 'react';
import { db, ClassEntity, LearnerEntity, SubjectEntity, TestScoreEntity } from '../db';

// Custom hook for classes management
export function useClasses() {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const allClasses = await db.getAllClasses();
      setClasses(allClasses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const addClass = useCallback(async (classData: Omit<ClassEntity, 'id'>) => {
    try {
      const id = await db.addClass(classData as ClassEntity);
      const newClass = await db.getClass(id);
      if (newClass) {
        setClasses([...classes, newClass]);
      }
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add class');
      throw err;
    }
  }, [classes]);

  const updateClass = useCallback(async (classData: ClassEntity) => {
    try {
      await db.updateClass(classData);
      setClasses(classes.map(c => c.id === classData.id ? classData : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update class');
      throw err;
    }
  }, [classes]);

  const deleteClass = useCallback(async (id: number) => {
    try {
      await db.deleteClass(id);
      setClasses(classes.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
      throw err;
    }
  }, [classes]);

  const getClassById = useCallback((id: number) => {
    return classes.find(c => c.id === id);
  }, [classes]);

  return {
    classes,
    loading,
    error,
    addClass,
    updateClass,
    deleteClass,
    getClassById,
    refresh: loadClasses,
  };
}

// Custom hook for learners management
export function useLearners() {
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLearners();
  }, []);

  const loadLearners = async () => {
    try {
      setLoading(true);
      const allLearners = await db.getAllLearners();
      setLearners(allLearners);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learners');
    } finally {
      setLoading(false);
    }
  };

  const addLearner = useCallback(async (learnerData: Omit<LearnerEntity, 'id'>) => {
    try {
      const id = await db.addLearner(learnerData as LearnerEntity);
      const newLearner = await db.getLearner(id);
      if (newLearner) {
        setLearners([...learners, newLearner]);
      }
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add learner');
      throw err;
    }
  }, [learners]);

  const updateLearner = useCallback(async (learnerData: LearnerEntity) => {
    try {
      await db.updateLearner(learnerData);
      setLearners(learners.map(l => l.id === learnerData.id ? learnerData : l));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update learner');
      throw err;
    }
  }, [learners]);

  const deleteLearner = useCallback(async (id: number) => {
    try {
      await db.deleteLearner(id);
      setLearners(learners.filter(l => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete learner');
      throw err;
    }
  }, [learners]);

  const getLearnersByClass = useCallback((classId: number) => {
    return learners.filter(l => l.classId === classId);
  }, [learners]);

  const getLearnerById = useCallback((id: number) => {
    return learners.find(l => l.id === id);
  }, [learners]);

  return {
    learners,
    loading,
    error,
    addLearner,
    updateLearner,
    deleteLearner,
    getLearnersByClass,
    getLearnerById,
    refresh: loadLearners,
  };
}

// Custom hook for subjects management
export function useSubjects() {
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const allSubjects = await db.getAllSubjects();
      setSubjects(allSubjects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const addSubject = useCallback(async (subjectData: Omit<SubjectEntity, 'id'>) => {
    try {
      const id = await db.addSubject(subjectData as SubjectEntity);
      const newSubject = await db.getSubject(id);
      if (newSubject) {
        setSubjects([...subjects, newSubject]);
      }
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subject');
      throw err;
    }
  }, [subjects]);

  const updateSubject = useCallback(async (subjectData: SubjectEntity) => {
    try {
      await db.updateSubject(subjectData);
      setSubjects(subjects.map(s => s.id === subjectData.id ? subjectData : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      throw err;
    }
  }, [subjects]);

  const deleteSubject = useCallback(async (id: number) => {
    try {
      await db.deleteSubject(id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      throw err;
    }
  }, [subjects]);

  const getSubjectsByClass = useCallback((classId: number) => {
    return subjects.filter(s => s.classId === classId);
  }, [subjects]);

  const getSubjectById = useCallback((id: number) => {
    return subjects.find(s => s.id === id);
  }, [subjects]);

  return {
    subjects,
    loading,
    error,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByClass,
    getSubjectById,
    refresh: loadSubjects,
  };
}

// Custom hook for test scores management
export function useTestScores() {
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      setLoading(true);
      const allScores = await db.getAllScores();
      setScores(allScores);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  const addScore = useCallback(async (scoreData: TestScoreEntity) => {
    try {
      await db.addScore(scoreData);
      setScores([...scores, scoreData]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add score');
      throw err;
    }
  }, [scores]);

  const updateScore = useCallback(async (scoreData: TestScoreEntity) => {
    try {
      await db.updateScore(scoreData);
      // Update in state (composite key so we match by all key fields)
      setScores(scores.map(s =>
        s.learnerId === scoreData.learnerId &&
        s.subjectId === scoreData.subjectId &&
        s.testType === scoreData.testType &&
        s.term === scoreData.term &&
        s.year === scoreData.year &&
        s.weekNumber === scoreData.weekNumber
          ? scoreData
          : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score');
      throw err;
    }
  }, [scores]);

  const getScoresByLearner = useCallback((learnerId: number) => {
    return scores.filter(s => s.learnerId === learnerId);
  }, [scores]);

  const getScoresByLearnerAndTerm = useCallback((learnerId: number, term: string, year: number) => {
    return scores.filter(s => s.learnerId === learnerId && s.term === term && s.year === year);
  }, [scores]);

  const getScoresBySubject = useCallback((subjectId: number) => {
    return scores.filter(s => s.subjectId === subjectId);
  }, [scores]);

  const getScoresByTestType = useCallback((testType: string) => {
    return scores.filter(s => s.testType === testType);
  }, [scores]);

  const getScoresByClass = useCallback((classId: number, learners: LearnerEntity[]) => {
    const classLearnerIds = learners
      .filter(l => l.classId === classId)
      .map(l => l.id);
    return scores.filter(s => classLearnerIds.includes(s.learnerId));
  }, [scores]);

  return {
    scores,
    loading,
    error,
    addScore,
    updateScore,
    getScoresByLearner,
    getScoresByLearnerAndTerm,
    getScoresBySubject,
    getScoresByTestType,
    getScoresByClass,
    refresh: loadScores,
  };
}