type EventHandler = (payload: any) => void;
const listeners: Record<string, EventHandler[]> = {};

export const platformBus = {
  on(event: string, handler: EventHandler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
    return () => { listeners[event] = listeners[event].filter(h => h !== handler); };
  },
  emit(event: string, payload: any) {
    (listeners[event] || []).forEach(h => h(payload));
  },
};

export const PLATFORM_EVENTS = {
  CONTRACT_SIGNED: 'contract:signed',
  CREATE_BILLING_FROM_CONTRACT: 'billing:createFromContract',
};
