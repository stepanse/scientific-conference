import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './EditWebInfoAccommodation.module.css';
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

export default function EditWebInfoAccommodation() {
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingOptions, setSavingOptions] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);
  const [savedOptions, setSavedOptions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/accommodation/`)
      .then(r => r.json())
      .then(data => {
        setDescription(data.description || '');
        setOptions(data.options || []);
        setLoading(false);
      });
  }, []);

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API}/admin/accommodation/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      setSavedInfo(true);
    } catch {
      setError('Failed to save description.');
    } finally {
      setSavingInfo(false);
    }
  }

  function handleOptionChange(index, field, value) {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
    setSavedOptions(false);
  }

  function handleOptionPhoto(index, file) {
    const updated = [...options];
    updated[index] = {
      ...updated[index],
      _photoFile: file,
      _photoPreview: URL.createObjectURL(file),
    };
    setOptions(updated);
  }

  function addOption() {
    setOptions([...options, { name: '', description: '', url: '', photo: null, order: options.length }]);
  }

  async function deleteOption(id, index) {
    if (!window.confirm('Delete this option?')) return;
    if (id) {
      await fetchWithAuth(`${API}/admin/accommodation/options/${id}/`, { method: 'DELETE' });
    }
    setOptions(options.filter((_, i) => i !== index));
  }

  async function saveOption(option) {
    const fd = new FormData();
    fd.append('name', option.name || '');
    fd.append('description', option.description || '');
    fd.append('url', option.url || '');
    fd.append('order', option.order ?? 0);
    if (option._photoFile) fd.append('photo', option._photoFile);

    if (option.id) {
      return fetchWithAuth(`${API}/admin/accommodation/options/${option.id}/`, { method: 'PATCH', body: fd });
    } else {
      return fetchWithAuth(`${API}/admin/accommodation/options/`, { method: 'POST', body: fd });
    }
  }

  async function handleSaveOptions() {
    setSavingOptions(true);
    setError('');
    try {
      const results = await Promise.all(options.map(o => saveOption(o)));
      const updated = await Promise.all(results.map(r => r.json()));
      setOptions(updated);
      setSavedOptions(true);
    } catch {
      setError('Failed to save options.');
    } finally {
      setSavingOptions(false);
    }
  }

  return (
    <div className={styles.container}>
      <Link to="/admin-panel/edit-web-info" className={styles.backButton}>← BACK</Link>
      <Title text="Edit Accommodation" />

      {loading ? (
        <Loader />
      ) : (
        <div className={styles.fadeIn}>

          {/* ── Description ── */}
          <form onSubmit={handleSaveInfo} className={styles.form}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>General Description</h2>
              <div className={styles.field}>
                <label>Text shown at the top of the Accommodation page</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => { setDescription(e.target.value); setSavedInfo(false); }}
                />
              </div>
            </section>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              {savedInfo && <span className={styles.savedMsg}>✓ Saved</span>}
              <button type="submit" className={styles.saveButton} disabled={savingInfo}>
                {savingInfo ? 'Saving...' : 'SAVE DESCRIPTION'}
              </button>
            </div>
          </form>

          {/* ── Options ── */}
          <section className={styles.section} style={{ marginTop: 40 }}>
            <h2 className={styles.sectionTitle}>Accommodation Options</h2>

            {options.length === 0 && (
              <p className={styles.emptyMsg}>No options added yet.</p>
            )}

            {options.map((option, i) => (
              <div key={option.id ?? `new-${i}`} className={styles.optionRow}>
                <div className={styles.photoCol}>
                  {option._photoPreview
                    ? <img src={option._photoPreview} alt="preview" className={styles.optionPhoto} />
                    : option.photo
                      ? <img src={getMediaUrl(option.photo)} alt={option.name} className={styles.optionPhoto} />
                      : <div className={styles.photoPlaceholder} />
                  }
                  <label className={styles.photoLabel}>
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleOptionPhoto(i, e.target.files[0])}
                      className={styles.fileInputHidden}
                    />
                  </label>
                </div>

                <div className={styles.optionFields}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Name</label>
                      <input
                        value={option.name || ''}
                        onChange={e => handleOptionChange(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Order</label>
                      <input
                        type="number"
                        value={option.order ?? i}
                        onChange={e => handleOptionChange(i, 'order', e.target.value)}
                        style={{ maxWidth: 80 }}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Description</label>
                    <textarea
                      rows={2}
                      value={option.description || ''}
                      onChange={e => handleOptionChange(i, 'description', e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Website URL</label>
                    <input
                      type="url"
                      value={option.url || ''}
                      onChange={e => handleOptionChange(i, 'url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => deleteOption(option.id, i)}
                >✕</button>
              </div>
            ))}

            <div className={styles.personActions}>
              <button type="button" className={styles.addButton} onClick={addOption}>
                + ADD OPTION
              </button>
              <div className={styles.saveRow}>
                {savedOptions && <span className={styles.savedMsg}>✓ Saved</span>}
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSaveOptions}
                  disabled={savingOptions}
                >
                  {savingOptions ? 'Saving...' : 'SAVE OPTIONS'}
                </button>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}