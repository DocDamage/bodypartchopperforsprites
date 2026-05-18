import { deepClone } from '../core/constants.js';

export function createHistoryState(limit = 60) {
  return { past: [], future: [], limit };
}

export function pushHistory(history, snapshot) {
  const serialized = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
  const last = history.past[history.past.length - 1];
  if (serialized === last) return history;
  history.past.push(serialized);
  if (history.past.length > history.limit) history.past.shift();
  history.future.length = 0;
  return history;
}

export function canUndo(history) {
  return Boolean(history?.past?.length);
}

export function canRedo(history) {
  return Boolean(history?.future?.length);
}

export function popUndo(history, currentSnapshot) {
  if (!canUndo(history)) return null;
  history.future.push(JSON.stringify(currentSnapshot));
  return JSON.parse(history.past.pop());
}

export function popRedo(history, currentSnapshot) {
  if (!canRedo(history)) return null;
  history.past.push(JSON.stringify(currentSnapshot));
  return JSON.parse(history.future.pop());
}

export function cloneForHistory(value) {
  return deepClone(value);
}
