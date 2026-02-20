import React, { useState, useMemo } from 'react';
import { Card, Btn, Badge, Input, TextArea, Select, Tab, Progress, Modal, MiniBar, Empty } from '../ui';
import { T, uid, fmtDate, daysUntil, STAGE_MAP } from '../globals';

// ─── ICS EXPORT HELPER ─────────────────────────────────────────────
function generateICS(events) {
  const pad = (n) => String(n).padStart(2, '0');
  const toICSDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  };
  const escapeICS = (str) => (str || '').replace(/[\\;,\n]/g, (m) => m === '\n' ? '\\n' : `\\${m}`);
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNLESS Grant Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:UNLESS Grant Deadlines',
  ];

  events.forEach((e) => {
    const dt = toICSDate(e.date);
    const nextDay = new Date(new Date(e.date).getTime() + 86400000);
    const dtEnd = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;
    ics.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `DTSTAMP:${stamp}`,
      `UID:${e.id || uid()}@unless-grants`,
      `SUMMARY:${escapeICS(e.title)}`,
      `DESCRIPTION:${escapeICS(`Type: ${e.type}${e.stage ? ` | Stage: ${STAGE_MAP[e.stage]?.label || e.stage}` : ''}${e.notes ? ` | Notes: ${e.notes}` : ''}`)}`,
      `CATEGORIES:${e.type === 'deadline' ? 'GRANT DEADLINE' : e.type?.toUpperCase() || 'EVENT'}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(e.title)} is tomorrow`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(e.title)} is in 7 days`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function downloadICS(events) {
  const upcoming = events.filter(e => new Date(e.date) >= new Date(new Date().toDateString()));
  if (upcoming.length === 0) { alert('No upcoming events to export.'); return; }
  const icsContent = generateICS(upcoming);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unless-grants-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { useStore } from '../store';

export const TimelineCalendar = () => {
  const { grants, events, setEvents } = useStore();
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

  const upcomingCount = allEvents.filter(e => new Date(e.date) >= new Date(new Date().toDateString())).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tab tabs={[{ id: "month", icon: "📅", label: "Month" }, { id: "timeline", icon: "📊", label: "Timeline" }, { id: "agenda", icon: "📋", label: "Agenda" }]} active={view} onChange={setView} />
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" size="sm" onClick={() => downloadICS(allEvents)} title={`Export ${upcomingCount} upcoming events`}>
            📤 Export .ics {upcomingCount > 0 && <Badge color={T.green} style={{ marginLeft: 4, fontSize: 9 }}>{upcomingCount}</Badge>}
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Event</Btn>
        </div>
      </div>

      {view === "month" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(-1)}>◀</Btn>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{monthNames[month]} {year}</div>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(1)}>▶</Btn>
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
                      {e.type === "deadline" ? "⏰" : "📌"} {e.title?.slice(0, 15)}
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
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📊 Next 90 Days</div>
          {timelineEvents.length === 0 ? <div style={{ color: T.mute, fontSize: 12 }}>No events in the next 90 days</div> :
            timelineEvents.map(e => {
              const days = daysUntil(e.date);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.text }}>{e.title?.slice(0, 50)}</div>
                    <div style={{ fontSize: 10, color: T.mute }}>{fmtDate(e.date)} · {e.type}</div>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📋 All Events by Date</div>
          {allEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 12, color: T.text }}>{e.title}</div>
                <div style={{ fontSize: 10, color: T.mute }}>{fmtDate(e.date)} · {e.type}{e.stage ? ` · ${STAGE_MAP[e.stage]?.label}` : ""}</div>
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
            { value: "milestone", label: "📌 Milestone" }, { value: "meeting", label: "🤝 Meeting" },
            { value: "report_due", label: "📄 Report Due" }, { value: "review", label: "👁️ Review" },
            { value: "other", label: "📎 Other" },
          ]} />
          <TextArea value={newEvent.notes} onChange={v => setNewEvent({ ...newEvent, notes: v })} placeholder="Notes..." rows={2} />
          <Btn variant="primary" onClick={addEvent}>Add Event</Btn>
        </div>
      </Modal>
    </div>
  );
};
