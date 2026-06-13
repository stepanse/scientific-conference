import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './EditWebInfoHiking.module.css';
import Title from '../ui/Title/Title';
import Loader from '../ui/Loader/Loader';
import { fetchWithAuth } from '../../utils/api';

const API = 'http://scientific-conference-backend.tutik/api';
const BASE = 'http://scientific-conference-backend.tutik';

function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}

export default function EditWebInfoHiking() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRoute, setSavedRoute] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/hiking/`)
      .then(r => r.json())
      .then(data => { setRoutes(data); setLoading(false); });
  }, []);

  function handleRouteChange(routeIndex, field, value) {
    const updated = [...routes];
    updated[routeIndex] = { ...updated[routeIndex], [field]: value };
    setRoutes(updated);
  }

  function addRoute() {
    setRoutes([...routes, { name: '', way_description: '', map_url: '', stops: [], _isNew: true }]);
  }

  async function deleteRoute(routeIndex) {
    const route = routes[routeIndex];
    if (!window.confirm('Delete this route and all its stops?')) return;
    if (route.id) {
      await fetchWithAuth(`${API}/hiking/admin/`, { method: 'DELETE' });
    }
    setRoutes(routes.filter((_, i) => i !== routeIndex));
  }

  async function saveRoute(routeIndex) {
    const route = routes[routeIndex];
    setSaving(true);
    setError('');
    try {
      let savedRouteData;
      if (route.id) {
        const res = await fetchWithAuth(`${API}/hiking/admin/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: route.id, name: route.name, way_description: route.way_description, map_url: route.map_url }),
        });
        savedRouteData = await res.json();
      } else {
        const res = await fetchWithAuth(`${API}/hiking/admin/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: route.name, way_description: route.way_description, map_url: route.map_url }),
        });
        savedRouteData = await res.json();
      }
      const updated = [...routes];
      updated[routeIndex] = { ...savedRouteData, stops: route.stops || [] };
      setRoutes(updated);
      setSavedRoute(routeIndex);
    } catch {
      setError('Failed to save route.');
    } finally {
      setSaving(false);
    }
  }

  function handleStopChange(routeIndex, stopIndex, field, value) {
    const updated = [...routes];
    const stops = [...updated[routeIndex].stops];
    stops[stopIndex] = { ...stops[stopIndex], [field]: value };
    updated[routeIndex] = { ...updated[routeIndex], stops };
    setRoutes(updated);
  }

  function handleStopPhoto(routeIndex, stopIndex, file) {
    const updated = [...routes];
    const stops = [...updated[routeIndex].stops];
    stops[stopIndex] = { ...stops[stopIndex], _photoFile: file, _photoPreview: URL.createObjectURL(file) };
    updated[routeIndex] = { ...updated[routeIndex], stops };
    setRoutes(updated);
  }

  function addStop(routeIndex) {
    const updated = [...routes];
    const stops = [...(updated[routeIndex].stops || [])];
    stops.push({ name: '', description: '', photo: null, order: stops.length });
    updated[routeIndex] = { ...updated[routeIndex], stops };
    setRoutes(updated);
  }

  async function deleteStop(routeIndex, stopIndex) {
    const stop = routes[routeIndex].stops[stopIndex];
    if (!window.confirm('Delete this stop?')) return;
    if (stop.id) {
      await fetchWithAuth(`${API}/hiking/stops/${stop.id}/`, { method: 'DELETE' });
    }
    const updated = [...routes];
    updated[routeIndex] = {
      ...updated[routeIndex],
      stops: updated[routeIndex].stops.filter((_, i) => i !== stopIndex),
    };
    setRoutes(updated);
  }

  async function saveStop(stop, routeId) {
    const fd = new FormData();
    fd.append('name', stop.name || '');
    fd.append('description', stop.description || '');
    fd.append('order', stop.order ?? 0);
    fd.append('route', routeId);
    if (stop._photoFile) fd.append('photo', stop._photoFile);
    if (stop.id) {
      return fetchWithAuth(`${API}/hiking/stops/${stop.id}/`, { method: 'PATCH', body: fd });
    } else {
      return fetchWithAuth(`${API}/hiking/stops/`, { method: 'POST', body: fd });
    }
  }

  async function saveAllStops(routeIndex) {
    const route = routes[routeIndex];
    if (!route.id) { setError('Save the route first before adding stops.'); return; }
    setSaving(true);
    setError('');
    try {
      const results = await Promise.all(route.stops.map(s => saveStop(s, route.id)));
      const updatedStops = await Promise.all(results.map(r => r.json()));
      const updated = [...routes];
      updated[routeIndex] = { ...updated[routeIndex], stops: updatedStops };
      setRoutes(updated);
      setSavedRoute(`stops-${routeIndex}`);
    } catch {
      setError('Failed to save stops.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      <Link to="/admin-panel/edit-web-info" className={styles.backButton}>← BACK</Link>
      <Title text="Edit Hiking" />

      {loading ? (
        <Loader />
      ) : (
        <div className={styles.fadeIn}>

          {error && <p className={styles.error}>{error}</p>}

          {routes.length === 0 && (
            <p className={styles.emptyMsg} style={{ marginTop: 24 }}>No routes added yet.</p>
          )}

          {routes.map((route, ri) => (
            <section key={route.id ?? `new-${ri}`} className={styles.section}>

              <div className={styles.routeHeader}>
                <h2 className={styles.sectionTitle}>{route.name || `Route ${ri + 1}`}</h2>
                <button type="button" className={styles.deleteButton} onClick={() => deleteRoute(ri)}>
                  ✕ DELETE ROUTE
                </button>
              </div>

              <div className={styles.field}>
                <label>Route Name</label>
                <input value={route.name || ''} onChange={e => handleRouteChange(ri, 'name', e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Way Description</label>
                <textarea rows={4} value={route.way_description || ''} onChange={e => handleRouteChange(ri, 'way_description', e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Map URL</label>
                <small className={styles.hint}>Link to Google Maps or any map service</small>
                <input type="url" value={route.map_url || ''} onChange={e => handleRouteChange(ri, 'map_url', e.target.value)} placeholder="https://..." />
              </div>

              <div className={styles.actions}>
                {savedRoute === ri && <span className={styles.savedMsg}>✓ Route saved</span>}
                <button type="button" className={styles.saveButton} onClick={() => saveRoute(ri)} disabled={saving}>
                  {saving ? 'Saving...' : 'SAVE ROUTE'}
                </button>
              </div>

              <div className={styles.stopsBlock}>
                <h3 className={styles.stopsTitle}>Stops</h3>

                {!route.id && <p className={styles.hint}>Save the route first to add stops.</p>}
                {route.id && (route.stops || []).length === 0 && <p className={styles.emptyMsg}>No stops added yet.</p>}

                {route.id && (route.stops || []).map((stop, si) => (
                  <div key={stop.id ?? `new-stop-${si}`} className={styles.stopRow}>
                    <div className={styles.photoCol}>
                      {stop._photoPreview
                        ? <img src={stop._photoPreview} alt="preview" className={styles.stopPhoto} />
                        : stop.photo
                          ? <img src={getMediaUrl(stop.photo)} alt={stop.name} className={styles.stopPhoto} />
                          : <div className={styles.photoPlaceholder} />
                      }
                      <label className={styles.photoLabel}>
                        Change photo
                        <input type="file" accept="image/*" onChange={e => handleStopPhoto(ri, si, e.target.files[0])} className={styles.fileInputHidden} />
                      </label>
                    </div>

                    <div className={styles.stopFields}>
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label>Stop Name</label>
                          <input value={stop.name || ''} onChange={e => handleStopChange(ri, si, 'name', e.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <label>Order</label>
                          <input type="number" value={stop.order ?? si} onChange={e => handleStopChange(ri, si, 'order', e.target.value)} style={{ maxWidth: 80 }} />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label>Description</label>
                        <textarea rows={2} value={stop.description || ''} onChange={e => handleStopChange(ri, si, 'description', e.target.value)} />
                      </div>
                    </div>

                    <button type="button" className={styles.deleteButtonSmall} onClick={() => deleteStop(ri, si)}>✕</button>
                  </div>
                ))}

                {route.id && (
                  <div className={styles.personActions}>
                    <button type="button" className={styles.addButton} onClick={() => addStop(ri)}>+ ADD STOP</button>
                    <div className={styles.saveRow}>
                      {savedRoute === `stops-${ri}` && <span className={styles.savedMsg}>✓ Stops saved</span>}
                      <button type="button" className={styles.saveButton} onClick={() => saveAllStops(ri)} disabled={saving}>
                        {saving ? 'Saving...' : 'SAVE STOPS'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}

          <div style={{ marginTop: 24 }}>
            <button type="button" className={styles.addButton} onClick={addRoute}>+ ADD ROUTE</button>
          </div>

        </div>
      )}
    </div>
  );
}