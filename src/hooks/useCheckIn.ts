import { useState, useEffect, useCallback } from "react";

interface Contact {
  name: string;
  email: string;
}

interface CheckInData {
  history: Date[];
  contact: Contact;
  lastCheckIn: Date | null;
}

const STORAGE_KEY = "dead-yet-app-data";

const loadData = (): CheckInData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        history: parsed.history.map((d: string) => new Date(d)),
        contact: parsed.contact || { name: "", email: "" },
        lastCheckIn: parsed.lastCheckIn ? new Date(parsed.lastCheckIn) : null,
      };
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return {
    history: [],
    contact: { name: "", email: "" },
    lastCheckIn: null,
  };
};

const saveData = (data: CheckInData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      history: data.history.map(d => d.toISOString()),
      contact: data.contact,
      lastCheckIn: data.lastCheckIn?.toISOString() || null,
    }));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
};

export function useCheckIn() {
  const [data, setData] = useState<CheckInData>(loadData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const isCheckedInToday = useCallback(() => {
    if (!data.lastCheckIn) return false;
    const today = new Date();
    const lastCheckIn = new Date(data.lastCheckIn);
    return (
      lastCheckIn.getFullYear() === today.getFullYear() &&
      lastCheckIn.getMonth() === today.getMonth() &&
      lastCheckIn.getDate() === today.getDate()
    );
  }, [data.lastCheckIn]);

  const getDaysMissed = useCallback(() => {
    if (!data.lastCheckIn) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCheckIn = new Date(data.lastCheckIn);
    lastCheckIn.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastCheckIn.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [data.lastCheckIn]);

  const getConsecutiveDays = useCallback(() => {
    if (data.history.length === 0) return 0;

    const sortedHistory = [...data.history].sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    let consecutive = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const checkDate = new Date(sortedHistory[i]);
      checkDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkDate.getTime() === expectedDate.getTime()) {
        consecutive++;
      } else if (i === 0 && checkDate.getTime() === today.getTime() - 86400000) {
        // If last check-in was yesterday, start counting from yesterday
        const yesterdayExpected = new Date(today);
        yesterdayExpected.setDate(today.getDate() - 1 - i);
        if (checkDate.getTime() === yesterdayExpected.getTime()) {
          consecutive++;
        }
      } else {
        break;
      }
    }

    return consecutive;
  }, [data.history]);

  const checkIn = useCallback(async () => {
    if (isCheckedInToday()) return;

    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    setData(prev => ({
      ...prev,
      history: [...prev.history, now],
      lastCheckIn: now,
    }));

    setIsLoading(false);
  }, [isCheckedInToday]);

  const updateContact = useCallback((contact: Contact) => {
    setData(prev => ({
      ...prev,
      contact,
    }));
  }, []);

  return {
    history: data.history,
    contact: data.contact,
    lastCheckIn: data.lastCheckIn,
    isCheckedInToday: isCheckedInToday(),
    daysMissed: getDaysMissed(),
    consecutiveDays: getConsecutiveDays(),
    isLoading,
    checkIn,
    updateContact,
  };
}
