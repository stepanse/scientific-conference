import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './EditWebInfoVenue.module.css';
import Title from '../ui/Title/Title';
import Loader from '../ui/Loader/Loader';
import { fetchWithAuth } from '../../utils/api';

const API = 'http://scientific-conference-backend.tutik/api';

export default function EditWebInfoVenue() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/conference-info/`)
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false); });
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API}/conference-info/edit/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_description: form.venue_description,
          venue_maps_url: form.venue_maps_url,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      <Link to="/admin-panel/edit-web-info" className={styles.backButton}>← BACK</Link>
      <Title text="Edit Venue" />

      {loading ? (
        <Loader />
      ) : (
        <>
          <form onSubmit={handleSave} className={`${styles.form} ${styles.fadeIn}`}>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Venue</h2>

              <div className={styles.field}>
                <label>Venue</label>
                <textarea
                  name="venue_description"
                  rows={5}
                  value={form.venue_description || ''}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label>Google Maps Embed URL</label>
                <small className={styles.hint}>
                  Google Maps → Share → Embed a map → Copy src from iframe
                </small>
                <input
                  name="venue_maps_url"
                  value={form.venue_maps_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>
            </section>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              {saved && <span className={styles.savedMsg}>✓ Saved successfully</span>}
              <button type="submit" className={styles.saveButton} disabled={saving}>
                {saving ? 'Saving...' : 'SAVE CHANGES'}
              </button>
            </div>

          </form>

          {/* Preview */}
          {(form.venue_description || form.venue_maps_url) && (
            <section className={styles.section} style={{ marginTop: 40 }}>
              <h2 className={styles.sectionTitle}>Preview</h2>
              {form.venue_description && (
                <p className={styles.previewText}>{form.venue_description}</p>
              )}
              {form.venue_maps_url && (
                <iframe
                  src={form.venue_maps_url}
                  className={styles.mapPreview}
                  allowFullScreen=""
                  loading="lazy"
                  title="Venue map"
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}