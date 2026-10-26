import { useEffect, useState } from "react";
import { STORIES } from "../constants";
import { displayTitle } from "./text";
import { dayOf, myClasses, type ClassError, type MyClass } from "./classes";
import { daysBetween, localDay } from "./progress";

/* The learner's classes and the labels both sides of the cabinet share. */

const cacheKey = (userId: string) => `ertegi_my_classes_${userId}`;
function readCache(userId: string): MyClass[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(cacheKey(userId)) || "null");
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
function writeCache(userId: string, v: MyClass[]) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(v)); } catch { /* storage blocked */ }
}

// Home, Profile and the join sheet share one list; a join or leave refreshes all of them.
const listeners = new Set<() => unknown>();
export const refreshClasses = () => listeners.forEach((f) => f());

export function useMyClasses(userId: string) {
  const [classes, setClasses] = useState<MyClass[] | null>(() => readCache(userId));
  const [error, setError] = useState<ClassError | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => myClasses().then((res) => {
      if (!live) return;
      if (res.ok) {
        const list = Array.isArray(res.data) ? res.data : [];
        setClasses(list);
        setError(null);
        writeCache(userId, list);
      } else {
        setError(res.error);
      }
    });
    void load();
    listeners.add(load);
    const online = () => void load();
    window.addEventListener("online", online);
    return () => { live = false; listeners.delete(load); window.removeEventListener("online", online); };
  }, [userId]);
  return { classes, error };
}

export const stepLabel = (step: string, kk: boolean) =>
  step === "quiz" ? (kk ? "Сынақ" : "Quiz") : `${step} ${kk ? "деңгей" : "level"}`;
export const storyTitle = (id: string) => {
  const s = STORIES.find((x: { id: string }) => x.id === id);
  return s ? displayTitle(s.title) : id;
};

export function dueText(dueAt: string | null, kk: boolean): string {
  if (!dueAt) return kk ? "Мерзімсіз" : "No due date";
  const days = daysBetween(localDay(), dayOf(dueAt));
  if (days < 0) return kk ? `Мерзімі өтті (${dayOf(dueAt).slice(5).split("-").reverse().join(".")})` : `Overdue (${dayOf(dueAt).slice(5).split("-").reverse().join(".")})`;
  if (days === 0) return kk ? "Бүгін" : "Due today";
  if (days === 1) return kk ? "Ертеңге дейін" : "Due tomorrow";
  return kk ? `${days} күн қалды` : `${days} days left`;
}

