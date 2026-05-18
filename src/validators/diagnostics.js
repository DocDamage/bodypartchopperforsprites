export function createDiagnostic(severity, title, message, extra = {}) {
  return {
    id: extra.id || `${severity}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    severity,
    title,
    message,
    at: extra.at || new Date().toISOString(),
    ...extra
  };
}

export function countDiagnostics(diagnostics = []) {
  return {
    pass: diagnostics.filter((item) => item.severity === 'pass').length,
    warning: diagnostics.filter((item) => item.severity === 'warning').length,
    fail: diagnostics.filter((item) => item.severity === 'fail').length
  };
}

export function checkQaGate(qa = {}) {
  const counts = countDiagnostics(qa.diagnostics || []);
  if (qa.blockFailures !== false && counts.fail > 0) {
    return { ok: false, reason: `Blocked by ${counts.fail} QA failure(s).` };
  }
  if (qa.allowWarnings === false && counts.warning > 0) {
    return { ok: false, reason: `Blocked by ${counts.warning} QA warning(s).` };
  }
  return { ok: true, reason: 'QA gate passed.' };
}

export function summarizeDiagnostics(diagnostics = []) {
  const counts = countDiagnostics(diagnostics);
  return {
    ...counts,
    total: diagnostics.length,
    passed: counts.fail === 0 && counts.warning === 0
  };
}

export function maxRange(values = []) {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}
