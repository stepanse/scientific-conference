import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProgram.module.css';
import Title from '../ui/Title/Title';
import Loader from '../ui/Loader/Loader';


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
  const [sessions, setSessions] = useState([]);  // ← новый стейт
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const token = localStorage.getItem("access_token");

    try {
      const talksRes = await fetch('http://localhost:8000/api/admin/talks/unscheduled/', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const talksData = await talksRes.json();

      const programRes = await fetch('http://localhost:8000/api/program/');
      const programData = await programRes.json();

      // ← загружаем все сессии отдельно
      const sessionsRes = await fetch('http://localhost:8000/api/admin/sessions/', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const sessionsData = await sessionsRes.json();

      setUnscheduledTalks(talksData);
      setDays(programData);
      setSessions(sessionsData);  // ← сохраняем
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }

  async function scheduleTalk(talkId, dayId, startTime, endTime, sessionId = null) {
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`http://localhost:8000/api/admin/talks/${talkId}/schedule/`, {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          day: dayId,
          start_time: startTime,
          end_time: endTime,
          session: sessionId
        })
      });

      if (res.ok) {
        alert('Talk scheduled successfully!');
        fetchData();
      } else {
        alert('Failed to schedule talk');
      }
    } catch (error) {
      console.error("Error scheduling talk:", error);
      alert('Connection error');
    }
  }

  async function deleteTalk(talkId) {
    if (!window.confirm('Are you sure you want to delete this talk?')) return;

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`http://localhost:8000/api/admin/talks/${talkId}/delete/`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Talk deleted successfully!');
        fetchData();
      } else {
        const data = await res.json();
        alert(`Failed to delete talk: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting talk:", error);
      alert('Connection error');
    }
  }

  async function createSession(dayId, chair) {
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch('http://localhost:8000/api/admin/sessions/create/', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ day: dayId, chair })
      });

      if (res.ok) {
        alert('Session created successfully!');
        fetchData();
      } else {
        alert('Failed to create session');
      }
    } catch (error) {
      console.error("Error creating session:", error);
      alert('Connection error');
    }
  }

  async function createBreak(dayId, title, startTime, endTime) {
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch('http://localhost:8000/api/admin/talks/create-break/', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          day: dayId,
          title: title,
          talk_type: 'break',
          start_time: startTime,
          end_time: endTime
        })
      });

      if (res.ok) {
        alert('Break added successfully!');
        fetchData();
      } else {
        alert('Failed to add break');
      }
    } catch (error) {
      console.error("Error creating break:", error);
      alert('Connection error');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <button onClick={() => navigate("/admin-panel")} className={styles.backBtn}>
          ← Back
        </button>
        <Title text="Edit Program" />
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate("/admin-panel")} className={styles.backBtn}>
        ← Back
      </button>

      <Title text="Unscheduled Talks" />

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
                sessions={sessions}  // ← передаём напрямую
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <Title text="Conference Schedule" />
        <div className={styles.programPreview}>
          {days.map(day => (
            <DaySchedule
              key={day.id}
              day={day}
              onCreateBreak={createBreak}
              onCreateSession={createSession}
            />
          ))}
        </div>
      </section>
    </div>
  );
}


function TalkCard({ talk, days, onSchedule, onDelete, sessions }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');

  // ← фильтруем по полю day (id дня), а не dayId
  const daySessions = sessions?.filter(s => String(s.day) === String(selectedDay)) || [];

  function handleSchedule() {
    if (!selectedDay || !startTime || !endTime) {
      alert('Please fill all fields');
      return;
    }
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
          <p className={styles.abstractPreview}>
            {talk.abstract.text?.substring(0, 150)}...
          </p>
        )}
      </div>

      {!showScheduler ? (
        <div className={styles.talkCardActions}>
          <button
            className={styles.scheduleBtn}
            onClick={() => setShowScheduler(true)}
          >
            Add to Schedule
          </button>
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(talk.id)}
          >
            Delete
          </button>
        </div>
      ) : (
        <div className={styles.scheduler}>
          <label>
            Day:
            <select value={selectedDay} onChange={e => {
              setSelectedDay(e.target.value);
              setSelectedSession('');
            }}>
              <option value="">Select day</option>
              {days.map(day => (
                <option key={day.id} value={day.id}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </label>

          {daySessions.length > 0 && (
            <label>
              Session (optional):
              <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                <option value="">No session</option>
                {daySessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.chair ? `Session: ${s.chair}` : `Session #${s.id}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Start Time:
            <TimeSelect onChange={setStartTime} />
          </label>

          <label>
            End Time:
            <TimeSelect onChange={setEndTime} />
          </label>

          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleSchedule}>
              Save
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowScheduler(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function DaySchedule({ day, onCreateBreak, onCreateSession }) {
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [breakTitle, setBreakTitle] = useState('Coffee Break');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionChair, setSessionChair] = useState('');

  function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }

  function handleAddBreak() {
    if (!breakStart || !breakEnd) {
      alert('Please set start and end time');
      return;
    }
    onCreateBreak(day.id, breakTitle, breakStart, breakEnd);
    setShowBreakForm(false);
    setBreakTitle('Coffee Break');
    setBreakStart('');
    setBreakEnd('');
  }

  function handleAddSession() {
    if (!sessionChair.trim()) {
      alert('Please enter chair name');
      return;
    }
    onCreateSession(day.id, sessionChair);
    setShowSessionForm(false);
    setSessionChair('');
  }

  return (
    <div className={styles.daySchedule}>
      <h3>{new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}</h3>

      {day.timeline && day.timeline.length > 0 ? (
        <div className={styles.timeline}>
          {day.timeline.map((item, idx) => (
            <div key={idx} className={styles.timelineItem}>
              <span className={styles.time}>
                {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </span>
              <span className={styles.itemTitle}>
                {item.type === 'session' ?
                  `Session: ${item.data.chair}` :
                  item.data.title
                }
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noSchedule}>No talks scheduled yet</p>
      )}

      {/* ─── Кнопки ─── */}
      {!showBreakForm && !showSessionForm && (
        <div className={styles.dayActions}>
          <button
            className={styles.addBreakBtn}
            onClick={() => setShowBreakForm(true)}
          >
            + Add Break
          </button>
          <button
            className={styles.addSessionBtn}
            onClick={() => setShowSessionForm(true)}
          >
            + Add Session
          </button>
        </div>
      )}

      {/* ─── Add Break ─── */}
      {showBreakForm && (
        <div className={styles.breakForm}>
          <label>
            Title:
            <input
              type="text"
              value={breakTitle}
              onChange={e => setBreakTitle(e.target.value)}
              placeholder="Coffee Break"
            />
          </label>
          <label>
            Start Time:
            <TimeSelect onChange={setBreakStart} />
          </label>
          <label>
            End Time:
            <TimeSelect onChange={setBreakEnd} />
          </label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleAddBreak}>
              Save
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowBreakForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Add Session ─── */}
      {showSessionForm && (
        <div className={styles.breakForm}>
          <label>
            Chair:
            <input
              type="text"
              value={sessionChair}
              onChange={e => setSessionChair(e.target.value)}
              placeholder="Prof. Smith"
            />
          </label>
          <div className={styles.schedulerActions}>
            <button className={styles.saveBtn} onClick={handleAddSession}>
              Save
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowSessionForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}