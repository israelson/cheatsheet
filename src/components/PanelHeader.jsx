import { I } from "./Icons";

export function PanelHeader({ title, color, onClose, extra }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 14px", borderBottom: "1px solid #21262d", marginBottom: 16, position: "sticky", top: 0, background: "#0d1117", zIndex: 1 }}>
      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, color, letterSpacing: ".05em" }}>{title}</span>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {extra}
        <button className="btn" onClick={onClose} style={{ color: "#8b949e" }}><I n="close" s={14} /></button>
      </div>
    </div>
  );
}
