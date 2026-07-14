// PanneauFile.jsx
// Panneau flottant qui affiche la file d'attente + notifications
import { useState } from 'react';

const COULEUR_STATUT = {
    en_attente: { bg: '#fff8e1', color: '#f57f17', label: '⏳ En attente',  dot: '#f0a500' },
    en_cours:   { bg: '#e3f2fd', color: '#1565c0', label: '📤 En cours',    dot: '#1565c0' },
    succes:     { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Déposé',       dot: '#2e7d32' },
    echec:      { bg: '#fdecea', color: '#c62828', label: '❌ Échec',        dot: '#c62828' },
};

// ── Badge flottant (bouton d'ouverture) ─────────────────────────────────────
export function BadgeFile({ stats, onClick }) {
    if (!stats.actif && stats.total === 0) return null;

    const bgColor = stats.enCours  ? '#1565c0'
                  : stats.echec    ? '#c62828'
                  : stats.enAttente ? '#f0a500'
                  : '#2e7d32';

    return (
        <button onClick={onClick} style={{ ...s.badge, backgroundColor: bgColor }}>
            {stats.enCours > 0
                ? `📤 ${stats.enCours} envoi${stats.enCours > 1 ? 's' : ''}…`
                : stats.enAttente > 0
                ? `⏳ ${stats.enAttente} en attente`
                : stats.echec > 0
                ? `❌ ${stats.echec} erreur${stats.echec > 1 ? 's' : ''}`
                : `✅ ${stats.succes} déposé${stats.succes > 1 ? 's' : ''}`}
            {stats.actif && <span style={s.pulseDot} />}
        </button>
    );
}

// ── Toasts de notification ───────────────────────────────────────────────────
export function ToastsNotification({ notifications, onDismiss }) {
    if (notifications.length === 0) return null;
    return (
        <div style={s.toastsContainer}>
            {notifications.map(n => (
                <div key={n.id} style={{
                    ...s.toast,
                    borderLeft: `4px solid ${n.type === 'succes' ? '#2e7d32' : '#c62828'}`,
                    backgroundColor: n.type === 'succes' ? '#f0faf4' : '#fff5f5',
                }}>
                    <span style={s.toastTexte}>{n.texte}</span>
                    <button style={s.toastClose} onClick={() => onDismiss(n.id)}>✕</button>
                </div>
            ))}
        </div>
    );
}

// ── Panneau complet ──────────────────────────────────────────────────────────
export function PanneauFile({ file, stats, onAnnuler, onClose }) {
    const [filtre, setFiltre] = useState('tous');

    const jobsFiltres = filtre === 'tous'
        ? file
        : file.filter(j => j.statut === filtre);

    return (
        <div style={s.panneauOverlay} onClick={onClose}>
            <div style={s.panneau} onClick={e => e.stopPropagation()}>

                {/* En-tête */}
                <div style={s.panneauHeader}>
                    <div>
                        <div style={s.panneauTitre}>📁 File d'envoi</div>
                        <div style={s.panneauSous}>
                            {stats.enCours > 0   && <span style={{ color: '#1565c0' }}>{stats.enCours} en cours · </span>}
                            {stats.enAttente > 0  && <span style={{ color: '#f0a500' }}>{stats.enAttente} en attente · </span>}
                            {stats.succes > 0     && <span style={{ color: '#2e7d32' }}>{stats.succes} réussi · </span>}
                            {stats.echec > 0      && <span style={{ color: '#c62828' }}>{stats.echec} échoué</span>}
                        </div>
                    </div>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Filtres */}
                <div style={s.filtres}>
                    {['tous', 'en_attente', 'en_cours', 'succes', 'echec'].map(f => (
                        <button
                            key={f}
                            style={{ ...s.filtrBtn, ...(filtre === f ? s.filtrActif : {}) }}
                            onClick={() => setFiltre(f)}
                        >
                            {f === 'tous'        ? `Tous (${stats.total})`
                            : f === 'en_attente' ? `⏳ Attente (${stats.enAttente})`
                            : f === 'en_cours'   ? `📤 En cours (${stats.enCours})`
                            : f === 'succes'     ? `✅ Réussis (${stats.succes})`
                            :                      `❌ Échecs (${stats.echec})`}
                        </button>
                    ))}
                </div>

                {/* Liste des jobs */}
                <div style={s.jobsListe}>
                    {jobsFiltres.length === 0 ? (
                        <p style={s.vide}>Aucun fichier dans cette catégorie.</p>
                    ) : jobsFiltres.map(job => {
                        const cs = COULEUR_STATUT[job.statut] || COULEUR_STATUT.en_attente;
                        return (
                            <div key={job.id} style={s.jobCard}>
                                <div style={s.jobTop}>
                                    <div style={s.jobNom} title={job.label}>
                                        📄 {job.label.length > 35 ? job.label.slice(0, 33) + '…' : job.label}
                                    </div>
                                    <span style={{ ...s.jobBadge, backgroundColor: cs.bg, color: cs.color }}>
                                        {cs.label}
                                    </span>
                                    {job.statut === 'en_attente' && (
                                        <button style={s.annulerBtn} onClick={() => onAnnuler(job.id)}>✕</button>
                                    )}
                                </div>

                                {/* Barre de progression pour les jobs actifs */}
                                {(job.statut === 'en_cours' || job.statut === 'succes') && (
                                    <div style={s.jobProgressTrack}>
                                        <div style={{
                                            ...s.jobProgressBar,
                                            width: job.progression + '%',
                                            backgroundColor: job.statut === 'succes' ? '#2e7d32' : '#1565c0',
                                        }} />
                                    </div>
                                )}

                                {job.statut === 'en_cours' && (
                                    <div style={s.jobPct}>{job.progression}% envoyé</div>
                                )}

                                {job.statut === 'echec' && job.erreur && (
                                    <div style={s.jobErreur}>{job.erreur}</div>
                                )}

                                <div style={s.jobDate}>
                                    Ajouté à {job.dateAjout.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
const s = {
    // Badge flottant
    badge: {
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 3000,
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 18px', borderRadius: '999px',
        color: '#fff', fontWeight: '700', fontSize: '0.85rem',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s',
    },
    pulseDot: {
        display: 'inline-block', width: '8px', height: '8px',
        borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)',
        animation: 'pulse 1.4s infinite',
    },

    // Toasts
    toastsContainer: {
        position: 'fixed', bottom: '80px', right: '24px', zIndex: 3000,
        display: 'flex', flexDirection: 'column', gap: '8px',
        maxWidth: '380px',
    },
    toast: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '12px 14px', borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '0.85rem',
        animation: 'slideIn 0.25s ease',
    },
    toastTexte: { flex: 1, lineHeight: 1.5 },
    toastClose: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#999', fontSize: '1rem', padding: 0, flexShrink: 0,
    },

    // Panneau
    panneauOverlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        zIndex: 2500, padding: '24px',
    },
    panneau: {
        backgroundColor: '#fff', borderRadius: '16px',
        width: '420px', maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
    },
    panneauHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '1.25rem 1.25rem 0.75rem',
        borderBottom: '1px solid #f0f0f0',
    },
    panneauTitre: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '2px' },
    panneauSous:  { fontSize: '0.78rem' },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '1.1rem',
        cursor: 'pointer', color: '#999', padding: 0, marginTop: '2px',
    },

    // Filtres
    filtres: {
        display: 'flex', gap: '6px', padding: '0.75rem 1.25rem',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '1px solid #f5f5f5',
    },
    filtrBtn: {
        whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: '20px',
        border: '1px solid #e0e0e0', backgroundColor: '#f5f5f5',
        color: '#666', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer',
    },
    filtrActif: {
        backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c',
    },

    // Jobs
    jobsListe: { overflowY: 'auto', flex: 1, padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    vide: { color: '#bbb', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' },
    jobCard: {
        border: '1px solid #eee', borderRadius: '10px',
        padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px',
    },
    jobTop: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    jobNom: { fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e', flex: 1, minWidth: 0 },
    jobBadge: {
        padding: '2px 8px', borderRadius: '20px',
        fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap',
    },
    annulerBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#c62828', fontSize: '0.8rem', fontWeight: '700', padding: '0 2px',
    },
    jobProgressTrack: {
        height: '6px', backgroundColor: '#e0e0e0',
        borderRadius: '999px', overflow: 'hidden',
    },
    jobProgressBar: {
        height: '100%', borderRadius: '999px',
        transition: 'width 0.3s ease, background-color 0.3s',
    },
    jobPct:   { fontSize: '0.72rem', color: '#1565c0', fontWeight: '600' },
    jobErreur:{ fontSize: '0.75rem', color: '#c62828', lineHeight: 1.4 },
    jobDate:  { fontSize: '0.68rem', color: '#bbb' },
};