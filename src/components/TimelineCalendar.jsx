import React, { useState, useMemo } from 'react';
import { Card, Btn, Badge, Input, TextArea, Select, Tab, Progress, Modal, MiniBar, Empty } from '../ui';
import { T, uid, fmtDate, daysUntil, STAGE_MAP } from '../globals';

export const TimelineCalendar = ({ grants, events, setEvents }) => {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "deadline", grantId: "", color: T.amber, notes: "" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Merge grant deadlines + custom events
  const allEvents = useMemo(() => {
    const grantEvents = grants.filter(g => g.deadline).map(g => ({
      id: `g_${g.id}`, title: g.title, date: g.deadline, type: "deadline",
      color: STAGE_MAP[g.stage]?.color || T.amber, grantId: g.id, stage: g.stage,
    }));
    return [...grantEvents, ...(events || [])];
  }, [grants, events]);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allEvents.filter(e => e.date?.startsWith(dateStr));
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...(events || []), { ...newEvent, id: uid() }]);
    setNewEvent({ title: "", date: "", type: "milestone", grantId: "", color: T.amber, notes: "" });
    setShowAdd(false);
  };

  const navMonth = (dir) => setCurrentDate(new Date(year, month + dir, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  // Timeline view: next 90 days
  const timelineEvents = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 90 * 86400000);
    return allEvents.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= end;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allEvents]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tab tabs={[{ id: "month", icon: "ðŸ“…", label: "Month" }, { id: "timeline", icon: "ðŸ“Š", label: "Timeline" }, { id: "agenda", icon: "ðŸ“‹", label: "Agenda" }]} active={view} onChange={setView} />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Event</Btn>
      </div>

      {view === "month" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(-1)}>â—€</Btn>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{monthNames[month]} {year}</div>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(1)}>â–¶</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: T.mute, padding: 4, fontWeight: 600 }}>{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty_${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day} style={{
                  padding: 4, minHeight: 60, borderRadius: 6, cursor: "pointer",
                  background: isToday(day) ? T.amber + "15" : dayEvents.length > 0 ? T.card : "transparent",
                  border: isToday(day) ? `1px solid ${T.amber}44` : `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? T.amber : T.sub, marginBottom: 2 }}>{day}</div>
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} style={{ fontSize: 8, padding: "1px 3px", borderRadius: 3, marginBottom: 1, background: e.color + "22", color: e.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.type === "deadline" ? "â°" : "ðŸ“Œ"} {e.title?.slice(0, 15)}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: 8, color: T.mute }}>+{dayEvents.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "timeline" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>ðŸ“Š Next 90 Days</div>
          {timelineEvents.length === 0 ? <div style={{ color: T.mute, fontSize: 12 }}>No events in the next 90 days</div> :
            timelineEvents.map(e => {
              const days = daysUntil(e.date);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.text }}>{e.title?.slice(0, 50)}</div>
                    <div style={{ fontSize: 10, color: T.mute }}>{fmtDate(e.date)} Â· {e.type}</div>
                  </div>
                  <Badge color={days <= 7 ? T.red : days <= 30 ? T.yellow : T.green}>{days}d</Badge>
                </div>
              );
            })
          }
        </Card>
      )}

      {view === "agenda" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>ðŸ“‹ All Events by Date</div>
          {allEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 12, color: T.text }}>{e.title}</div>
                <div style={{ fontSize: 10, color: T.mute }}>{fmtDate(e.date)} Â· {e.type}{e.stage ? ` Â· ${STAGE_MAP[e.stage]?.label}` : ""}</div>
              </div>
              <Badge color={e.color}>{e.type}</Badge>
            </div>
          ))}
          {allEvents.length === 0 && <div style={{ color: T.mute, fontSize: 12 }}>No events yet</div>}
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Calendar Event">
        <div style={{ display: "grid", gap: 12 }}>
          <Input value={newEvent.title} onChange={v => setNewEvent({ ...newEvent, title: v })} placeholder="Event title" />
          <Input type="date" value={newEvent.date} onChange={v => setNewEvent({ ...newEvent, date: v })} />
          <Select value={newEvent.type} onChange={v => setNewEvent({ ...newEvent, type: v })} options={[
            { value: "milestone", label: "ðŸ“Œ Milestone" }, { value: "meeting", label: "ðŸ¤ Meeting" },
            { value: "report_due", label: "ðŸ“ Report Due" }, { value: "review", label: "ðŸ‘ï¸ Review" },
            { value: "other", label: "ðŸ“Ž Other" },
          ]} />
          <TextArea value={newEvent.notes} onChange={v => setNewEvent({ ...newEvent, notes: v })} placeholder="Notes..." rows={2} />
          <Btn variant="primary" onClick={addEvent}>Add Event</Btn>
        </div>
      </Modal>
    </div>
  );
};

