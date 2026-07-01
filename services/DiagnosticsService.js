// services/DiagnosticsService.js
//
// Additive, self-contained diagnostics for release/TestFlight builds, where a
// non-technical tester CANNOT reach the JS console (Dev Menu, LogBox, and
// DevTools are disabled in release builds, and console output goes to native
// device logs that require Xcode + USB to read).
//
// It (1) mirrors every console.* call into an in-memory ring buffer and
// (2) formats a shareable plain-text report the tester can send back via the
// native share sheet. It changes NO existing behavior: console still logs
// exactly as before — we only additionally record it.

import { Platform, Share } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

const MAX_ENTRIES = 300;      // ring-buffer cap (bounded memory)
const REPORT_LOG_LINES = 60;  // most-recent lines included in the shared report

const buffer = [];
let installed = false;
const original = {};

const formatArg = (arg) => {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  if (typeof arg === 'string') return arg;
  try { return JSON.stringify(arg); } catch { return String(arg); }
};

const record = (level, args) => {
  try {
    const msg = Array.from(args).map(formatArg).join(' ');
    buffer.push({ t: Date.now(), level, msg });
    if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
  } catch {
    // Diagnostics must never break the app or the original console call.
  }
};

// Wrap console.* so existing logs are captured without editing any call site.
// Idempotent and non-recursive: the wrapper calls the *original* method, never
// the wrapped one. Safe to call more than once (e.g. across fast refresh).
export const installConsoleCapture = () => {
  if (installed) return;
  installed = true;
  ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
    if (typeof console[level] !== 'function') return;
    original[level] = console[level].bind(console);
    console[level] = (...args) => {
      record(level, args);
      original[level](...args);
    };
  });
  record('info', ['[diagnostics] console capture installed']);
};

const clerkInstance = () => {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (!key) return 'MISSING (no publishable key)';
  if (key.startsWith('pk_live')) return 'PRODUCTION (pk_live)';
  if (key.startsWith('pk_test')) return 'DEVELOPMENT (pk_test)';
  return `unknown (${key.slice(0, 7)}…)`;
};

const redirectUrl = () => {
  try { return Linking.createURL('/(tabs)/home'); } catch { return 'unavailable'; }
};

// `context` carries values that only exist inside React (Clerk auth + network),
// passed in by DiagnosticsButton so this module stays hook-free and importable
// anywhere (including at module scope in _layout).
export const buildReport = (context = {}) => {
  const { auth = {}, user = {}, network = {} } = context;
  const now = new Date();
  let tz = 'unknown';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Hermes Intl fallback */ }

  const lines = [];
  lines.push('===== TIDALLY DIAGNOSTICS =====');
  lines.push(`Generated: ${now.toISOString()} (${tz})`);
  lines.push('');
  lines.push('— App —');
  lines.push(`Version: ${Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?'} (build ${Constants.nativeBuildVersion ?? '?'})`);
  lines.push(`Runtime: Expo SDK ${Constants.expoConfig?.sdkVersion ?? '?'} · ownership=${Constants.appOwnership ?? 'standalone'}`);
  lines.push(`Platform: ${Platform.OS} ${Platform.Version}${Constants.deviceName ? ` · ${Constants.deviceName}` : ''}`);
  lines.push('');
  lines.push('— Auth (Clerk) —');
  lines.push(`Instance: ${clerkInstance()}`);
  lines.push(`isLoaded: ${auth.isLoaded ?? '?'} · isSignedIn: ${auth.isSignedIn ?? '?'}`);
  lines.push(`userId: ${auth.userId ?? '—'} · sessionId: ${auth.sessionId ?? '—'}`);
  lines.push(`email: ${user.email ?? '—'}`);
  lines.push(`OAuth redirect: ${redirectUrl()}`);
  lines.push('');
  lines.push('— Network —');
  lines.push(`connected: ${network.isConnected ?? '?'} · internetReachable: ${network.isInternetReachable ?? '?'} · type: ${network.connectionType ?? '?'}`);
  lines.push(`lastOnline: ${network.lastOnline ? new Date(network.lastOnline).toISOString() : '—'}`);
  lines.push('');
  lines.push(`— Recent logs (last ${REPORT_LOG_LINES} of ${buffer.length}) —`);
  const recent = buffer.slice(-REPORT_LOG_LINES);
  if (recent.length === 0) {
    lines.push('(no logs captured)');
  } else {
    recent.forEach((e) => {
      lines.push(`[${new Date(e.t).toLocaleTimeString()}] ${e.level.toUpperCase()}: ${e.msg}`);
    });
  }
  lines.push('===== END =====');
  return lines.join('\n');
};

export const shareReport = async (context) => {
  const report = buildReport(context);
  try {
    await Share.share({ message: report });
  } catch (error) {
    original.error?.('[diagnostics] share failed:', error);
  }
  return report;
};

export default { installConsoleCapture, buildReport, shareReport };
