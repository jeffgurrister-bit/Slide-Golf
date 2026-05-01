import { C, btnS } from "../utils/theme.js";

// Format a notification doc into { emoji, title, subtitle } for display.
function formatNotification(n) {
  const p = n.payload || {};
  switch (n.type) {
    case "your_turn":
      return {
        emoji: "🎯",
        title: `Your turn vs ${p.opponent || "opponent"}`,
        subtitle: `${p.leagueName || "League"}${p.roundType && p.roundType !== "regular" ? ` · ${p.roundType}` : ""}`
      };
    case "results_unlocked":
      return {
        emoji: "🎉",
        title: `Match results unlocked`,
        subtitle: `${p.leagueName || "League"}${p.roundType && p.roundType !== "regular" ? ` · ${p.roundType}` : ""} — tap home to reveal`
      };
    case "playoffs_created":
      return {
        emoji: "🏆",
        title: `Playoffs are here`,
        subtitle: `${p.leagueName || "League"} regular season is complete`
      };
    case "season_complete":
      return {
        emoji: "🏁",
        title: `Season complete`,
        subtitle: `${p.leagueName || "League"} has ended`
      };
    case "course_record":
      return {
        emoji: "⛳",
        title: `New course record at ${p.course || "a course"}`,
        subtitle: `${p.player || "Someone"} shot ${p.score}${p.oldScore != null ? ` (was ${p.oldScore})` : ""}`
      };
    case "match_forfeited":
      return {
        emoji: "❌",
        title: `Match forfeited`,
        subtitle: `${p.leagueName || "League"} — ${p.winner === "Tie" ? "ruled a tie" : `${p.winner} declared winner`}${p.manual ? " by creator" : " (deadline missed)"}`
      };
    default:
      return { emoji: "🔔", title: "Notification", subtitle: n.type };
  }
}

// Returns { tab, openLeague } describing where to navigate when tapped.
function notificationTarget(n) {
  const p = n.payload || {};
  switch (n.type) {
    case "your_turn":
    case "playoffs_created":
    case "season_complete":
    case "match_forfeited":
      return { tab: "league", openLeague: p.leagueId || null };
    case "results_unlocked":
      return { tab: "home" };
    case "course_record":
      return { tab: "courses" };
    default:
      return { tab: "home" };
  }
}

const fmtAge = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function NotificationsPanel({
  notifications, onClose, markRead, markAllRead, deleteNotification,
  setTab, setSelectedLeague
}) {
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 12px 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, maxWidth: 480, width: "100%", maxHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>🔔 Notifications</span>
            {unreadCount > 0 && <span style={{ background: C.red, color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {unreadCount > 0 && <button onClick={markAllRead} style={{ ...btnS(false), padding: "4px 10px", fontSize: 11 }}>Mark all read</button>}
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => {
              const f = formatNotification(n);
              return (
                <div key={n.id} onClick={async () => {
                  if (!n.read) await markRead(n.id);
                  const t = notificationTarget(n);
                  if (t.openLeague != null && setSelectedLeague) setSelectedLeague(t.openLeague);
                  if (t.tab) setTab(t.tab);
                  onClose();
                }} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, cursor: "pointer", background: n.read ? "transparent" : "rgba(74,170,74,0.05)", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 20, lineHeight: 1.2, marginTop: 2 }}>{f.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, color: C.text }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.subtitle}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{fmtAge(n.createdAt)}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.greenLt, marginTop: 8 }} />}
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, opacity: 0.5, padding: 4 }}>×</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
