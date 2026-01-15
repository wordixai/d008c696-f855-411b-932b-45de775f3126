import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Contact {
  name: string;
  email: string;
}

interface CheckInData {
  history: Date[];
  contact: Contact;
  lastCheckIn: Date | null;
}

const DEVICE_ID_KEY = "dead-yet-device-id";

// 获取或创建设备ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export function useCheckIn() {
  const [data, setData] = useState<CheckInData>({
    history: [],
    contact: { name: "", email: "" },
    lastCheckIn: null,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化：获取或创建用户
  useEffect(() => {
    const initUser = async () => {
      const deviceId = getDeviceId();

      try {
        // 尝试获取现有用户
        let { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("device_id", deviceId)
          .single();

        let currentUserId: string;

        if (!existingUser) {
          // 创建新用户
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({ device_id: deviceId })
            .select("id")
            .single();

          if (createError) throw createError;
          currentUserId = newUser.id;
        } else {
          currentUserId = existingUser.id;
        }

        setUserId(currentUserId);

        // 加载签到历史
        const { data: checkIns } = await supabase
          .from("check_ins")
          .select("checked_at")
          .eq("user_id", currentUserId)
          .order("checked_at", { ascending: false })
          .limit(30);

        // 加载紧急联系人
        const { data: contactData } = await supabase
          .from("emergency_contacts")
          .select("name, email")
          .eq("user_id", currentUserId)
          .single();

        const history = (checkIns || []).map((ci) => new Date(ci.checked_at));
        const lastCheckIn = history.length > 0 ? history[0] : null;

        setData({
          history,
          contact: contactData || { name: "", email: "" },
          lastCheckIn,
        });
      } catch (error) {
        console.error("Failed to initialize user:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initUser();
  }, []);

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

    const sortedHistory = [...data.history].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
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
    if (!userId || isCheckedInToday()) return;

    setIsLoading(true);

    try {
      const now = new Date();

      const { error } = await supabase.from("check_ins").insert({
        user_id: userId,
        checked_at: now.toISOString(),
      });

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        history: [now, ...prev.history],
        lastCheckIn: now,
      }));
    } catch (error) {
      console.error("Failed to check in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isCheckedInToday]);

  const updateContact = useCallback(
    async (contact: Contact) => {
      if (!userId) return;

      try {
        // Upsert emergency contact
        const { error } = await supabase.from("emergency_contacts").upsert(
          {
            user_id: userId,
            name: contact.name,
            email: contact.email,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

        if (error) throw error;

        setData((prev) => ({
          ...prev,
          contact,
        }));
      } catch (error) {
        console.error("Failed to update contact:", error);
        throw error;
      }
    },
    [userId]
  );

  return {
    history: data.history,
    contact: data.contact,
    lastCheckIn: data.lastCheckIn,
    isCheckedInToday: isCheckedInToday(),
    daysMissed: getDaysMissed(),
    consecutiveDays: getConsecutiveDays(),
    isLoading: isLoading || !isInitialized,
    checkIn,
    updateContact,
  };
}
