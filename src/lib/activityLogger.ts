// ===== ACTIVITY LOGGER UTILITY =====
// Handles all activity logging to IndexedDB

export interface Activity {
  id?: string;
  type: "score_entered" | "student_added" | "report_generated" | "sms_sent" | "class_added";
  title: string;
  subtitle: string;
  timestamp: number;
  schoolId: string;
  userId?: string;
}

// ─── Initialize IndexedDB ───
export const initActivityDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RankitzDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("activities")) {
        const store = db.createObjectStore("activities", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("schoolId", "schoolId", { unique: false });
      }
    };
  });
};

// ─── Add Activity to IndexedDB ───
export const addActivity = async (activity: Activity): Promise<void> => {
  const db = await initActivityDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["activities"], "readwrite");
    const store = transaction.objectStore("activities");
    const request = store.add({
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Trigger custom event so HomeScreen listens for changes
      window.dispatchEvent(
        new CustomEvent("activityAdded", {
          detail: { ...activity, id: request.result as string },
        })
      );
      resolve();
    };
  });
};

// ─── Get Recent Activities ───
export const getRecentActivities = async (
  schoolId: string,
  limit: number = 10
): Promise<Activity[]> => {
  const db = await initActivityDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["activities"], "readonly");
    const store = transaction.objectStore("activities");
    const index = store.index("schoolId");
    const range = IDBKeyRange.only(schoolId);
    const request = index.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const activities = (request.result as Activity[])
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      resolve(activities);
    };
  });
};

// ─── Delete Old Activities (Cleanup) ───
export const cleanupOldActivities = async (
  schoolId: string,
  daysOld: number = 30
): Promise<void> => {
  const db = await initActivityDB();
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["activities"], "readwrite");
    const store = transaction.objectStore("activities");
    const index = store.index("schoolId");
    const range = IDBKeyRange.only(schoolId);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const activities = request.result as Activity[];
      activities.forEach((activity) => {
        if (activity.timestamp < cutoffTime) {
          store.delete(activity.id!);
        }
      });
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
};

// ─── Clear All Activities for School ───
export const clearActivities = async (schoolId: string): Promise<void> => {
  const db = await initActivityDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["activities"], "readwrite");
    const store = transaction.objectStore("activities");
    const index = store.index("schoolId");
    const range = IDBKeyRange.only(schoolId);
    const request = index.getAll(range);

    request.onsuccess = () => {
      const activities = request.result as Activity[];
      activities.forEach((activity) => {
        store.delete(activity.id!);
      });
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
};

// ─── Format Relative Time ───
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  
  // Format as date
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};