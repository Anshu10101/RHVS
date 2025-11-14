'use client';

import { useEffect, useState } from 'react';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Listener = (state: { promptEvent: BeforeInstallPromptEvent | null; isInstalled: boolean }) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;
const listeners = new Set<Listener>();
let initialized = false;

const notify = () => {
  const snapshot = { promptEvent: deferredPrompt, isInstalled };
  listeners.forEach((listener) => listener(snapshot));
};

const init = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    isInstalled = false;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isInstalled = true;
    notify();
  });
};

export function useInstallPrompt() {
  const [state, setState] = useState<{ promptEvent: BeforeInstallPromptEvent | null; isInstalled: boolean }>({
    promptEvent: null,
    isInstalled: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    init();
    const listener: Listener = (next) => setState(next);
    listeners.add(listener);
    listener({ promptEvent: deferredPrompt, isInstalled });
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const consumePrompt = (outcome?: 'accepted' | 'dismissed') => {
    if (outcome === 'accepted') {
      isInstalled = true;
    }
    if (outcome === 'dismissed') {
      isInstalled = false;
    }
    deferredPrompt = null;
    notify();
  };

  return {
    promptEvent: state.promptEvent,
    isInstalled: state.isInstalled,
    consumePrompt,
  };
}

