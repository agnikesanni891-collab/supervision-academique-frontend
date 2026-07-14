import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Logo from '../components/Logo';
import AnnotateurPDF from './AnnotateurPDF';
import VisualiseurPDF from './VisualiseurPDF';

const ETAPES_PREDEFINIES = [
    'Définir la problématique',
    'Soumettre le plan au directeur',
    'Rédiger l\'introduction générale',
    'Rédiger la revue de littérature',
    'Rédiger la méthodologie',
    'Collecter les données',
    'Analyser les données',
    'Rédiger les résultats et analyses',
    'Rédiger la conclusion',
    'Compléter la bibliographie',
    'Mettre en forme selon les normes',
    'Vérifier l\'orthographe et la grammaire',
    'Valider le chapitre 1',
    'Valider le chapitre 2',
    'Valider le chapitre 3',
    'Obtenir l\'accord final pour la soutenance',
    'Préparer la soutenance',
];

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DATE — convertit UTC → heure locale du navigateur (UTC+1 Bénin)
// ════════════════════════════════════════════════════════════════════════════
const TZ = 'Africa/Porto-Novo'; // UTC+1 Bénin

const formatDateLocale = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { timeZone: TZ });
};

const formatHeureLocale = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
};

const formatDateHeureLocale = (dateStr) => {
    if (!dateStr) return '—';
    return `${formatDateLocale(dateStr)} · ${formatHeureLocale(dateStr)}`;
};


function ChecklistPanel({ idMemoire }) {
    const [items, setItems]         = useState([]);
    const [total, setTotal]         = useState(0);
    const [completes, setCompletes] = useState(0);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(null);
    const [ajoutMode, setAjoutMode] = useState(null);
    const [libreText, setLibreText] = useState('');
    const [predCoches, setPredCoches] = useState([]);
    const [editId, setEditId]       = useState(null);
    const [editText, setEditText]   = useState('');
    const libreRef = useRef(null);

    useEffect(() => {
        if (!idMemoire) return;
        setItems([]); setTotal(0); setCompletes(0); setPredCoches([]); setAjoutMode(null); setEditId(null);
        fetchChecklist(idMemoire);
    }, [idMemoire]);

    useEffect(() => { if (ajoutMode === 'libre' && libreRef.current) libreRef.current.focus(); }, [ajoutMode]);

    const fetchChecklist = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/memoires/${id}/checklist`);
            const data = res.data;
            const allItems = data.items || [];
            setItems(allItems);
            setTotal(data.progression?.total ?? allItems.length);
            setCompletes(data.progression?.completes ?? allItems.filter(i => i.est_complete).length);
        } catch { setItems([]); setTotal(0); setCompletes(0); }
        finally { setLoading(false); }
    };

    const taux = total > 0 ? Math.round((completes / total) * 100) : 0;
    const couleurBarre = taux >= 80 ? '#2e7d32' : taux >= 50 ? '#f59e0b' : '#e53935';

    const toggleItem = async (item) => {
        if (saving) return;
        const newVal = !item.est_complete;
        setItems(prev => prev.map(i => i.id_item === item.id_item ? { ...i, est_complete: newVal } : i));
        setCompletes(prev => newVal ? prev + 1 : prev - 1);
        setSaving(item.id_item);
        try { await api.patch(`/memoires/${idMemoire}/checklist/${item.id_item}/toggle`, { est_complete: newVal }); }
        catch {
            setItems(prev => prev.map(i => i.id_item === item.id_item ? { ...i, est_complete: !newVal } : i));
            setCompletes(prev => newVal ? prev - 1 : prev + 1);
        } finally { setSaving(null); }
    };

    const ajouterLibre = async () => {
        const texte = libreText.trim();
        if (!texte) return;
        const tempId = 'temp_' + Date.now();
        setItems(prev => [...prev, { id_item: tempId, libelle: texte, est_complete: false, date_completion: null }]);
        setTotal(prev => prev + 1); setLibreText(''); setAjoutMode(null);
        try { await api.post(`/memoires/${idMemoire}/checklist`, { libelle: texte, categorie: 'general' }); fetchChecklist(idMemoire); }
        catch { setItems(prev => prev.filter(i => i.id_item !== tempId)); setTotal(prev => prev - 1); }
    };

    const ajouterPredefinies = async () => {
        if (predCoches.length === 0) return;
        const toAdd = [...predCoches];
        const tempItems = toAdd.map((libelle, idx) => ({ id_item: 'temp_' + Date.now() + idx, libelle, est_complete: false, date_completion: null }));
        setItems(prev => [...prev, ...tempItems]); setTotal(prev => prev + toAdd.length); setPredCoches([]); setAjoutMode(null);
        try { for (const libelle of toAdd) await api.post(`/memoires/${idMemoire}/checklist`, { libelle, categorie: 'general' }); fetchChecklist(idMemoire); }
        catch { fetchChecklist(idMemoire); }
    };

    const supprimerItem = async (id_item) => {
        const item = items.find(i => i.id_item === id_item);
        setItems(prev => prev.filter(i => i.id_item !== id_item)); setTotal(prev => prev - 1);
        if (item?.est_complete) setCompletes(prev => prev - 1);
        try { await api.delete(`/memoires/${idMemoire}/checklist/${id_item}`); }
        catch { fetchChecklist(idMemoire); }
    };

    const sauvegarderEdit = async (item) => {
        const texte = editText.trim(); setEditId(null);
        if (!texte || texte === item.libelle) return;
        setItems(prev => prev.map(i => i.id_item === item.id_item ? { ...i, libelle: texte } : i));
        try { await api.patch(`/memoires/${idMemoire}/checklist/${item.id_item}`, { libelle: texte }); }
        catch { setItems(prev => prev.map(i => i.id_item === item.id_item ? { ...i, libelle: item.libelle } : i)); }
    };

    const existantes = items.map(i => i.libelle);
    const predDisponibles = ETAPES_PREDEFINIES.filter(e => !existantes.includes(e));

    return (
        <div style={cp.wrap}>
            <div style={cp.progZone}>
                <div style={cp.progRow}>
                    <span style={cp.progLabel}>📋 Checklist</span>
                    <span style={{ ...cp.progPct, color: couleurBarre }}>{taux}%</span>
                </div>
                <div style={cp.track}><div style={{ ...cp.fill, width: `${taux}%`, backgroundColor: couleurBarre }} /></div>
                <div style={cp.progSub}>{completes} / {total} étape{total !== 1 ? 's' : ''}</div>
            </div>
            <div style={cp.body}>
                {loading ? <div style={cp.center}>⏳ Chargement…</div> : items.length === 0 ? (
                    <div style={cp.center}><div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📋</div><div style={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center' }}>Aucune étape.<br />Ajoutez-en ci-dessous.</div></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {items.map(item => (
                            <div key={item.id_item} style={{ ...cp.item, backgroundColor: item.est_complete ? '#f0faf4' : '#fafafa', borderColor: item.est_complete ? '#c8e6c9' : '#ebebeb', opacity: saving === item.id_item ? 0.7 : 1 }}>
                                <button onClick={() => toggleItem(item)} style={{ ...cp.check, backgroundColor: item.est_complete ? '#2e7d32' : '#fff', borderColor: item.est_complete ? '#2e7d32' : '#ccc' }}>
                                    {saving === item.id_item ? '·' : item.est_complete ? '✓' : ''}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {editId === item.id_item ? (
                                        <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onBlur={() => sauvegarderEdit(item)} onKeyDown={e => { if (e.key === 'Enter') sauvegarderEdit(item); if (e.key === 'Escape') setEditId(null); }} style={cp.inlineInput} />
                                    ) : (
                                        <span style={{ ...cp.label, textDecoration: item.est_complete ? 'line-through' : 'none', color: item.est_complete ? '#bbb' : '#333' }} onDoubleClick={() => { setEditId(item.id_item); setEditText(item.libelle); }} title="Double-clic pour modifier">{item.libelle}</span>
                                    )}
                                    {/* ✅ FIX : formatDateLocale pour afficher heure locale (UTC+1 Bénin) */}
                                    {item.est_complete && item.date_completion && (
                                        <div style={{ fontSize: '0.6rem', color: '#81c784', marginTop: '1px' }}>
                                            ✓ {formatDateLocale(item.date_completion)}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => { setEditId(item.id_item); setEditText(item.libelle); }} style={cp.btnIco} title="Modifier">✏️</button>
                                <button onClick={() => supprimerItem(item.id_item)} style={cp.btnIco} title="Supprimer">✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div style={cp.footer}>
                {ajoutMode === null && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setAjoutMode('libre')} style={cp.btnAdd}>✍️ Libre</button>
                        {predDisponibles.length > 0 && <button onClick={() => setAjoutMode('predefined')} style={{ ...cp.btnAdd, flex: 'none' }} title="Suggestions">📋 Suggestions</button>}
                    </div>
                )}
                {ajoutMode === 'libre' && (
                    <div style={cp.ajoutBox}>
                        <input ref={libreRef} value={libreText} onChange={e => setLibreText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ajouterLibre(); if (e.key === 'Escape') setAjoutMode(null); }} placeholder="Décrire l'étape… (Entrée pour valider)" style={cp.inputLibre} />
                        <div style={{ display: 'flex', gap: '6px', marginTop: '7px' }}>
                            <button onClick={ajouterLibre} style={cp.btnConfirm} disabled={!libreText.trim()}>Ajouter</button>
                            <button onClick={() => { setAjoutMode(null); setLibreText(''); }} style={cp.btnCancel}>Annuler</button>
                        </div>
                    </div>
                )}
                {ajoutMode === 'predefined' && (
                    <div style={cp.ajoutBox}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1a6b3c', marginBottom: '7px' }}>Cochez les étapes à ajouter :</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                            {predDisponibles.map(libelle => {
                                const checked = predCoches.includes(libelle);
                                return (
                                    <label key={libelle} style={{ ...cp.predRow, backgroundColor: checked ? '#e8f5e9' : '#fff', borderColor: checked ? '#a5d6a7' : '#eee', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={checked} onChange={() => setPredCoches(prev => prev.includes(libelle) ? prev.filter(l => l !== libelle) : [...prev, libelle])} style={{ accentColor: '#1a6b3c', flexShrink: 0, marginTop: '1px' }} />
                                        <span style={{ fontSize: '0.77rem', color: '#333', lineHeight: 1.35 }}>{libelle}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <button onClick={ajouterPredefinies} style={{ ...cp.btnConfirm, opacity: predCoches.length === 0 ? 0.45 : 1 }} disabled={predCoches.length === 0}>Ajouter {predCoches.length > 0 ? `(${predCoches.length})` : ''}</button>
                            <button onClick={() => { setAjoutMode(null); setPredCoches([]); }} style={cp.btnCancel}>Annuler</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const cp = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden', minWidth: 0 },
    progZone: { padding: '1rem 1.1rem 0.85rem', backgroundColor: '#f8fdf9', borderBottom: '1px solid #e8f5e9', flexShrink: 0 },
    progRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' },
    progLabel: { fontSize: '0.82rem', fontWeight: '700', color: '#1a1a2e' },
    progPct: { fontSize: '1.5rem', fontWeight: '800', lineHeight: 1 },
    track: { width: '100%', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '99px', overflow: 'hidden' },
    fill: { height: '100%', borderRadius: '99px', transition: 'width 0.5s ease' },
    progSub: { fontSize: '0.68rem', color: '#aaa', marginTop: '4px' },
    body: { flex: 1, overflowY: 'auto', padding: '0.85rem 1rem' },
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#bbb', fontSize: '0.78rem' },
    item: { display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 8px', borderRadius: '8px', border: '1px solid #ebebeb', transition: 'background 0.12s' },
    check: { width: '18px', height: '18px', minWidth: '18px', borderRadius: '4px', border: '2px solid #ccc', color: '#fff', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', padding: 0, transition: 'all 0.15s' },
    label: { fontSize: '0.78rem', lineHeight: 1.35, wordBreak: 'break-word' },
    inlineInput: { width: '100%', fontSize: '0.78rem', border: '1px solid #a5d6a7', borderRadius: '5px', padding: '2px 6px', outline: 'none', backgroundColor: '#f1f8e9', boxSizing: 'border-box' },
    btnIco: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: '#ccc', padding: '2px 3px', lineHeight: 1, flexShrink: 0 },
    footer: { padding: '0.7rem 1rem', borderTop: '1px solid #f0f0f0', flexShrink: 0 },
    btnAdd: { flex: 1, padding: '7px 10px', backgroundColor: 'transparent', color: '#1a6b3c', border: '1.5px dashed #a5d6a7', borderRadius: '9px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
    ajoutBox: { backgroundColor: '#f8fdf9', borderRadius: '10px', padding: '10px', border: '1px solid #e8f5e9' },
    inputLibre: { width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' },
    predRow: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', borderRadius: '7px', border: '1px solid #eee', transition: 'background 0.1s' },
    btnConfirm: { flex: 1, padding: '7px', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' },
    btnCancel: { padding: '7px 12px', backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' },
};

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function DashboardEncadrant() {
    const [memoires, setMemoires] = useState([]);
    const [memoireSelectionne, setMemoireSelectionne] = useState(null);
    const [versions, setVersions] = useState([]);
    const [versionActive, setVersionActive] = useState(null);
    const [modeAnnotation, setModeAnnotation] = useState(false);
    const [modeVisualisation, setModeVisualisation] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');
    const [chargementAnnotateur, setChargementAnnotateur] = useState(null);

    const [archivesParMemoire, setArchivesParMemoire] = useState(() => {
        try { return JSON.parse(localStorage.getItem('enc_versions_archivees') || '{}'); } catch { return {}; }
    });
    const [archivesOuvertes, setArchivesOuvertes] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(s);
    }, []);

    useEffect(() => {
        api.get('/memoires').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setMemoires(data);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        localStorage.setItem('enc_versions_archivees', JSON.stringify(archivesParMemoire));
    }, [archivesParMemoire]);

    const archiveesActuelles = memoireSelectionne
        ? (archivesParMemoire[memoireSelectionne.id_memoire] || [])
        : [];

    const archiverVersion = (idVersion) => {
        const idMem = memoireSelectionne.id_memoire;
        setArchivesParMemoire(prev => ({
            ...prev,
            [idMem]: [...(prev[idMem] || []), idVersion],
        }));
        setMessage('🗄 Version archivée.');
        setTimeout(() => setMessage(''), 3000);
    };

    const desarchiverVersion = (idVersion) => {
        const idMem = memoireSelectionne.id_memoire;
        setArchivesParMemoire(prev => ({
            ...prev,
            [idMem]: (prev[idMem] || []).filter(id => id !== idVersion),
        }));
        setMessage('↩️ Version restaurée dans l\'historique.');
        setTimeout(() => setMessage(''), 3000);
    };

    const peutArchiver = (statut) => statut === 'rejete' || statut === 'accepte';

    const telecharger = async (url) => {
        if (!url) return;
        try {
            const r = await fetch(url); const blob = await r.blob();
            const burl = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = burl; a.download = 'memoire.pdf';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            window.URL.revokeObjectURL(burl);
        } catch { window.open(url, '_blank'); }
    };

    const [chargementPlagiat, setChargementPlagiat] = useState(null);
    const [rapportPlagiat, setRapportPlagiat] = useState(null);

    const verifierPlagiat = async (v) => {
        setChargementPlagiat(v.id_version);
        setErreur('');
        try {
            const res = await api.post(`/memoires/${memoireSelectionne.id_memoire}/versions/${v.id_version}/verifier-plagiat`);
            setRapportPlagiat({ version: v, data: res.data });
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la vérification du plagiat.');
        } finally {
            setChargementPlagiat(null);
        }
    };

    const selectionnerMemoire = (m) => {
        setMemoireSelectionne(m);
        setVersions([]);
        setLoadingVersions(true);
        setVersionActive(null);
        setModeAnnotation(false);
        setModeVisualisation(false);
        setMessage('');
        setErreur('');
        setArchivesOuvertes(false);
        setRapportPlagiat(null);
        api.get('/memoires/' + m.id_memoire + '/versions')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : res.data.data || [];
                setVersions(data);
            })
            .finally(() => setLoadingVersions(false));
    };

    const chargerVersions = (id) => {
        api.get('/memoires/' + id + '/versions').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setVersions(data);
        });
    };

    const accepterVersion = async (v) => {
        setMessage(''); setErreur('');
        setVersions(prev => prev.map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'accepte' } : ver));
        setMemoires(prev => prev.map(m => m.id_memoire === memoireSelectionne.id_memoire ? {
            ...m,
            versions: (m.versions || []).map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'accepte' } : ver)
        } : m));
        setMessage('Version acceptée ✅');
        try { await api.patch('/memoires/' + memoireSelectionne.id_memoire + '/versions/' + v.id_version + '/statut', { statut_version: 'accepte' }); }
        catch (err) {
            setVersions(prev => prev.map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'soumis' } : ver));
            setMemoires(prev => prev.map(m => m.id_memoire === memoireSelectionne.id_memoire ? {
                ...m,
                versions: (m.versions || []).map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'soumis' } : ver)
            } : m));
            setMessage(''); setErreur(err.response?.data?.message || 'Erreur.');
        }
    };

    const rejeterVersion = async (v) => {
        setMessage(''); setErreur('');
        setVersions(prev => prev.map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'rejete' } : ver));
        setMemoires(prev => prev.map(m => m.id_memoire === memoireSelectionne.id_memoire ? {
            ...m,
            versions: (m.versions || []).map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'rejete' } : ver)
        } : m));
        setMessage('Version rejetée ❌. Vous pouvez maintenant l\'annoter.');
        try { await api.patch('/memoires/' + memoireSelectionne.id_memoire + '/versions/' + v.id_version + '/statut', { statut_version: 'rejete' }); }
        catch (err) {
            setVersions(prev => prev.map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'soumis' } : ver));
            setMemoires(prev => prev.map(m => m.id_memoire === memoireSelectionne.id_memoire ? {
                ...m,
                versions: (m.versions || []).map(ver => ver.id_version === v.id_version ? { ...ver, statut_version: 'soumis' } : ver)
            } : m));
            setMessage(''); setErreur(err.response?.data?.message || 'Erreur.');
        }
    };

    const couleurStatut = (statut) => {
        const map = {
            en_cours: { bg: '#e3f2fd', color: '#1565c0', label: 'En cours' },
            soumis:   { bg: '#fff8e1', color: '#f0a500', label: 'Soumis'   },
            rejete:   { bg: '#fdecea', color: '#c62828', label: 'Rejeté'   },
            accepte:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Accepté'  },
            soutenu:  { bg: '#f3e5f5', color: '#6a1b9a', label: 'Soutenu'  },
        };
        return map[statut] || { bg: '#f5f5f5', color: '#555', label: statut };
    };

    const versionsVisibles  = versions.filter(v => !archiveesActuelles.includes(v.id_version));
    const versionsArchivees = versions.filter(v =>  archiveesActuelles.includes(v.id_version));

    const VersionCard = ({ v, index, isArchivee = false }) => {
        const statut = v.statut_version || v.statut;
        const cv = couleurStatut(statut);
        const lien = (v.url_fichier && v.url_fichier !== '')
            ? v.url_fichier
            : (v.chemin_fichier || null);
        const annots = v.annotations || [];
        const estSoumis = statut === 'soumis';
        const estRejete = statut === 'rejete';
        const enChargement = chargementAnnotateur === v.id_version;
        const numeroAffiche = versions.length - versions.findIndex(x => x.id_version === v.id_version);

        return (
            <div style={{ ...s.versionCard, ...(isArchivee ? s.versionCardArchivee : {}) }}>
                <div style={s.versionHeader}>
                    {isArchivee && <span style={s.archiveIconLabel}>🗄</span>}
                    <span style={s.versionNum}>Version {numeroAffiche}</span>
                    <span style={{ ...s.badgeSt, backgroundColor: cv.bg, color: cv.color }}>{cv.label}</span>
                    {/* ✅ FIX : formatDateLocale pour afficher la date en heure locale */}
                    <span style={s.versionDate}>📅 {formatDateLocale(v.date_depot)}</span>
                </div>
                <div style={s.versionActions}>
                    <button
                        className="btn-action"
                        style={{ ...s.btnVisu, opacity: lien ? 1 : 0.4, cursor: lien ? 'pointer' : 'not-allowed' }}
                        onClick={() => {
                            if (!lien) return;
                            setVersionActive({ ...v, statut_version: v.statut_version || v.statut });
                            setModeVisualisation(true);
                        }}
                        title={lien ? '' : 'Fichier non disponible'}
                    >
                        👁 Voir
                    </button>

                    <button
                        className="btn-action"
                        style={{ ...s.btnDl, opacity: lien ? 1 : 0.4 }}
                        onClick={() => lien && telecharger(lien)}
                    >
                        📥
                    </button>

                    <button className="btn-action" style={s.btnPlagiat} onClick={() => verifierPlagiat(v)} disabled={chargementPlagiat === v.id_version}>
                        {chargementPlagiat === v.id_version ? '⏳ Analyse...' : '🔍 Plagiat'}
                    </button>

                    {!isArchivee && estRejete && (
                        <button className="btn-action" style={{ ...s.btnAnnot, opacity: enChargement ? 0.6 : 1 }} onClick={() => { setVersionActive(v); setModeAnnotation(true); }} disabled={!!chargementAnnotateur}>
                            {enChargement ? '⏳' : '✏️ Annoter'}
                        </button>
                    )}

                    {!isArchivee && peutArchiver(statut) && (
                        <button className="btn-action" style={s.btnArchiver} onClick={() => archiverVersion(v.id_version)}>
                            🗄 Archiver
                        </button>
                    )}

                    {isArchivee && (
                        <button className="btn-action" style={s.btnDesarchiver} onClick={() => desarchiverVersion(v.id_version)}>
                            ↩️ Restaurer
                        </button>
                    )}
                </div>

                {annots.length > 0 && (
                    <div style={s.annotZone}>
                        <div style={s.annotTitre}>💬 {annots.length} annotation{annots.length > 1 ? 's' : ''}</div>
                        {annots.map((a, i) => (
                            <div key={a.id_annotation} style={s.annotRow}>
                                <div style={s.annotNum}>{i + 1}</div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: '#f0a500', fontWeight: '700' }}>Page {a.page}</div>
                                    <div style={{ fontSize: '0.76rem', color: '#555' }}>{a.texte_commentaire}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ===== MODE VISUALISATION =====
    if (modeVisualisation && versionActive) return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ marginLeft: '200px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {message && <div style={s.bannerSucces}>{message}</div>}
                {erreur   && <div style={s.bannerWarn}>{erreur}</div>}
                <VisualiseurPDF
                    version={versionActive}
                    memoire={memoireSelectionne}
                    statut={versionActive.statut_version || versionActive.statut}
                    onRetour={() => { setModeVisualisation(false); setVersionActive(null); }}
                    onAccepter={async () => {
                        await accepterVersion(versionActive);
                        setModeVisualisation(false);
                        setVersionActive(null);
                    }}
                    onRejeter={async () => {
                        await rejeterVersion(versionActive);
                    }}
                    onAnnoter={() => {
                        const versionRejetee = { ...versionActive, statut_version: 'rejete' };
                        setVersionActive(versionRejetee);
                        setModeVisualisation(false);
                        setModeAnnotation(true);
                    }}
                />
            </div>
        </div>
    );

    // ===== MODE ANNOTATION =====
    if (modeAnnotation && versionActive) return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ marginLeft: '200px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {erreur && <div style={s.bannerWarn}>{erreur}</div>}
                <AnnotateurPDF
                    version={versionActive} memoire={memoireSelectionne}
                    onRetour={() => { setModeAnnotation(false); setVersionActive(null); if (memoireSelectionne) chargerVersions(memoireSelectionne.id_memoire); }}
                    onAnnotationsEnvoyees={() => { setModeAnnotation(false); setVersionActive(null); setMessage('✅ Annotations envoyées !'); if (memoireSelectionne) chargerVersions(memoireSelectionne.id_memoire); }}
                    onAnnotationAjoutee={() => {}}
                />
            </div>
        </div>
    );

    // ===== VUE PRINCIPALE =====
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
                body { background: #f0f2f5; }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 99px; }
                .enc-layout { display: grid; grid-template-columns: minmax(260px, 320px) 1fr 270px; gap: 1rem; padding: 1.25rem 1.5rem; align-items: start; min-width: 0; }
                .enc-col { min-width: 0; max-height: calc(100vh - 80px); overflow-y: auto; position: sticky; top: 0; }
                .enc-col-check { min-width: 0; height: calc(100vh - 80px); position: sticky; top: 0; display: flex; flex-direction: column; }
                @media (max-width: 960px) { .enc-layout { grid-template-columns: 200px 1fr 230px; gap: 0.75rem; padding: 1rem; } }
                @media (max-width: 680px) { .enc-layout { grid-template-columns: 180px minmax(220px, 1fr) 210px; overflow-x: auto; padding: 0.75rem; gap: 0.75rem; } .enc-col, .enc-col-check { max-height: calc(100vh - 70px); height: calc(100vh - 70px); } }
                .memoire-row:hover { background-color: #e8f5ee !important; }
                .btn-action:hover { filter: brightness(0.93); }
            `}</style>

            <div style={s.page}>
                <Sidebar />
                <div style={s.main}>
                    <div style={s.header}>
                        <div>
                            <div style={s.headerTitre}>Mes mémoires</div>
                            <div style={s.headerSub}>Dashboard encadrant</div>
                        </div>
                        <div style={s.profilZone}>
                            <div style={s.profilInfo}>
                                <div style={s.profilNom}>{user.prenom} {user.nom}</div>
                                <div style={s.profilRole}>Encadrant</div>
                            </div>
                            <div style={s.profilAvatar}>{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</div>
                        </div>
                    </div>

                    {message && <div style={s.bannerSucces}>{message}</div>}
                    {erreur   && <div style={s.bannerErreur}>{erreur}</div>}

                    {/* Rapport plagiat */}
                    {rapportPlagiat && (
                        <div style={{
                            backgroundColor: '#fff', border: '1px solid #f8bbd0',
                            borderRadius: '12px', padding: '1rem', margin: '0 1.5rem 1rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ad1457' }}>
                                    🔍 Rapport plagiat — Version {rapportPlagiat.version.numero_version}
                                </span>
                                <button onClick={() => setRapportPlagiat(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem' }}>
                                    ✕
                                </button>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.75rem' }}>
                                {rapportPlagiat.data.nb_documents_compares} document(s) comparé(s)
                            </div>
                            {rapportPlagiat.data.resultats.length === 0 ? (
                                <div style={{ color: '#2e7d32', fontSize: '0.82rem', fontWeight: '600' }}>
                                    ✅ Aucune similarité significative détectée.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {rapportPlagiat.data.resultats.map((r, i) => (
                                        <div key={i} style={{
                                            padding: '0.6rem 0.85rem', borderRadius: '8px',
                                            backgroundColor: r.score >= 60 ? '#fdecea' : r.score >= 30 ? '#fff8e1' : '#f1f8e9',
                                            borderLeft: `3px solid ${r.score >= 60 ? '#c62828' : r.score >= 30 ? '#f0a500' : '#2e7d32'}`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1a1a2e' }}>
                                                    {r.etudiant || '—'} · v{r.numero_version}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.82rem', fontWeight: '800',
                                                    color: r.score >= 60 ? '#c62828' : r.score >= 30 ? '#f0a500' : '#2e7d32'
                                                }}>
                                                    {r.score}%
                                                </span>
                                            </div>
                                            {r.titre_memoire && (
                                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>{r.titre_memoire}</div>
                                            )}
                                            {r.passages?.length > 0 && (
                                                <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#555', fontStyle: 'italic' }}>
                                                    « {r.passages[0]} »
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#bbb', padding: '4rem', fontSize: '0.9rem' }}>⏳ Chargement…</div>
                    ) : (
                        <div className="enc-layout">

                            {/* ── Col 1 : Mémoires ── */}
                            <div className="enc-col">
                                <div style={s.card}>
                                    <div style={s.cardHead}>
                                        <span style={s.cardTitre}>📄 Thèmes de mémoires</span>
                                        <span style={s.badge2}>{memoires.length}</span>
                                    </div>
                                    {memoires.length === 0 ? <div style={s.vide}>Aucun mémoire assigné.</div> : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {[...memoires].sort((a, b) => {
                                                const dernieresSoumisA = (a.versions || []).filter(v => (v.statut_version || v.statut) === 'soumis');
                                                const dernieresSoumisB = (b.versions || []).filter(v => (v.statut_version || v.statut) === 'soumis');
                                                const hasSoumisA = dernieresSoumisA.length > 0;
                                                const hasSoumisB = dernieresSoumisB.length > 0;
                                                if (hasSoumisA && !hasSoumisB) return -1;
                                                if (!hasSoumisA && hasSoumisB) return 1;
                                                if (hasSoumisA && hasSoumisB) {
                                                    const dateA = Math.max(...dernieresSoumisA.map(v => new Date(v.date_depot).getTime()));
                                                    const dateB = Math.max(...dernieresSoumisB.map(v => new Date(v.date_depot).getTime()));
                                                    return dateB - dateA;
                                                }
                                                return 0;
                                            }).map(m => {
                                                const c = couleurStatut(m.statut);
                                                const etudiant = m.encadreurs?.[0]?.etudiant?.utilisateur;
                                                const actif = memoireSelectionne?.id_memoire === m.id_memoire;
                                                const aVersionSoumise = (m.versions || []).some(v => (v.statut_version || v.statut) === 'soumis');
                                                const versionsSoumises = (m.versions || []).filter(v => (v.statut_version || v.statut) === 'soumis');
                                                const dateDernieresoumission = versionsSoumises.length > 0
                                                    ? new Date(Math.max(...versionsSoumises.map(v => new Date(v.date_depot).getTime())))
                                                    : null;
                                                return (
                                                    <div key={m.id_memoire} className="memoire-row" onClick={() => selectionnerMemoire(m)} style={{
                                                        ...s.memoireRow,
                                                        borderLeft: actif ? '3px solid #1a6b3c' : aVersionSoumise ? '3px solid #f0a500' : '3px solid transparent',
                                                        backgroundColor: actif ? '#e8f5ee' : '#f8f9fa'
                                                    }}>
                                                        <div style={s.memTitre}>{m.titre}</div>
                                                        <div style={s.memEtu}>👤 {etudiant ? `${etudiant.prenom} ${etudiant.nom}` : '—'}</div>
                                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <span style={{ ...s.badgeSt, backgroundColor: c.bg, color: c.color }}>{c.label}</span>
                                                            {aVersionSoumise && (
                                                                <span style={{ ...s.badgeSt, backgroundColor: '#fff8e1', color: '#f0a500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    📨 Soumis
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* ✅ FIX PRINCIPAL : formatDateHeureLocale pour afficher date+heure en UTC+1 */}
                                                        {aVersionSoumise && dateDernieresoumission && (
                                                            <div style={{
                                                                fontSize: '0.65rem', color: '#b45309', backgroundColor: '#fef3c7',
                                                                padding: '2px 7px', borderRadius: '20px', marginTop: '2px',
                                                                display: 'inline-flex', alignItems: 'center', gap: '3px', alignSelf: 'flex-start'
                                                            }}>
                                                                🕐 {formatDateHeureLocale(dateDernieresoumission)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Col 2 : Versions ── */}
                            <div className="enc-col">
                                {!memoireSelectionne ? (
                                    <div style={{ ...s.card, textAlign: 'center', padding: '3.5rem 1rem' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👈</div>
                                        <p style={{ color: '#bbb', fontSize: '0.85rem' }}>Sélectionnez un mémoire</p>
                                    </div>
                                ) : (
                                    <div style={s.card}>
                                        <div style={s.cardHead}>
                                            <span style={s.cardTitre}>📁 Versions</span>
                                            <span style={s.badge2}>
                                                {loadingVersions ? '⏳' : versionsVisibles.length}
                                            </span>
                                        </div>

                                        {loadingVersions ? (
                                            <div style={s.vide}>⏳ Chargement des versions…</div>
                                        ) : versionsVisibles.length === 0 ? (
                                            <div style={s.vide}>
                                                {versions.length > 0 ? 'Toutes les versions sont archivées.' : 'Aucune version déposée.'}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                {versionsVisibles.map((v, index) => (
                                                    <VersionCard key={v.id_version} v={v} index={index} />
                                                ))}
                                            </div>
                                        )}

                                        {!loadingVersions && versionsArchivees.length > 0 && (
                                            <div style={s.archivesSection}>
                                                <button style={s.archivesToggle} onClick={() => setArchivesOuvertes(o => !o)}>
                                                    <span>🗄 Archives ({versionsArchivees.length})</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#999' }}>{archivesOuvertes ? '▲' : '▼'}</span>
                                                </button>
                                                {archivesOuvertes && (
                                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#aaa', fontStyle: 'italic', margin: 0 }}>
                                                            Versions traitées archivées — disponibles en consultation.
                                                        </p>
                                                        {versionsArchivees.map((v, index) => (
                                                            <VersionCard key={v.id_version} v={v} index={index} isArchivee={true} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Col 3 : Checklist ── */}
                            <div className="enc-col-check">
                                {memoireSelectionne ? (
                                    <ChecklistPanel key={memoireSelectionne.id_memoire} idMemoire={memoireSelectionne.id_memoire} />
                                ) : (
                                    <div style={{ ...s.card, textAlign: 'center', padding: '2rem 1rem', color: '#ccc' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                                        <div style={{ fontSize: '0.78rem' }}>Sélectionnez un mémoire<br />pour voir la checklist</div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function Sidebar() {
    return (
        <div style={s.sidebar}>
            <div style={s.logoZone}><Logo size={68} showText={false} /></div>
            <nav style={s.nav}>
                <div style={s.menuActif}><span>📄</span>Mémoires</div>
                <button style={s.menuItem} onClick={() => window.location.href = '/dashboard/encadrant/profil'}><span>👤</span>Profil</button>
            </nav>
            <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>UATM GASA · Encadrant</div>
            </div>
        </div>
    );
}

const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    sidebar: { width: '200px', minHeight: '100vh', backgroundColor: '#1a6b3c', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
    logoZone: { display: 'flex', justifyContent: 'center', padding: '1.1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    nav: { display: 'flex', flexDirection: 'column', gap: '3px', padding: '0.85rem 0.65rem', flex: 1 },
    menuActif: { display: 'flex', alignItems: 'center', gap: '9px', padding: '0.65rem 0.9rem', borderRadius: '9px', backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.84rem', fontWeight: '700' },
    menuItem: { display: 'flex', alignItems: 'center', gap: '9px', padding: '0.65rem 0.9rem', borderRadius: '9px', color: 'rgba(255,255,255,0.65)', background: 'none', border: 'none', fontSize: '0.84rem', fontWeight: '500', cursor: 'pointer', width: '100%', textAlign: 'left' },
    main: { marginLeft: '200px', flex: 1, minWidth: 0 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    headerTitre: { fontSize: '1.1rem', fontWeight: '800', color: '#1a1a2e' },
    headerSub: { fontSize: '0.7rem', color: '#bbb', marginTop: '1px' },
    profilZone: { display: 'flex', alignItems: 'center', gap: '10px' },
    profilInfo: { textAlign: 'right' },
    profilNom: { fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e' },
    profilRole: { fontSize: '0.68rem', color: '#bbb' },
    profilAvatar: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: '800', flexShrink: 0 },
    bannerSucces: { backgroundColor: '#e8f5ee', color: '#1a6b3c', padding: '0.6rem 1.5rem', fontSize: '0.82rem', fontWeight: '500', borderBottom: '1px solid #c8e6c9' },
    bannerErreur: { backgroundColor: '#fdecea', color: '#c62828', padding: '0.6rem 1.5rem', fontSize: '0.82rem', fontWeight: '500', borderBottom: '1px solid #ffcdd2' },
    bannerWarn: { backgroundColor: '#fff8e1', color: '#e65100', padding: '0.6rem 1.5rem', fontSize: '0.82rem', fontWeight: '500', borderBottom: '1px solid #ffe082', flexShrink: 0 },
    card: { backgroundColor: '#fff', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' },
    cardTitre: { fontSize: '0.88rem', fontWeight: '700', color: '#1a1a2e' },
    badge2: { backgroundColor: '#f0f2f5', color: '#666', fontSize: '0.68rem', fontWeight: '700', padding: '2px 7px', borderRadius: '99px' },
    vide: { color: '#ccc', textAlign: 'center', padding: '1.5rem', fontSize: '0.82rem' },
    memoireRow: { padding: '0.7rem 0.8rem', borderRadius: '9px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', transition: 'background 0.12s' },
    memTitre: { fontSize: '0.8rem', fontWeight: '600', color: '#1a1a2e', lineHeight: 1.3 },
    memEtu: { fontSize: '0.7rem', color: '#aaa' },
    badgeSt: { padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700', alignSelf: 'flex-start' },
    versionCard: { border: '1px solid #f0f0f0', borderRadius: '11px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', backgroundColor: '#fdfdfd' },
    versionCardArchivee: { border: '1px dashed #ddd', backgroundColor: '#fafafa', opacity: 0.88 },
    versionHeader: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    archiveIconLabel: { fontSize: '0.8rem' },
    versionNum: { fontSize: '0.84rem', fontWeight: '700', color: '#1a1a2e' },
    versionDate: { fontSize: '0.72rem', color: '#bbb', marginLeft: 'auto' },
    versionActions: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
    btnVisu: { padding: '4px 10px', backgroundColor: '#f3e5f5', color: '#6a1b9a', border: '1.5px solid #e1bee7', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' },
    btnDl: { padding: '4px 9px', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: '7px', fontSize: '0.74rem', cursor: 'pointer' },
    btnOk: { padding: '4px 10px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1.5px solid #c8e6c9', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' },
    btnKo: { padding: '4px 10px', backgroundColor: '#fdecea', color: '#c62828', border: '1.5px solid #ffcdd2', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' },
    btnAnnot: { padding: '4px 10px', backgroundColor: '#fff8e1', color: '#e65100', border: '1.5px solid #ffe082', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' },
    btnPlagiat: { padding: '4px 10px', backgroundColor: '#fce4ec', color: '#ad1457', border: '1px solid #f8bbd0', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer' },
    btnArchiver:    { padding: '4px 10px', backgroundColor: '#f0f4ff', color: '#3949ab', border: '1px solid #c5cae9', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer' },
    btnDesarchiver: { padding: '4px 10px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '7px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer' },
    annotZone: { backgroundColor: '#fffde7', borderRadius: '8px', padding: '0.55rem 0.7rem', borderLeft: '3px solid #f0a500' },
    annotTitre: { fontSize: '0.72rem', fontWeight: '700', color: '#f0a500', marginBottom: '5px' },
    annotRow: { display: 'flex', gap: '7px', marginBottom: '4px', alignItems: 'flex-start' },
    annotNum: { width: '17px', height: '17px', borderRadius: '50%', backgroundColor: '#f0a500', color: '#fff', fontSize: '0.58rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    archivesSection: { marginTop: '1rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.85rem' },
    archivesToggle: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', color: '#555' },
};