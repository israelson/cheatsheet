import { VAR_KEYS } from "./data/commands";

export function applyVars(cmd, vars) {
  return VAR_KEYS.reduce((acc, k) => acc.replaceAll(`{${k}}`, vars[k] || `{${k}}`), cmd);
}

export function formatTime(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function formatAIResult(text) {
  if (!text) return "";
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => `<pre>${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e6edf3'>$1</strong>")
    .replace(/###?\s(.+)/g, "<h3>$1</h3>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}
