

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProgram.module.css';
import Title from '../ui/Title/Title';
import Loader from '../ui/Loader/Loader';

export default function EditProgram() {
  const [unscheduledTalks, setUnscheduledTalks] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const token = localStorage.getItem("access_token");
    
    try {
      // Получаем неопубликованные talks
      const talksRes = await fetch('http://localhost:8000/api/admin/talks/unscheduled/', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const talksData = await talksRes.json();
      
      const programRes = await fetch('http://localhost:8000/api/program/');
      const programData = await programRes.json();
      
      setUnscheduledTalks(talksData);
      setDays(programData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }

  async function scheduleTalk(talkId, dayId, startTime, endTime) {
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
          end_time: endTime
        })
      });

      if (res.ok) {
        alert(' Talk scheduled successfully!');
        fetchData(); // Refresh data
      } else {
        alert(' Failed to schedule talk');
      }
    } catch (error) {
      console.error("Error scheduling talk:", error);
      alert(' Connection error');
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
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <Title text="Conference Schedule" />
        <div className={styles.programPreview}>
          {days.map(day => (
            <DaySchedule key={day.id} day={day} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TalkCard({ talk, days, onSchedule }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);

  function handleSchedule() {
    if (!selectedDay || !startTime || !endTime) {
      alert('Please fill all fields');
      return;
    }
    onSchedule(talk.id, selectedDay, startTime, endTime);
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
        <button 
          className={styles.scheduleBtn}
          onClick={() => setShowScheduler(true)}
        >
          Add to Schedule
        </button>
      ) : (
        <div className={styles.scheduler}>
          <label>
            Day:
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
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

          <label>
            Start Time:
            <input 
              type="time" 
              value={startTime} 
              onChange={e => setStartTime(e.target.value)}
            />
          </label>

          <label>
            End Time:
            <input 
              type="time" 
              value={endTime} 
              onChange={e => setEndTime(e.target.value)}
            />
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

function DaySchedule({ day }) {
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
                {item.start_time} - {item.end_time}
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
    </div>
  );
}