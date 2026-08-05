type TransactionTraceSource = 'UI' | 'owner sync' | 'replay' | 'snapshot' | 'queue' | 'local storage';
type TransactionTraceInfo = {
  txId: string;
  functionName: string;
  caller: string;
  reason: string;
  source: TransactionTraceSource;
};

const TRACE_TX_ID = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('traceTxId') : null;

let TRACE_SEQUENCE = 0;

function deepClone<T>(obj: T): T {
  try {
    // structuredClone exists in modern browsers
    // @ts-ignore
    if (typeof structuredClone === 'function') return structuredClone(obj);
  } catch (e) {}
  // Fallback
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj as T;
  }
}

function diffFields(prev: any, next: any) {
  if (!prev && !next) return [];
  const keys = new Set<string>();
  if (prev) Object.keys(prev).forEach((k) => keys.add(k));
  if (next) Object.keys(next).forEach((k) => keys.add(k));
  const changed: string[] = [];
  keys.forEach((k) => {
    const a = prev ? prev[k] : undefined;
    const b = next ? next[k] : undefined;
    try {
      if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(k);
    } catch (e) {
      if (a !== b) changed.push(k);
    }
  });
  return changed;
}

export function traceEvent(traceInfo: TransactionTraceInfo, previousTx: any | null, nextTx: any | null) {
  if (!TRACE_TX_ID || TRACE_TX_ID !== traceInfo.txId) return;
  TRACE_SEQUENCE += 1;
  const seq = TRACE_SEQUENCE;
  const timestamp = new Date().toISOString();
  const prevSnap = previousTx ? deepClone(previousTx) : null;
  const nextSnap = nextTx ? deepClone(nextTx) : null;
  const changed = diffFields(prevSnap, nextSnap);

  try {
    console.groupCollapsed(`TRACE #${seq} ${traceInfo.functionName} ${traceInfo.txId} @ ${timestamp}`);
    console.log('sequence:', seq);
    console.log('timestamp:', timestamp);
    console.log('function:', traceInfo.functionName);
    console.log('txId:', traceInfo.txId);
    console.log('caller:', traceInfo.caller);
    console.log('reason:', traceInfo.reason);
    console.log('source:', traceInfo.source);
    console.log('previousSnapshot:', prevSnap);
    console.log('nextSnapshot:', nextSnap);
    console.log('changedFields:', changed);
    console.groupEnd();
  } catch (e) {}

  // Also store into a global buffer for programmatic retrieval (immutable snapshots)
  try {
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__TRACE_EVENTS__ = window.__TRACE_EVENTS__ || [];
      // @ts-ignore
      window.__TRACE_EVENTS__.push({
        sequence: seq,
        timestamp,
        functionName: traceInfo.functionName,
        txId: traceInfo.txId,
        caller: traceInfo.caller,
        reason: traceInfo.reason,
        source: traceInfo.source,
        previousSnapshot: prevSnap,
        nextSnapshot: nextSnap,
        changedFields: changed,
      });
    }
  } catch (e) {}
}

export { TRACE_TX_ID };
