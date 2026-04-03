// ===== useActivityLog HOOK =====
// Custom hook to manage real-time activities in HomeScreen

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  getRecentActivities,
  formatRelativeTime,
  cleanupOldActivities,
} from "../lib/activityLogger";

export const useActivityLog = (schoolId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Load initial activities ───
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const recentActivities = await getRecentActivities(schoolId, 10);
      setActivities(recentActivities);
      // Cleanup old activities (older than 30 days)
      await cleanupOldActivities(schoolId, 30);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  // ─── Listen for new activities ───
  useEffect(() => {
    // Load initial activities
    loadActivities();

    // Listen for activity additions
    const handleActivityAdded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newActivity: Activity = customEvent.detail;

      setActivities((prev) => {
        // Add new activity to top and keep only 10 most recent
        return [newActivity, ...prev].slice(0, 10);
      });
    };

    window.addEventListener("activityAdded", handleActivityAdded);

    return () => {
      window.removeEventListener("activityAdded", handleActivityAdded);
    };
  }, [loadActivities]);

  return {
    activities,
    loading,
    refreshActivities: loadActivities,
  };
};

// ─── Helper to format activity display ───
export const getActivityIcon = (type: Activity["type"]) => {
  const icons = {
    score_entered: "📝",
    student_added: "👤",
    report_generated: "📊",
    sms_sent: "💬",
    class_added: "📚",
  };
  return icons[type] || "📌";
};

export const getActivityColor = (type: Activity["type"], t: any) => {
  const colors = {
    score_entered: t.accent,
    student_added: t.accent,
    report_generated: t.orange,
    sms_sent: t.red,
    class_added: t.accent,
  };
  return colors[type] || t.accent;
};