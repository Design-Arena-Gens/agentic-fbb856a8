"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { differenceInMilliseconds, format } from "date-fns";

type NotificationManagerProps = {
  planName: string;
  nextGoalDate?: Date | null;
};

const ensureServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration;
};

export const NotificationManager = ({
  planName,
  nextGoalDate,
}: NotificationManagerProps) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification === "undefined" ? "denied" : Notification.permission,
  );
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const isSupported = typeof window !== "undefined" && "Notification" in window;
  const formattedDate = useMemo(
    () => (nextGoalDate ? format(nextGoalDate, "PPPP") : null),
    [nextGoalDate],
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setStatus("Notifications are not supported on this device.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setStatus("Notifications require permission to be useful.");
      return;
    }
    await ensureServiceWorker();
    setStatus("Notifications enabled. We'll remind you about upcoming goals.");
  }, [isSupported]);

  const scheduleReminder = useCallback(async () => {
    if (!nextGoalDate) {
      setStatus("No goal scheduled.");
      return;
    }

    if (permission !== "granted") {
      setStatus("Please enable notifications first.");
      return;
    }

    try {
      const registration = await ensureServiceWorker();
      const delay = Math.max(
        differenceInMilliseconds(nextGoalDate, new Date()),
        5_000,
      );

      setStatus(
        `Reminder set for ${format(nextGoalDate, "PPpp")} (fires in ${Math.round(delay / 60000)} minutes).`,
      );

      setTimeout(() => {
        registration.showNotification("Self Study Reminder", {
          body: `Time for today's "${planName}" study session.`,
          icon: "/favicon.ico",
          tag: `${planName}-${nextGoalDate.getTime()}`,
        });
      }, delay);
    } catch (error) {
      setStatus("Unable to schedule notifications in this browser.");
      console.error(error);
    }
  }, [nextGoalDate, permission, planName]);

  if (!isSupported) {
    return (
      <p className="text-sm text-slate-500">
        Your device does not support study reminders.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            Daily reminder
          </p>
          {formattedDate ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Next study block scheduled for {formattedDate}
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create a study plan to enable reminders.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {permission !== "granted" ? (
            <Button variant="secondary" onClick={requestPermission}>
              Enable reminders
            </Button>
          ) : (
            <Button variant="secondary" onClick={scheduleReminder}>
              Schedule next reminder
            </Button>
          )}
        </div>
      </div>
      {status && (
        <p className="mt-3 text-sm text-blue-600 dark:text-blue-400">{status}</p>
      )}
    </div>
  );
};
