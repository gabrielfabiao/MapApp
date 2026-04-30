import { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { PlantIdService } from '../../services/plantIdService';
import ConfirmModal from '../common/ConfirmModal';

export default function MarkerEditorModal({ markerIdx, onClose }) {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;
  const marker = project?.markers[markerIdx];

  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [sciName, setSciName] = useState('');
  const [isTree, setIsTree] = useState(false);
  const [treeHeight, setTreeHeight] = useState(15);
  const [treeCanopy, setTreeCanopy] = useState(8);
  const [images, setImages] = useState([]);
  const [identifying, setIdentifying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (marker) {
      setTitle(marker.title || '');
      setLabel(marker.label || String(markerIdx + 1));
      setDescription(marker.description || '');
      setSciName(marker.scientificName || '');
      setIsTree(!!marker.isTree);
      setTreeHeight(marker.treeHeight || 15);
      setTreeCanopy(marker.treeCanopy || 8);
      setImages(marker.images || []);
    }
  }, [marker, markerIdx]);

  if (markerIdx === null || markerIdx === undefined || !marker) return null;

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_MARKER',
      idx: markerIdx,
      patch: { title, label, description, scientificName: sciName, isTree, treeHeight: parseFloat(treeHeight) || 15, treeCanopy: parseFloat(treeCanopy) || 8, images },
    });
    onClose();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_MARKER', idx: markerIdx });
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    let loaded = 0;
    const newImages = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newImages.push(ev.target.result);
        loaded++;
        if (loaded === files.length) setImages(prev => [...prev, ...newImages]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (imgIdx) => {
    setImages(prev => prev.filter((_, i) => i !== imgIdx));
  };

  const handleIdentify = async () => {
    if (images.length === 0) return;
    setIdentifying(true);
    try {
      const results = await PlantIdService.identify(images, state.settings.plantApiKey);
      const best = PlantIdService.getBestMatch(results);
      if (best) {
        let commonName = best.commonName ? best.commonName.split(',')[0].trim() : best.scientificName;
        commonName = commonName.charAt(0).toUpperCase() + commonName.slice(1);
        setTitle(commonName);
        setSciName(best.scientificName);
        const sciInfo = `Botanical Name: ${best.scientificName}\nConfidence: ${(best.score * 100).toFixed(1)}%`;
        setDescription(prev => prev.includes(best.scientificName) ? prev : sciInfo + (prev ? '\n\n' + prev : ''));
        alert(`Identified as ${commonName}!`);
      } else {
        alert('Could not identify this plant. Try a clearer photo.');
      }
    } catch (err) {
      alert(err.message || 'Identification failed.');
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <>
      <div className="modal-overlay open" id="marker-editor-modal">
        <div className="modal">
          <span className="modal-close" onClick={onClose}>&times;</span>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--amazon-dark)' }}>Edit Marker</h2>

          <div className="form-group">
            <label className="form-label">Title / Name</label>
            <input type="text" className="search-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. Main Entrance" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Technical Identifier (Number/Letter)</label>
            <input type="text" className="search-input" style={{ paddingLeft: '1rem' }} value={label} onChange={e => setLabel(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Plant ID (Scientific Name)</label>
            <div style={{ minHeight: '2.5rem', border: '1px solid var(--amazon-border)', borderRadius: '0.25rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff' }}>
              {sciName ? (
                <div className="caption-label-chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--amazon-light)', margin: 0 }}>
                  <span style={{ fontStyle: 'italic' }}>{sciName}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'var(--amazon-dark)' }} onClick={() => setSciName('')}>&times;</button>
                </div>
              ) : (
                <>
                  <input type="text" className="search-input" style={{ flex: 1, paddingLeft: '0.5rem' }} placeholder="e.g. Quercus robur" id="manual-sci-name" />
                  <button className="btn btn-sm" onClick={() => {
                    const val = document.getElementById('manual-sci-name')?.value.trim();
                    if (val) setSciName(val);
                  }}>Add</button>
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea className="form-textarea" placeholder="Describe this point in detail..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="tree-settings-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="checkbox" id="edit-is-tree" style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} checked={isTree} onChange={e => setIsTree(e.target.checked)} />
              <label htmlFor="edit-is-tree" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', color: '#15803d', fontWeight: 'bold' }}>Designate as a Tree 🌳</label>
            </div>
            {isTree && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Height (m)</label>
                  <input type="number" className="search-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. 15" value={treeHeight} onChange={e => setTreeHeight(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Canopy Diam (m)</label>
                  <input type="number" className="search-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. 8" value={treeCanopy} onChange={e => setTreeCanopy(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Photo Gallery ({images.length})</label>
              {images.length > 0 && (
                <button className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={handleIdentify} disabled={identifying}>
                  {identifying ? '🔍 Identifying...' : '✨ Identify Plant'}
                </button>
              )}
            </div>
            <div className="gallery-grid">
              {images.map((src, i) => (
                <div key={i} className="gallery-item">
                  <img src={src} alt="" />
                  <button className="remove-img" onClick={() => handleRemoveImage(i)}>&times;</button>
                </div>
              ))}
              <label className="add-image-box" style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: '1.5rem' }}>+</span>
                <span>Add Photo</span>
                <input type="file" hidden accept="image/*" multiple onChange={handleAddImages} />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete Marker</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Marker"
        message="Are you sure you want to delete this marker?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
