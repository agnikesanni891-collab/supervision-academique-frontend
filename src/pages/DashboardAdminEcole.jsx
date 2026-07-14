import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function DashboardAdminEcole() {
    const [stats, setStats] = useState({
        total: 0, en_cours: 0, soutenu: 0,
    });
    const [memoires, setMemoires] = useState([]);
    const [memoiresFiltres, setMemoiresFiltres] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState('Tous');
    const [filtreFiliere, setFiltreFiliere] = useState('');
    const [recherche, setRecherche] = useState('');
    const [statsParFiliere, setStatsParFiliere] = useState([]);

    useEffect(() => {
        api.get('/memoires').then((res) => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setMemoires(data);
            setMemoiresFiltres(data);
            setStats({
                total:    data.length,
                cree:     data.filter(m => m.statut === 'cree').length,
                en_cours: data.filter(m => m.statut === 'en_cours').length,
                soutenu:  data.filter(m => m.statut === 'soutenu').length,
            });
        }).finally(() => setLoading(false));

        api.get('/filieres').then((res) => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setFilieres(data);
        }).catch(() => setFilieres([]));
    }, []);

    // Stats par filière — cree séparé de en_cours
    useEffect(() => {
        if (!filieres.length) return;
        const result = filieres.map(f => {
            const mF      = memoires.filter(m => m.filiere && m.filiere.id_filiere === f.id_filiere);
            const valides  = mF.filter(m => m.statut === 'soutenu').length;
            const en_cours = mF.filter(m => m.statut === 'en_cours').length;
            const cree     = mF.filter(m => m.statut === 'cree').length;
            return {
                id: f.id_filiere,
                libelle: f.libelle_filiere,
                total: mF.length,
                valides,
                en_cours,
                cree,
            };
        });
        setStatsParFiliere(result);
    }, [memoires, filieres]);

    useEffect(() => {
        let result = memoires;
        if (filtreStatut !== 'Tous') {
            result = result.filter(m => m.statut === filtreStatut);
        }
        if (filtreFiliere) {
            result = result.filter(m => m.filiere && String(m.filiere.id_filiere) === filtreFiliere);
        }
        if (recherche) {
            const r = recherche.toLowerCase();
            result = result.filter(m =>
                m.titre.toLowerCase().includes(r) ||
                (m.encadreurs && m.encadreurs[0] && m.encadreurs[0].etudiant &&
                 m.encadreurs[0].etudiant.utilisateur &&
                 (m.encadreurs[0].etudiant.utilisateur.nom.toLowerCase().includes(r) ||
                  m.encadreurs[0].etudiant.utilisateur.prenom.toLowerCase().includes(r)))
            );
        }
        setMemoiresFiltres(result);
    }, [filtreStatut, filtreFiliere, recherche, memoires]);

    const couleurStatut = (statut) => {
        const map = {
            cree:     { bg: '#fff8e1', color: '#f57f17', label: 'Créé' },
            en_cours: { bg: '#e3f2fd', color: '#1565c0', label: 'En cours' },
            soutenu:  { bg: '#e8f5ee', color: '#1a6b3c', label: 'Validé' },
        };
        return map[statut] || { bg: '#f5f5f5', color: '#555', label: statut };
    };

    const statsConfig = [
        { label: 'Total mémoires', valeur: stats.total,    color: '#1a6b3c', bg: '#e8f5ee', icon: '📚', filtre: 'Tous' },
        { label: 'Créés',          valeur: stats.cree,     color: '#f57f17', bg: '#fff8e1', icon: '📝', filtre: 'cree' },
        { label: 'En cours',       valeur: stats.en_cours, color: '#1565c0', bg: '#e3f2fd', icon: '⏳', filtre: 'en_cours' },
        { label: 'Validés',        valeur: stats.soutenu,  color: '#1a6b3c', bg: '#e8f5ee', icon: '🎓', filtre: 'soutenu' },
    ];

    const statuts = ['Tous', 'cree', 'en_cours', 'soutenu'];

    const palettes = [
        { bg: '#E1F5EE', nom: '#085041', div: '#0F6E56', b1: '#9FE1CB', b2: '#fff8e1', b3: '#5DCAA5', b4: '#1D9E75', v1: '#04342C', v2: '#f57f17', v3: '#04342C', v4: '#04342C', lbl1: '#0F6E56', lbl2: '#f57f17', lbl3: '#0F6E56', lbl4: '#0F6E56' },
        { bg: '#E6F1FB', nom: '#042C53', div: '#185FA5', b1: '#B5D4F4', b2: '#fff8e1', b3: '#85B7EB', b4: '#378ADD', v1: '#042C53', v2: '#f57f17', v3: '#042C53', v4: '#042C53', lbl1: '#185FA5', lbl2: '#f57f17', lbl3: '#185FA5', lbl4: '#185FA5' },
        { bg: '#EEEDFE', nom: '#26215C', div: '#534AB7', b1: '#CECBF6', b2: '#fff8e1', b3: '#AFA9EC', b4: '#7F77DD', v1: '#26215C', v2: '#f57f17', v3: '#26215C', v4: '#26215C', lbl1: '#534AB7', lbl2: '#f57f17', lbl3: '#534AB7', lbl4: '#534AB7' },
        { bg: '#FAEEDA', nom: '#412402', div: '#854F0B', b1: '#FAC775', b2: '#fff8e1', b3: '#EF9F27', b4: '#BA7517', v1: '#412402', v2: '#f57f17', v3: '#412402', v4: '#412402', lbl1: '#854F0B', lbl2: '#f57f17', lbl3: '#854F0B', lbl4: '#854F0B' },
        { bg: '#FBEAF0', nom: '#4B1528', div: '#993556', b1: '#F4C0D1', b2: '#fff8e1', b3: '#ED93B1', b4: '#D4537E', v1: '#4B1528', v2: '#f57f17', v3: '#4B1528', v4: '#4B1528', lbl1: '#993556', lbl2: '#f57f17', lbl3: '#993556', lbl4: '#993556' },
    ];

    return (
        <div style={styles.page}>
            <style>{`
                .filiere-card-clickable:hover {
                    box-shadow: 0 6px 18px rgba(0,0,0,0.10) !important;
                    transform: translateY(-2px);
                    transition: all 0.18s ease;
                }
                .filiere-card-clickable {
                    transition: all 0.18s ease;
                }
            `}</style>
            <Sidebar active="Tableau de bord" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>🏠 Tableau de bord</div>
                    <button
                        style={styles.btnNouveau}
                        onClick={() => window.location.href = '/dashboard/admin-ecole/memoires/nouveau'}
                    >
                        + Nouveau mémoire
                    </button>
                </div>

                {/* ── Stats globales ── */}
                <div style={styles.statsGrid}>
                    {statsConfig.map((s) => (
                        <div
                            key={s.label}
                            style={{
                                ...styles.statCard,
                                backgroundColor: s.bg,
                                borderLeft: '4px solid ' + s.color,
                                outline: filtreStatut === s.filtre ? '2px solid ' + s.color : 'none',
                                cursor: 'pointer',
                            }}
                            onClick={() => setFiltreStatut(filtreStatut === s.filtre ? 'Tous' : s.filtre)}
                        >
                            <div style={styles.statIcone}>{s.icon}</div>
                            <div style={{ ...styles.statValeur, color: s.color }}>{s.valeur}</div>
                            <div style={styles.statLabel}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Statistiques par filière ── */}
                {statsParFiliere.length > 0 && (
                    <div style={styles.sectionFiliere}>
                        <div style={styles.sectionTitre}>📊 Statistiques par filière</div>
                        <div style={styles.filiereGrid}>
                            {statsParFiliere.map((f, idx) => {
                                const p = palettes[idx % palettes.length];
                                return (
                                    <div
                                        key={f.id}
                                        className={f.total > 0 ? 'filiere-card-clickable' : ''}
                                        style={{
                                            ...styles.filiereCard,
                                            backgroundColor: p.bg,
                                            border: filtreFiliere === String(f.id)
                                                ? `2px solid ${p.div}`
                                                : '1.5px solid transparent',
                                            cursor: f.total > 0 ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (f.total === 0) return;
                                            setFiltreFiliere(filtreFiliere === String(f.id) ? '' : String(f.id));
                                            setFiltreStatut('Tous');
                                            setRecherche('');
                                        }}
                                    >
                                        {/* Nom filière */}
                                        <div style={{ ...styles.filiereNom, color: p.nom }}>{f.libelle}</div>

                                        {/* Séparateur */}
                                        <div style={{ height: '1px', backgroundColor: p.div, opacity: 0.25 }} />

                                        {f.total === 0 ? (
                                            <div style={styles.filiereVide}>Aucun dépôt</div>
                                        ) : (
                                            <div style={styles.filiereStatRow}>

                                                {/* Total */}
                                                <div style={{ ...styles.filiereStatBloc, backgroundColor: p.b1 }}>
                                                    <span style={{ ...styles.filiereStatVal, color: p.v1 }}>{f.total}</span>
                                                    <span style={{ ...styles.filiereStatLbl, color: p.lbl1 }}>total</span>
                                                </div>

                                                {/* Créés */}
                                                <div style={{ ...styles.filiereStatBloc, backgroundColor: '#fff8e1' }}>
                                                    <span style={{ ...styles.filiereStatVal, color: '#f57f17' }}>{f.cree}</span>
                                                    <span style={{ ...styles.filiereStatLbl, color: '#f57f17' }}>créés</span>
                                                </div>

                                                {/* En cours */}
                                                <div style={{ ...styles.filiereStatBloc, backgroundColor: p.b3 }}>
                                                    <span style={{ ...styles.filiereStatVal, color: p.v3 }}>{f.en_cours}</span>
                                                    <span style={{ ...styles.filiereStatLbl, color: p.lbl3 }}>en cours</span>
                                                </div>

                                                {/* Validés */}
                                                <div style={{ ...styles.filiereStatBloc, backgroundColor: p.b4 }}>
                                                    <span style={{ ...styles.filiereStatVal, color: '#fff' }}>{f.valides}</span>
                                                    <span style={{ ...styles.filiereStatLbl, color: '#fff' }}>validés</span>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Filtres onglets ── */}
                <div style={styles.onglets}>
                    {statuts.map(s => {
                        const count = s === 'Tous'
                            ? memoires.length
                            : memoires.filter(m => m.statut === s).length;
                        return (
                            <button
                                key={s}
                                style={{
                                    ...styles.onglet,
                                    borderBottom: filtreStatut === s ? '3px solid #1a6b3c' : '3px solid transparent',
                                    color: filtreStatut === s ? '#1a6b3c' : '#888',
                                    fontWeight: filtreStatut === s ? '700' : '500',
                                }}
                                onClick={() => setFiltreStatut(s)}
                            >
                                {s === 'Tous' ? 'Tous' : s === 'cree' ? 'Créés' : s === 'en_cours' ? 'En cours' : 'Validé'} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* ── Filtres recherche ── */}
                <div style={styles.filtresZone}>
                    <input
                        style={styles.inputRecherche}
                        type="text"
                        placeholder="🔍 Rechercher par titre ou étudiant..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                    />
                    <select
                        style={styles.select}
                        value={filtreFiliere}
                        onChange={(e) => setFiltreFiliere(e.target.value)}
                    >
                        <option value="">Toutes les filières</option>
                        {filieres.map((f) => (
                            <option key={f.id_filiere} value={String(f.id_filiere)}>
                                {f.libelle_filiere}
                            </option>
                        ))}
                    </select>
                    {(filtreFiliere || filtreStatut !== 'Tous' || recherche) && (
                        <button style={styles.btnReset} onClick={() => { setFiltreFiliere(''); setFiltreStatut('Tous'); setRecherche(''); }}>
                            ✕ Réinitialiser
                        </button>
                    )}
                    <span style={styles.compteur}>{memoiresFiltres.length} résultat{memoiresFiltres.length > 1 ? 's' : ''}</span>
                </div>

                {/* ── Cards mémoires ── */}
                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.loading}>⏳ Chargement...</p>
                    ) : memoiresFiltres.length === 0 ? (
                        <p style={styles.vide}>📭 Aucun mémoire trouvé.</p>
                    ) : (
                        <div style={styles.grid}>
                            {memoiresFiltres.map((m) => {
                                const c = couleurStatut(m.statut);
                                const etudiant  = m.encadreurs && m.encadreurs[0] && m.encadreurs[0].etudiant && m.encadreurs[0].etudiant.utilisateur;
                                const encadrant = m.encadreurs && m.encadreurs[0] && m.encadreurs[0].encadrant && m.encadreurs[0].encadrant.utilisateur;
                                return (
                                    <div key={m.id_memoire} style={styles.card}>
                                        <div style={styles.cardTop}>
                                            <div style={styles.cardTitre}>{m.titre}</div>
                                            <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>
                                                {c.label}
                                            </span>
                                        </div>
                                        <div style={styles.cardInfos}>
                                            <div style={styles.cardInfo}>
                                                <span style={styles.cardInfoLabel}>Filière :</span>
                                                <span style={styles.cardInfoVal}>{m.filiere ? m.filiere.libelle_filiere : '-'}</span>
                                            </div>
                                            <div style={styles.cardInfo}>
                                                <span style={styles.cardInfoLabel}>Étudiant :</span>
                                                <span style={styles.cardInfoVal}>{etudiant ? etudiant.prenom + ' ' + etudiant.nom : '-'}</span>
                                            </div>
                                            <div style={styles.cardInfo}>
                                                <span style={styles.cardInfoLabel}>Encadrant :</span>
                                                <span style={styles.cardInfoVal}>{encadrant ? encadrant.prenom + ' ' + encadrant.nom : '-'}</span>
                                            </div>
                                        </div>
                                        <div style={styles.cardActions}>
                                            <button
                                                style={styles.btnVoir}
                                                onClick={() => window.location.href = '/dashboard/admin-ecole/memoires/' + m.id_memoire}
                                            >
                                                👁 Voir
                                            </button>
                                            <button
                                                style={styles.btnModifier}
                                                onClick={() => window.location.href = '/dashboard/admin-ecole/memoires/' + m.id_memoire + '/modifier'}
                                            >
                                                ✏️ Modifier
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    main: { marginLeft: '240px', flex: 1 },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 2.5rem', backgroundColor: '#fff',
        borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    btnNouveau: {
        padding: '0.7rem 1.5rem', backgroundColor: '#1a6b3c', color: '#fff',
        borderRadius: '10px', border: 'none', fontSize: '0.9rem',
        fontWeight: '600', cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.25rem', padding: '2rem 2.5rem 1rem',
    },
    statCard: {
        borderRadius: '14px', padding: '1.25rem',
        textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    statIcone: { fontSize: '1.5rem', marginBottom: '0.5rem' },
    statValeur: { fontSize: '2rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.8rem', color: '#666', marginTop: '6px', fontWeight: '500' },

    sectionFiliere: {
        margin: '0 2.5rem 1.25rem',
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '1.4rem 1.6rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    sectionTitre: {
        fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e',
        marginBottom: '1.1rem',
    },
    filiereGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
    },
    filiereCard: {
        borderRadius: '14px',
        padding: '1.1rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    },
    filiereNom: {
        fontSize: '0.84rem',
        fontWeight: '600',
        lineHeight: '1.4',
    },
    filiereStatRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '7px',
    },
    filiereStatBloc: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '10px',
        padding: '10px 4px',
    },
    filiereStatVal: {
        fontSize: '1.15rem',
        fontWeight: '700',
        lineHeight: 1,
    },
    filiereStatLbl: {
        fontSize: '0.6rem',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.2,
    },
    filiereVide: {
        fontSize: '0.72rem', color: '#bbb', fontStyle: 'italic',
        textAlign: 'center', padding: '6px 0',
    },

    onglets: {
        display: 'flex', padding: '0 2.5rem',
        backgroundColor: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto',
    },
    onglet: {
        padding: '0.85rem 1.25rem', background: 'none', border: 'none',
        fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap',
    },
    filtresZone: {
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 2.5rem', flexWrap: 'wrap',
    },
    inputRecherche: {
        flex: 2, padding: '0.65rem 1rem', borderRadius: '10px',
        border: '1.5px solid #ddd', fontSize: '0.875rem',
        outline: 'none', minWidth: '200px',
    },
    select: {
        flex: 1, padding: '0.65rem 1rem', borderRadius: '10px',
        border: '1.5px solid #ddd', fontSize: '0.875rem',
        outline: 'none', backgroundColor: '#fff', minWidth: '150px',
    },
    btnReset: {
        padding: '0.65rem 1rem', backgroundColor: '#fdecea', color: '#c62828',
        border: '1px solid #f5c6cb', borderRadius: '10px',
        fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
    },
    compteur: { fontSize: '0.85rem', color: '#888', fontWeight: '500', whiteSpace: 'nowrap' },
    content: { padding: '0 2.5rem 2.5rem' },
    loading: { textAlign: 'center', color: '#999', padding: '3rem' },
    vide: { textAlign: 'center', color: '#999', padding: '3rem' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.25rem',
    },
    card: {
        backgroundColor: '#fff', borderRadius: '14px', padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '1rem',
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
    cardTitre: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', flex: 1, lineHeight: '1.4' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 },
    cardInfos: { display: 'flex', flexDirection: 'column', gap: '6px' },
    cardInfo: { fontSize: '0.875rem', color: '#555' },
    cardInfoLabel: { fontWeight: '600', color: '#333', marginRight: '6px' },
    cardInfoVal: { color: '#666' },
    cardActions: { display: 'flex', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
    btnVoir: {
        flex: 1, padding: '6px 0', backgroundColor: '#e8f5ee', color: '#1a6b3c',
        borderRadius: '8px', border: '1px solid #c3e6cb', fontSize: '0.8rem',
        fontWeight: '600', cursor: 'pointer',
    },
    btnModifier: {
        flex: 1, padding: '6px 0', backgroundColor: '#e3f2fd', color: '#1565c0',
        borderRadius: '8px', border: '1px solid #bbdefb', fontSize: '0.8rem',
        fontWeight: '600', cursor: 'pointer',
    },
};