import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

// ── Barre de progression ───────────────────────────────────────────────────
function BarreProgression({ taux }) {
    const couleur = taux >= 80 ? '#2e7d32' : taux >= 50 ? '#f0a500' : '#e53935';
    return (
        <div style={{ width: '100%', backgroundColor: '#e8e8e8', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{
                width: `${taux}%`, height: '100%',
                backgroundColor: couleur, borderRadius: 99,
                transition: 'width 0.6s ease',
            }} />
        </div>
    );
}

export default function AvancementMemoires() {
    const [filieres, setFilieres]                 = useState([]);
    const [filiereSelectionnee, setFiliereSelectionnee] = useState(null);
    const [encadrants, setEncadrants]             = useState([]);
    const [encadrantFiltre, setEncadrantFiltre]   = useState(''); // '' = tous
    const [memoires, setMemoires]                 = useState([]);
    const [memoireSelectionne, setMemoireSelectionne] = useState(null);
    const [versions, setVersions]                 = useState([]);
    const [progression, setProgression]           = useState(null);
    const [checklist, setChecklist]               = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [loadingDetail, setLoadingDetail]       = useState(false);
    const [triAlpha, setTriAlpha]                 = useState(false);
    const [recherche, setRecherche]               = useState('');

    useEffect(() => {
        api.get('/filieres').then(res => {
            setFilieres(Array.isArray(res.data) ? res.data : []);
        });
    }, []);

    const selectionnerFiliere = (filiere) => {
        setFiliereSelectionnee(filiere);
        setEncadrantFiltre('');
        setMemoireSelectionne(null);
        setVersions([]);
        setProgression(null);
        setChecklist([]);
        setRecherche('');
        setTriAlpha(false);
        setLoading(true);

        api.get('/memoires').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            const memoiresFiliere = data.filter(m =>
                m.filiere && m.filiere.id_filiere === filiere.id_filiere
            );

            // Construire la liste des encadrants uniques pour le filtre
            const encadrantsMap = {};
            memoiresFiliere.forEach(m => {
                const enc = m.encadreurs?.[0]?.encadrant;
                if (enc && !encadrantsMap[enc.id_user]) {
                    encadrantsMap[enc.id_user] = {
                        id_user: enc.id_user,
                        utilisateur: enc.utilisateur,
                    };
                }
            });

            setEncadrants(Object.values(encadrantsMap));
            setMemoires(memoiresFiliere);
        }).finally(() => setLoading(false));
    };

    const selectionnerMemoire = (memoire) => {
        setMemoireSelectionne(memoire);
        setLoadingDetail(true);
        Promise.all([
            api.get('/memoires/' + memoire.id_memoire + '/versions'),
            api.get('/memoires/' + memoire.id_memoire + '/checklist'),
        ]).then(([vRes, cRes]) => {
            const vData = Array.isArray(vRes.data) ? vRes.data : vRes.data.data || [];
            setVersions(vData);
            setChecklist(cRes.data.items || []);
            setProgression(cRes.data.progression || { total: 0, completes: 0, taux: 0 });
        }).catch(() => {
            setVersions([]);
            setProgression({ total: 0, completes: 0, taux: 0 });
        }).finally(() => setLoadingDetail(false));
    };

    const telecharger = async (url) => {
        if (!url) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'memoire.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank');
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

    // ── Mémoires filtrés (encadrant + recherche + tri) ──────────────────────
    const memoiresAffiches = (() => {
        let result = memoires;

        // Filtre encadrant (optionnel)
        if (encadrantFiltre) {
            result = result.filter(m =>
                m.encadreurs?.[0]?.encadrant?.id_user === Number(encadrantFiltre)
            );
        }

        // Recherche par nom étudiant
        if (recherche.trim()) {
            const r = recherche.toLowerCase();
            result = result.filter(m => {
                const etudiant = m.encadreurs?.[0]?.etudiant?.utilisateur;
                return etudiant
                    ? (etudiant.nom + ' ' + etudiant.prenom).toLowerCase().includes(r)
                    : false;
            });
        }

        // Tri alphabétique
        if (triAlpha) {
            result = [...result].sort((a, b) => {
                const nomA = a.encadreurs?.[0]?.etudiant?.utilisateur?.nom || '';
                const nomB = b.encadreurs?.[0]?.etudiant?.utilisateur?.nom || '';
                return nomA.localeCompare(nomB);
            });
        }

        return result;
    })();

    return (
        <div style={styles.page}>
            <Sidebar active="Avancement" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>📊 Consulter l'avancement des mémoires</div>
                </div>

                <div style={styles.content}>

                    {/* ── Étape 1 : Filière ── */}
                    <div style={styles.etape}>
                        <div style={styles.etapeTitre}>
                            <span style={styles.etapeNum}>1</span>
                            Sélectionner une filière
                        </div>
                        <div style={styles.grid3}>
                            {filieres.map(f => (
                                <div
                                    key={f.id_filiere}
                                    style={{
                                        ...styles.itemCard,
                                        borderColor: filiereSelectionnee?.id_filiere === f.id_filiere ? '#1a6b3c' : '#eee',
                                        backgroundColor: filiereSelectionnee?.id_filiere === f.id_filiere ? '#e8f5ee' : '#fff',
                                    }}
                                    onClick={() => selectionnerFiliere(f)}
                                >
                                    <div style={styles.itemIcone}>🎓</div>
                                    <div style={styles.itemNom}>{f.libelle_filiere}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Étape 2 : Liste étudiants (avec filtre encadrant optionnel) ── */}
                    {filiereSelectionnee && (
                        <div style={styles.etape}>
                            <div style={styles.etapeTitre}>
                                <span style={styles.etapeNum}>2</span>
                                Étudiants — <strong>{filiereSelectionnee.libelle_filiere}</strong>
                            </div>

                            {/* Barre de filtres */}
                            <div style={styles.filtresBar}>
                                {/* Filtre encadrant optionnel */}
                                {encadrants.length > 0 && (
                                    <select
                                        style={styles.select}
                                        value={encadrantFiltre}
                                        onChange={e => {
                                            setEncadrantFiltre(e.target.value);
                                            setMemoireSelectionne(null);
                                            setVersions([]);
                                            setProgression(null);
                                            setChecklist([]);
                                        }}
                                    >
                                        <option value="">👨‍🏫 Tous les encadrants</option>
                                        {encadrants.map(enc => (
                                            <option key={enc.id_user} value={enc.id_user}>
                                                {enc.utilisateur
                                                    ? enc.utilisateur.prenom + ' ' + enc.utilisateur.nom
                                                    : 'Encadrant'}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Recherche */}
                                <input
                                    type="text"
                                    value={recherche}
                                    onChange={e => setRecherche(e.target.value)}
                                    placeholder="🔍 Rechercher par nom d'étudiant..."
                                    style={styles.input}
                                />

                                {/* Tri */}
                                <button
                                    style={{ ...styles.btnTri, backgroundColor: triAlpha ? '#1a6b3c' : '#f0f2f5', color: triAlpha ? '#fff' : '#555' }}
                                    onClick={() => setTriAlpha(!triAlpha)}
                                >
                                    🔤 {triAlpha ? 'A→Z actif' : 'Trier A→Z'}
                                </button>

                                <span style={styles.compteur}>{memoiresAffiches.length} étudiant{memoiresAffiches.length > 1 ? 's' : ''}</span>
                            </div>

                            {loading ? (
                                <p style={styles.loading}>⏳ Chargement...</p>
                            ) : memoiresAffiches.length === 0 ? (
                                <p style={styles.vide}>
                                    {recherche ? `Aucun étudiant trouvé pour "${recherche}".` : 'Aucun étudiant dans cette filière.'}
                                </p>
                            ) : (
                                <div style={styles.grid3}>
                                    {memoiresAffiches.map(m => {
                                        const etudiant  = m.encadreurs?.[0]?.etudiant?.utilisateur;
                                        const encadrant = m.encadreurs?.[0]?.encadrant?.utilisateur;
                                        const c = couleurStatut(m.statut);
                                        return (
                                            <div
                                                key={m.id_memoire}
                                                style={{
                                                    ...styles.itemCard,
                                                    borderColor: memoireSelectionne?.id_memoire === m.id_memoire ? '#1a6b3c' : '#eee',
                                                    backgroundColor: memoireSelectionne?.id_memoire === m.id_memoire ? '#e8f5ee' : '#fff',
                                                }}
                                                onClick={() => selectionnerMemoire(m)}
                                            >
                                                <div style={styles.itemAvatar}>
                                                    {etudiant ? etudiant.prenom.charAt(0) + etudiant.nom.charAt(0) : 'ET'}
                                                </div>
                                                <div style={styles.itemNom}>
                                                    {etudiant ? etudiant.prenom + ' ' + etudiant.nom : '-'}
                                                </div>
                                                <div style={styles.itemTitre}>{m.titre}</div>
                                                {encadrant && (
                                                    <div style={styles.itemEncadrant}>
                                                        🎓 {encadrant.prenom} {encadrant.nom}
                                                    </div>
                                                )}
                                                <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>
                                                    {c.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Étape 3 : Versions + Progression ── */}
                    {memoireSelectionne && (
                        <div style={styles.etape}>
                            <div style={styles.etapeTitre}>
                                <span style={styles.etapeNum}>3</span>
                                Avancement — <strong>{memoireSelectionne.titre}</strong>
                            </div>

                            {loadingDetail ? (
                                <p style={styles.loading}>⏳ Chargement...</p>
                            ) : (
                                <>
                                    {/* Progression checklist */}
                                    {progression && (
                                        <div style={styles.progCard}>
                                            <div style={styles.progRow}>
                                                <span style={styles.progLabel}>📋 Progression checklist</span>
                                                <span style={{
                                                    ...styles.progPct,
                                                    color: progression.taux >= 80 ? '#2e7d32' : progression.taux >= 50 ? '#f0a500' : '#e53935',
                                                }}>
                                                    {progression.taux}%
                                                </span>
                                            </div>
                                            <BarreProgression taux={progression.taux} />
                                            <div style={styles.progSub}>
                                                {progression.completes} / {progression.total} étape{progression.total > 1 ? 's' : ''} complète{progression.total > 1 ? 's' : ''}
                                            </div>

                                            {checklist.length > 0 && (
                                                <div style={styles.checklistZone}>
                                                    {checklist.map(item => (
                                                        <div key={item.id_item} style={{
                                                            ...styles.checkRow,
                                                            backgroundColor: item.est_complete ? '#f0faf4' : '#fafafa',
                                                            borderColor: item.est_complete ? '#c8e6c9' : '#ebebeb',
                                                        }}>
                                                            <div style={{
                                                                ...styles.checkBox,
                                                                backgroundColor: item.est_complete ? '#2e7d32' : '#fff',
                                                                borderColor: item.est_complete ? '#2e7d32' : '#ccc',
                                                                color: '#fff',
                                                            }}>
                                                                {item.est_complete ? '✓' : ''}
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.8rem',
                                                                color: item.est_complete ? '#bbb' : '#333',
                                                                textDecoration: item.est_complete ? 'line-through' : 'none',
                                                                flex: 1,
                                                            }}>
                                                                {item.libelle}
                                                            </span>
                                                            {item.est_complete && item.date_completion && (
                                                                <span style={{ fontSize: '0.62rem', color: '#81c784', whiteSpace: 'nowrap' }}>
                                                                    ✓ {new Date(item.date_completion).toLocaleDateString('fr-FR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Versions */}
                                    <div style={{ marginTop: 16 }}>
                                        <div style={styles.versionsTitle}>
                                            📁 Versions déposées ({versions.length})
                                        </div>
                                        {versions.length === 0 ? (
                                            <p style={styles.vide}>Aucune version déposée.</p>
                                        ) : (
                                            <div style={styles.versionsListe}>
                                                {versions.map((v, index) => {
                                                    const cv = couleurStatut(v.statut_version || v.statut);
                                                    const lien = v.url_fichier || v.chemin_fichier || null;
                                                    return (
                                                        <div key={v.id_version} style={styles.versionCard}>
                                                            <div style={styles.versionHeader}>
                                                                <div style={styles.versionNum}>Version {versions.length - index}</div>
                                                                <span style={{ ...styles.badge, backgroundColor: cv.bg, color: cv.color }}>
                                                                    {cv.label}
                                                                </span>
                                                            </div>
                                                            <div style={styles.versionDate}>
                                                                📅 {v.date_depot ? new Date(v.date_depot).toLocaleDateString('fr-FR') : '-'}
                                                            </div>
                                                            {lien && (
                                                                <button style={styles.btnDl} onClick={() => telecharger(lien)}>
                                                                    📥 Télécharger
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
        padding: '1.25rem 2.5rem', backgroundColor: '#fff',
        borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    content: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    etape: {
        backgroundColor: '#fff', borderRadius: '14px',
        padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    etapeTitre: {
        fontSize: '1rem', fontWeight: '700', color: '#1a1a2e',
        marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px',
    },
    etapeNum: {
        width: '28px', height: '28px', borderRadius: '50%',
        backgroundColor: '#1a6b3c', color: '#fff',
        fontSize: '0.85rem', fontWeight: '700',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    filtresBar: {
        display: 'flex', alignItems: 'center', gap: '10px',
        flexWrap: 'wrap', marginBottom: '1.25rem',
    },
    select: {
        padding: '0.6rem 1rem', borderRadius: '10px',
        border: '1.5px solid #ddd', fontSize: '0.85rem',
        outline: 'none', backgroundColor: '#fff', cursor: 'pointer',
        minWidth: '200px',
    },
    input: {
        flex: 1, minWidth: '180px', padding: '0.6rem 1rem',
        borderRadius: '10px', border: '1.5px solid #ddd',
        fontSize: '0.85rem', outline: 'none',
    },
    btnTri: {
        padding: '6px 14px', border: '1px solid #ddd',
        borderRadius: '8px', fontSize: '0.82rem',
        fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
    },
    compteur: { fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' },
    grid3: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
    },
    itemCard: {
        border: '2px solid #eee', borderRadius: '12px',
        padding: '1rem', textAlign: 'center', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        transition: 'all 0.15s',
    },
    itemIcone: { fontSize: '1.8rem' },
    itemAvatar: {
        width: '44px', height: '44px', borderRadius: '50%',
        backgroundColor: '#1a6b3c', color: '#fff',
        fontSize: '0.9rem', fontWeight: '700',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    itemNom: { fontSize: '0.88rem', fontWeight: '700', color: '#1a1a2e' },
    itemTitre: { fontSize: '0.75rem', color: '#666', textAlign: 'center', lineHeight: '1.3' },
    itemEncadrant: { fontSize: '0.72rem', color: '#1a6b3c', fontWeight: '600' },
    badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
    loading: { color: '#999', textAlign: 'center', padding: '1.5rem' },
    vide: { color: '#999', textAlign: 'center', padding: '1.5rem' },
    progCard: {
        backgroundColor: '#f8fdf9', borderRadius: '12px',
        padding: '1rem 1.25rem', border: '1px solid #e8f5e9',
    },
    progRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progLabel: { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a2e' },
    progPct: { fontSize: '1.5rem', fontWeight: '800', lineHeight: 1 },
    progSub: { fontSize: '0.68rem', color: '#aaa', marginTop: 5 },
    checklistZone: {
        marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5,
        maxHeight: 260, overflowY: 'auto',
    },
    checkRow: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 8, border: '1px solid #ebebeb',
    },
    checkBox: {
        width: 18, height: 18, minWidth: 18, borderRadius: 4,
        border: '2px solid #ccc', fontSize: '0.65rem', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    versionsTitle: { fontSize: '0.88rem', fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
    versionsListe: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    versionCard: {
        border: '1px solid #eee', borderRadius: '10px',
        padding: '0.85rem 1rem', display: 'flex',
        alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        backgroundColor: '#fdfdfd',
    },
    versionHeader: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
    versionNum: { fontSize: '0.88rem', fontWeight: '700', color: '#1a1a2e' },
    versionDate: { fontSize: '0.82rem', color: '#888' },
    btnDl: {
        padding: '5px 12px', backgroundColor: '#e3f2fd', color: '#1565c0',
        border: '1px solid #bbdefb', borderRadius: '8px',
        fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
    },
};