import { useStore } from '../store';

export const DeadlineWatchdog = () => {
  const { grants, events } = useStore();
  const allDeadlines = useMemo(() => {
    const items = [];
    grants.filter(g => g.deadline && !["declined","closeout","awarded","active"].includes(g.stage)).forEach(g => {
      items.push({ id:g.id, title:g.title, date:g.deadline, type:"grant_deadline", stage:g.stage, amount:g.amount, agency:g.agency, source:"grant" });
    });
    (events || []).forEach(e => {
      items.push({ id:e.id, title:e.title, date:e.date, type:e.type, source:"event" });
    });
    grants.filter(g => g.awardData?.period?.end && ["awarded","active"].includes(g.stage)).forEach(g => {
      items.push({ id:`end_${g.id}`, title:`Award period ends: ${g.title?.slice(0,30)}`, date:g.awardData.period.end, type:"period_end", source:"award" });
    });
    return items.sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [grants, events]);

  const overdue = allDeadlines.filter(d => daysUntil(d.date) < 0);
  const critical = allDeadlines.filter(d => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
  const urgent = allDeadlines.filter(d => daysUntil(d.date) > 3 && daysUntil(d.date) <= 7);
  const upcoming = allDeadlines.filter(d => daysUntil(d.date) > 7 && daysUntil(d.date) <= 30);
  const later = allDeadlines.filter(d => daysUntil(d.date) > 30);

  const renderSection = (title, items, icon, color) => {
    if (items.length === 0) return null;
    return (
      <Card style={{ marginBottom:12, borderColor: color+"33" }}>
        <div style={{ fontSize:13, fontWeight:600, color, marginBottom:8 }}>{icon} {title} ({items.length})</div>
        {items.map(d => (
          <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:12, color:T.text }}>{d.title?.slice(0,45)}</div>
              <div style={{ fontSize:10, color:T.mute }}>{d.agency || d.type}{d.stage ? ` · ${STAGE_MAP[d.stage]?.label}` : ""}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:12, fontWeight:600, color }}>{daysUntil(d.date) < 0 ? `${Math.abs(daysUntil(d.date))}d overdue` : `${daysUntil(d.date)}d`}</div>
              <div style={{ fontSize:10, color:T.mute }}>{fmtDate(d.date)}</div>
            </div>
          </div>
        ))}
      </Card>
    );
  };

  return (
    <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 24, padding: "8px", background: `${T.red}11`, borderRadius: "8px" }}>⏰</div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Deadline Watchdog</h2>
          <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Monitor critical deadlines across your entire grant portfolio.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <Card><Stat label="Overdue" value={overdue.length} color={T.red} /></Card>
        <Card><Stat label="Critical (≤3d)" value={critical.length} color={T.orange} /></Card>
        <Card><Stat label="Urgent (≤7d)" value={urgent.length} color={T.yellow} /></Card>
        <Card><Stat label="Upcoming (≤30d)" value={upcoming.length} color={T.blue} /></Card>
        <Card><Stat label="Later" value={later.length} color={T.green} /></Card>
      </div>

      {allDeadlines.length === 0 ? <Empty icon="⏰" title="No deadlines tracked" sub="Add deadlines to your grants to see them here" /> : (
        <div>
          {renderSection("OVERDUE", overdue, "🚨", T.red)}
          {renderSection("CRITICAL — Due within 3 days", critical, "🔴", T.orange)}
          {renderSection("URGENT — Due within 7 days", urgent, "🟡", T.yellow)}
          {renderSection("UPCOMING — Due within 30 days", upcoming, "🔵", T.blue)}
          {renderSection("LATER — 30+ days", later, "🟢", T.green)}
        </div>
      )}

      <Card style={{ marginTop: 24, borderTop: `4px solid ${T.blue}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>📅 This Week</div>
        {(() => {
          const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const today = new Date();
          const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4 }}>
              {days.map((day, i) => {
                const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const dayDeadlines = allDeadlines.filter(dl => dl.date?.startsWith(dateStr));
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div key={i} style={{ padding:8, borderRadius:6, background: isToday ? T.amber+"10" : T.panel, border:`1px solid ${isToday ? T.amber+"44" : T.border}`, minHeight:60 }}>
                    <div style={{ fontSize:10, fontWeight:600, color: isToday ? T.amber : T.mute, marginBottom:4 }}>{day} {d.getDate()}</div>
                    {dayDeadlines.map(dl => (
                      <div key={dl.id} style={{ fontSize:8, padding:"2px 4px", borderRadius:3, background:T.red+"15", color:T.red, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        ⏰ {dl.title?.slice(0,12)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    </div>
  );
};
