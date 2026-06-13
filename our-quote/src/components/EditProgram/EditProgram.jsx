import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProgram.module.css';
import Title from '../ui/Title/Title';
import Loader from '../ui/Loader/Loader';
import { clearProgramDirty } from '../../utils/programRefresh';

function TimeSelect({ onChange }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  function handleHours(h) {
    setHours(h);
    if (h && minutes) onChange(`${h}:${minutes}:00`);
    else onChange('');
  }

  function handleMinutes(m) {
    setMinutes(m);
    if (hours && m) onChange(`${hours}:${m}:00`);
    else onChange('');
  }

  return (
    <div className={styles.timeSelect}>
      <select value={hours} onChange={e => handleHours(e.target.value)}>
        <option value="">HH</option>
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={String(i).padStart(2, '0')}>
            {String(i).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span style={{ color: 'var(--color-text-secondary)' }}>:</span>
      <select value={minutes} onChange={e => handleMinutes(e.target.value)}>
        <option value="">MM</option>
        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

export default function EditProgram() {
  const [unscheduledTalks, setUnscheduledTalks] = useState([]);
  const [days, setDays] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDayForm, setShowDayForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    function handleFocus() {
      if (localStorage.getItem('program_needs_refresh')) fetchData();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function fetchData() {
    const token = localStorage.getItem("access_token");
    try {
      const [talksRes, programRes, sessionsRes] = await Promise.all([
        fetch('http://scientific-conference-backend.tutik/api/admin/talks/unscheduled/', { headers: { "Authorization": `Bearer ${token}` } }),
        fetch('http://scientific-conference-backend.tutik/api/program/'),
        fetch('http://scientific-conference-backend.tutik/api/admin/sessions/', { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      setUnscheduledTalks(await talksRes.json());
      setDays(await programRes.json());
      setSessions(await sessionsRes.json());
      clearProgramDirty();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createDay(date) {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch('http://scientific-conference-backend.tutik/api/admin/days/create/', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      if (res.ok) { alert('Day added successfully!'); fetchData(); }
      else { const data = await res.json(); alert(`Failed to add day: ${JSON.stringify(data)}`); }
    } catch { alert('Connection error'); }
  }

  async function scheduleTalk(talkId, dayId, startTime, endTime, sessionId = null) {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://scientific-conference-backend.tutik/api/admin/talks/${talkId}/schedule/`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayId, start_time: startTime, end_time: endTime, session: sessionId })
      });
      if (res.ok) { alert('Talk scheduled successfully!'); fetchData(); }
      else alert('Failed to schedule talk');
    } catch { alert('Connection error'); }
  }

  async function deleteTalk(talkId) {
    if (!window.confirm('Are you sure you want to delete this talk?')) return;
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://scientific-conference-backend.tutik/api/admin/talks/${talkId}/delete/`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) { alert('Talk deleted successfully!'); fetchData(); }
      else { const data = await res.json(); alert(`Failed to delete talk: ${data.error || 'Unknown error'}`); }
    } catch { alert('Connection error'); }
  }

  async function createSession(dayId, chair) {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch('http://scientific-conference-backend.tutik/api/admin/sessions/create/', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayId, chair })
      });
      if (res.ok) { alert('Session created successfully!'); fetchData(); }
      else alert('Failed to create session');
    } catch { alert('Connection error'); }
  }

  async function createBreak(dayId, title, startTime, endTime) {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch('http://scientific-conference-backend.tutik/api/admin/talks/create-break/', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayId, title, talk_type: 'break', start_time: startTime, end_time: endTime })
      });
      if (res.ok) { alert('Break added successfully!'); fetchData(); }
      else alert('Failed to add break');
    } catch { alert('Connection error'); }
  }

  async function updateTime(type, id, startTime, endTime) {
    const token = localStorage.getItem("access_token");
    const url = type === 'session'
      ? `http://scientific-conference-backend.tutik/api/admin/sessions/${id}/update-time/`
      : `http://scientific-conference-backend.tutik/api/admin/talks/${id}/schedule/`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_time: startTime, end_time: endTime })
      });
      if (res.ok) { alert('Time updated!'); fetchData(); }
      else alert('Failed to update time');
    } catch { alert('Connection error'); }
  }

  function handleCreateDay() {
    if (!newDate) { alert('Please select a date'); return; }
    createDay(newDate);
    setShowDayForm(false);
    setNewDate('');
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate("/admin-panel")} className={styles.backBtn}>← Back</button>

      <Title text="Unscheduled Talks" />

      {loading ? (
        <Loader />
      ) : (
        <div className={styles.fadeIn}>
          <section className={styles.section}>
            {unscheduledTalks.length === 0 ? (
              <p className={styles.noData}>No unscheduled talks</p>
            ) : (
              <div className={styles.talksGrid}>
                {unscheduledTalks.map(talk => (
                  <TalkCard
                    key={talk.id}
                    talk={talk}
                    days={days}
                    onSchedule={scheduleTalk}
                    onDelete={deleteTalk}
                    sessions={sessions}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <Title text="Conference Schedule" />

            <div className={styles.addDayRow}>
              {!showDayForm ? (
                <button className={styles.addDayBtn} onClick={() => setShowDayForm(true)}>
                  + Add Day
                </button>
              ) : (
                <div className={styles.dayForm}>
                  <label>
                    Date:
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </label>
                  <div className={styles.schedulerActions}>
                    <button className={styles.saveBtn} onClick={handleCreateDay}>Save</button>
                    <button className={styles.cancelBtn} onClick={() => setShowDayForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.programPreview}>
              {days.map(day => (
                <DaySchedule
                  key={day.id}
                  day={day}
                  onCreateBreak={createBreak}
                  onCreateSession={createSession}
                  onUpdateTime={updateTime}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TalkCard({ talk, days, onSchedule, onDelete, sessions }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');

  const daySessions = sessions?.filter(s => String(s.day) === String(selectedDay)) || [];

  function handleSchedule() {
    if (!selectedDay || !startTime || !endTime) { alert('Please fill all fields'); return; }
    onSchedule(talk.id, selectedDay, startTime, endTime, selectedSession || null);
  }

  return (
    <div className={styles.talkCard}>
      <div className={styles.talkHeader}>
        <h3>{talk.title}</h3>
        <span className={styles.badge}>Unscheduled</span>
      </div>
      <div className={styles.talkBody}>
        <p><strong>Speaker:</strong> {talk.participant?.name || 'N/A'}</p>
        <p><strong>Affiliation:</strong> {talk.participant?.affiliation || 'N/A'}</p>
        {talk.abstract && (
          <p className={styles.abstractPreview}>{talk.abstract.text?.substring(0, 150)}...</p>
        )}
      </div>
      {!showScheduler ? (
        <div className={styles.talkCardActions}>
          <button className={styles.scheduleBtn} onClick={() => setShowScheduler(true)}>Add to Schedule</button>
          <button className={styles.deleteBtn} onClick={() => onDelete(talk.id)}>Delete</button>
        </div>
      ) : (
        <div className={styles.scheduler}>
          <label>
            Day:
            <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); setSelectedSession(''); }}>
              <option value="">Select day</option>
              {days.map(day => (
                <option key={day.id} value={day.id}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
          </label>
          {daySessions.length > 0 && (
            <label>
              Chair (optional):
              <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                <option value="">No chair</option>
                {daySessions.map(s => (
                  <option key={s.id} value={s.id}>{s.chair ? `Chair: ${s.chair}` : `Chair #${s.id}`}</option>
                ))}
              </select>
            </label>
          )}
          <label>Start Time: <TimeSelect onChange={setStartTime} /></label>
          <label>End Time: <TimeSelect onChange={setEndTime} /></label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleSchedule}>Save</button>
            <button className={styles.cancelBtn} onClick={() => setShowScheduler(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DaySchedule({ day, onCreateBreak, onCreateSession, onUpdateTime }) {
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [breakTitle, setBreakTitle] = useState('Coffee Break');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionChair, setSessionChair] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  function formatTime(t) { return t ? t.substring(0, 5) : ''; }

  function handleAddBreak() {
    if (!breakStart || !breakEnd) { alert('Please set start and end time'); return; }
    onCreateBreak(day.id, breakTitle, breakStart, breakEnd);
    setShowBreakForm(false); setBreakTitle('Coffee Break'); setBreakStart(''); setBreakEnd('');
  }

  function handleAddSession() {
    if (!sessionChair.trim()) { alert('Please enter chair name'); return; }
    onCreateSession(day.id, sessionChair);
    setShowSessionForm(false); setSessionChair('');
  }

  function handleStartEdit(type, data) {
    setEditingItem({ type, data }); setEditStart(''); setEditEnd('');
    setShowBreakForm(false); setShowSessionForm(false);
  }

  function handleSaveTime() {
    if (!editStart || !editEnd) { alert('Please set both start and end time'); return; }
    onUpdateTime(editingItem.type, editingItem.data.id, editStart, editEnd);
    setEditingItem(null);
  }

  return (
    <div className={styles.daySchedule}>
      <h3>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>

      {day.timeline && day.timeline.length > 0 ? (
        <div className={styles.timeline}>
          {day.timeline.map((item, idx) => (
            <div key={idx}>
              {item.type === 'session' ? (
                <div className={styles.sessionBlock}>
                  <div className={styles.sessionHeader}>
                    <span className={styles.time}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                    <span className={styles.sessionTitle}>Chair: {item.data.chair}</span>
                    <button className={styles.editTimeBtn} onClick={() => handleStartEdit('session', item.data)}>Edit</button>
                  </div>
                  {item.data.talks?.length > 0 && (
                    <div className={styles.sessionTalks}>
                      {item.data.talks.map((talk, tIdx) => (
                        <div key={tIdx} className={styles.sessionTalkItem}>
                          <span className={styles.time}>{formatTime(talk.start_time)} - {formatTime(talk.end_time)}</span>
                          <span className={styles.itemTitle}>
                            {talk.participant?.name && <span className={styles.speakerName}>{talk.participant.name}{' — '}</span>}
                            {talk.title}
                          </span>
                          <button className={styles.editTimeBtn} onClick={() => handleStartEdit('talk', talk)}>Edit</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.timelineItem}>
                  <span className={styles.time}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                  <span className={styles.itemTitle}>
                    {item.data.title}
                    {item.type === 'talk' && item.data.participant?.name && (
                      <span className={styles.speakerName}>{' — '}{item.data.participant.name}</span>
                    )}
                  </span>
                  <button className={styles.editTimeBtn} onClick={() => handleStartEdit(item.type, item.data)}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noSchedule}>No talks scheduled yet</p>
      )}

      {!showBreakForm && !showSessionForm && !editingItem && (
        <div className={styles.dayActions}>
          <button className={styles.addBreakBtn} onClick={() => setShowBreakForm(true)}>+ Add Break</button>
          <button className={styles.addSessionBtn} onClick={() => setShowSessionForm(true)}>+ Add Chair</button>
        </div>
      )}

      {editingItem && (
        <div className={styles.breakForm}>
          <p className={styles.editLabel}>Edit time: <strong>{editingItem.data.title || editingItem.data.chair}</strong></p>
          <label>Start Time: <TimeSelect onChange={setEditStart} /></label>
          <label>End Time: <TimeSelect onChange={setEditEnd} /></label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleSaveTime}>Save</button>
            <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>Cancel</button>
          </div>
        </div>
      )}

      {showBreakForm && (
        <div className={styles.breakForm}>
          <label>Title: <input type="text" value={breakTitle} onChange={e => setBreakTitle(e.target.value)} placeholder="Coffee Break" /></label>
          <label>Start Time: <TimeSelect onChange={setBreakStart} /></label>
          <label>End Time: <TimeSelect onChange={setBreakEnd} /></label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleAddBreak}>Save</button>
            <button className={styles.cancelBtn} onClick={() => setShowBreakForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showSessionForm && (
        <div className={styles.breakForm}>
          <label>Chair: <input type="text" value={sessionChair} onChange={e => setSessionChair(e.target.value)} placeholder="Prof. Smith" /></label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleAddSession}>Save</button>
            <button className={styles.cancelBtn} onClick={() => setShowSessionForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}