import { useSyncExternalStore } from "react";

const storageKey = "nextra-tabs";
let callbacks: Array<() => void> = [];

const emitChange = () => {
  for (const callback of callbacks) {
    callback();
  }
};

const getStorage = () => {
  return sessionStorage.getItem(storageKey);
};

export const parseStorage = (rawStorage: string | null | undefined) => {
  return rawStorage ? JSON.parse(rawStorage) as Record<string, string> : {};
};

export const setStorage = (key: string, value: string | null) => {
  const storageObj = parseStorage(getStorage());
  const newStorage = JSON.stringify({ ...storageObj, [key]: value });

  sessionStorage.setItem(storageKey, newStorage);
  emitChange();
};

export const subscribe: Parameters<typeof useSyncExternalStore>[0] = (callback) => {
  const handler = (e: StorageEvent) => {
    if (e.storageArea === sessionStorage) {
      callback();
    }
  };

  window.addEventListener("storage", handler);
  callbacks = [...callbacks, callback];

  return () => {
    window.removeEventListener("storage", handler);
    callbacks = callbacks.filter((c) => c !== callback);
  };
};

export const getSnapshot = () => {
  return getStorage();
};

export function getServerSnapshot() {
  return undefined;
}
