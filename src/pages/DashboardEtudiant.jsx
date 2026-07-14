import { useState, useEffect } from 'react';
import api from '../api/axios';
import Logo from '../components/Logo';
import VisualiseurPDF from './VisualiseurPDF';
import { useUploadQueue }                              from './useUploadQueue';
import { BadgeFile, PanneauFile, ToastsNotification } from './PanneauFile';

const MAX_TAILLE_MB  = 100;
const MAX_TAILLE_OCT = MAX_TAILLE_MB * 1024 * 1024;

const validerFichier = (f) => {
    if (!f) return null;
    if (f.size > MAX_TAILLE_OCT) return `Le fichier fait ${(f.size / 1024 / 1024).toFixed(1)} Mo — la limite est ${MAX_TAILLE_MB} Mo.`;
    return null;
};

// ── Formulaire de remplacement isolé (état local propre) ──────────────────
const FormulaireRemplacement = ({ idVersion, onSubmit, uploading }) => {
    const [fichierLocal, setFichierLocal] = useState(null);
    const [erreurLocale, setErreurLocale] = useState('');

    const handleChange = (e) => {
        const f = e.target.files[0];
        setFichierLocal(f || null);
        setErreurLocale('');
        if (f) {
            const err = validerFichier(f);
            if (err) setErreurLocale(err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fichierLocal) return;
        const err = validerFichier(fichierLocal);
        if (err) { setErreurLocale(err); return; }
        onSubmit(fichierLocal, idVersion);
    };

    return (
        <div style={styles.remplacerZone}>
            {erreurLocale && <p style={{ color: '#c62828', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{erreurLocale}</p>}
            <form onSubmit={handleSubmit}>
                <label style={styles.label}>NOUVEAU FICHIER PDF (max {MAX_TAILLE_MB} Mo)</label>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleChange}
                    style={styles.inputFile}
                    disabled={uploading}
                />
                {fichierLocal && (
                    <p style={{ fontSize: '0.8rem', marginTop: '4px', color: fichierLocal.size > MAX_TAILLE_OCT ? '#c62828' : '#888' }}>
                        📄 {fichierLocal.name} ({(fichierLocal.size / 1024 / 1024).toFixed(2)} Mo)
                        {fichierLocal.size > MAX_TAILLE_OCT && ' — ⚠️ Fichier trop volumineux'}
                    </p>
                )}
                <button
                    type="submit"
                    style={{
                        marginTop: '1rem',
                        ...((uploading || !fichierLocal || (fichierLocal && fichierLocal.size > MAX_TAILLE_OCT)) ? styles.btnDisabled : styles.btnSoumettre)
                    }}
                    disabled={uploading || !fichierLocal || (fichierLocal && fichierLocal.size > MAX_TAILLE_OCT)}
                >
                    {uploading ? '⏳ Envoi en cours...' : '✅ Remplacer'}
                </button>
            </form>
        </div>
    );
};

export default function DashboardEtudiant() {
    const [memoire, setMemoire]                           = useState(null);
    const [versions, setVersions]                         = useState([]);
    const [loading, setLoading]                           = useState(true);
    const [fichier, setFichier]                           = useState(null);
    const [deposer, setDeposer]                           = useState(false);
    const [message, setMessage]                           = useState('');
    const [erreur, setErreur]                             = useState('');
    const [annotationDetail, setAnnotationDetail]         = useState(null);
    const [remplacerVersionId, setRemplacerVersionId]     = useState(null);
    const [versionVisualisee, setVersionVisualisee]       = useState(null);
    const [panneauOuvert, setPanneauOuvert]               = useState(false);

    // ── Archivage local ──────────────────────────────────────────────────────
    const [archivees, setArchivees] = useState(() => {
        try { return JSON.parse(localStorage.getItem('versions_archivees') || '[]'); } catch { return []; }
    });
    const [archivesOuvertes, setArchivesOuvertes] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ── File d'attente d'upload ──────────────────────────────────────────────
    const baseURL = (api.defaults?.baseURL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const token   = localStorage.getItem('token');

    const { file, stats, notifications, ajouter, annuler, dismissNotif } = useUploadQueue({
        baseURL,
        token,
        onVersionDeposee: (memoireId) => {
            chargerVersions(memoireId);
            chargerMemoire();
            setMessage('✅ Version enregistrée !');
            setTimeout(() => setMessage(''), 4000);
        },
    });

    useEffect(() => { chargerMemoire(); }, []);
    useEffect(() => { localStorage.setItem('versions_archivees', JSON.stringify(archivees)); }, [archivees]);

    // Ouvrir le panneau automatiquement dès qu'un job démarre
    useEffect(() => {
        if (stats.enCours > 0) setPanneauOuvert(false); // badge visible, pas le panneau
    }, [stats.enCours]);

    const archiverVersion    = (id) => { setArchivees(p => [...p, id]);              setMessage('🗄 Version archivée.');                   setTimeout(() => setMessage(''), 3000); };
    const desarchiverVersion = (id) => { setArchivees(p => p.filter(x => x !== id)); setMessage('↩️ Version restaurée dans l\'historique.'); setTimeout(() => setMessage(''), 3000); };

    const chargerMemoire = () => {
        setLoading(true);
        api.get('/memoires').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            if (data.length > 0) { setMemoire(data[0]); chargerVersions(data[0].id_memoire); }
            else setLoading(false);
        }).catch(() => setLoading(false));
    };

    // ✅ FIX : nettoyage des IDs archivés obsolètes après chaque chargement
    const chargerVersions = (id) => {
        api.get('/memoires/' + id + '/versions').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setVersions(data);

            // Supprimer du localStorage les IDs archivés qui n'existent plus côté serveur
            const idsValides = data.map(v => v.id_version);
            setArchivees(prev => {
                const nettoye = prev.filter(archivedId => idsValides.includes(archivedId));
                localStorage.setItem('versions_archivees', JSON.stringify(nettoye));
                return nettoye;
            });

        }).finally(() => setLoading(false));
    };

    const handleChangeFichier = (e) => {
        const f = e.target.files[0]; setFichier(f || null); setErreur('');
        if (f) { const err = validerFichier(f); if (err) setErreur(err); }
    };

    // ── Déposer = ajouter à la file ───────────────────────────────
    const handleDeposer = (e) => {
        e.preventDefault();
        if (!fichier) return;
        const err = validerFichier(fichier);
        if (err) { setErreur(err); return; }

        ajouter(fichier, memoire.id_memoire, fichier.name);

        setFichier(null);
        setDeposer(false);
        setErreur('');
        setMessage('⏳ Envoi en cours...');
        setTimeout(() => setMessage(''), 4000);
    };

    // ── Remplacement (inchangé — séquentiel, rare) ───────────────────────────
    const [uploadingRemplacement, setUploadingRemplacement]     = useState(false);
    const [progressionRemplacement, setProgressionRemplacement] = useState(0);

    const uploadAvecProgression = (url, formData, onProgress) =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', baseURL + url);
            if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.upload.addEventListener('progress', (ev) => {
                if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
            });
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
                } else {
                    try { reject({ message: JSON.parse(xhr.responseText).message || 'Erreur serveur.' }); }
                    catch { reject({ message: `Erreur serveur (${xhr.status}).` }); }
                }
            };
            xhr.onerror = () => reject({ message: 'Erreur réseau. Vérifiez votre connexion.' });
            xhr.send(formData);
        });

    const handleRemplacer = async (fichierChoisi, idVersion) => {
        setUploadingRemplacement(true); setProgressionRemplacement(0); setMessage(''); setErreur('');
        const formData = new FormData();
        formData.append('fichier', fichierChoisi);
        try {
            await uploadAvecProgression(
                `/memoires/${memoire.id_memoire}/versions/${idVersion}/remplacer`,
                formData, setProgressionRemplacement
            );
            setProgressionRemplacement(100);
            setTimeout(() => {
                setMessage('✅ Version modifiée avec succès !');
                setRemplacerVersionId(null); setProgressionRemplacement(0);
                chargerVersions(memoire.id_memoire);
            }, 700);
        } catch (err) {
            setErreur(err.message || 'Erreur lors du remplacement.'); setProgressionRemplacement(0);
        } finally { setUploadingRemplacement(false); }
    };

    const telecharger = async (url) => {
        if (!url) return;
        try {
            const response = await fetch(url); const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = 'memoire.pdf';
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); window.URL.revokeObjectURL(blobUrl);
        } catch { window.open(url, '_blank'); }
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

    const peutDeposer = () => {
        if (!memoire) return false;
        if (memoire.statut === 'soutenu') return false;
        if (versions.length === 0) return true;
        const derniere = versions[0];
        const statut   = derniere.statut_version || derniere.statut;
        return statut === 'rejete' || statut === 'accepte';
    };

    const versionsVisibles  = versions.filter(v => !archivees.includes(v.id_version));
    const versionsArchivees = versions.filter(v =>  archivees.includes(v.id_version));

    const peutArchiver = (v) => {
        const statut = v.statut_version || v.statut;
        return statut !== 'soumis';
    };

    const VersionCard = ({ v, index, isArchivee = false }) => {
        const statut = v.statut_version || v.statut;
        const cv     = couleurStatut(statut);
        const lien   = v.url_fichier || v.chemin_fichier || null;
        const annotations = v.annotations || [];
        const estRejeteAvecAnnotations = statut === 'rejete' && annotations.length > 0;

        return (
            <div key={v.id_version} style={{ ...styles.versionCard, ...(isArchivee ? styles.versionCardArchivee : {}) }}>
                <div style={styles.versionHeader}>
                    <div style={styles.versionNum}>
                        {isArchivee && <span style={styles.archiveIcon}>🗄</span>}
                        Version {versions.length - versions.findIndex(x => x.id_version === v.id_version)}
                    </div>
                    <span style={{ ...styles.badge, backgroundColor: cv.bg, color: cv.color }}>{cv.label}</span>
                    <div style={styles.versionDate}>📅 {v.date_depot ? new Date(v.date_depot).toLocaleDateString('fr-FR') : '-'}</div>

                    {lien && (
                        <button style={styles.btnTelecharger} onClick={() => telecharger(lien)}>📥 Télécharger</button>
                    )}
                    {estRejeteAvecAnnotations && (
                        <button style={styles.btnVisualiser} onClick={() => setVersionVisualisee(v)}>
                            👁 Annotations ({annotations.length})
                        </button>
                    )}
                    {statut === 'soumis' && !isArchivee && (
                        <button style={styles.btnModifier} onClick={() => {
                            const nouvelId = remplacerVersionId === v.id_version ? null : v.id_version;
                            setRemplacerVersionId(nouvelId);
                            setErreur(''); setProgressionRemplacement(0);
                        }}>
                            ✏️ {remplacerVersionId === v.id_version ? 'Annuler' : 'Modifier le fichier'}
                        </button>
                    )}
                    {!isArchivee && peutArchiver(v) && (
                        <button style={styles.btnArchiver} onClick={() => archiverVersion(v.id_version)} title="Archiver cette version">
                            🗄 Archiver
                        </button>
                    )}
                    {isArchivee && (
                        <button style={styles.btnDesarchiver} onClick={() => desarchiverVersion(v.id_version)} title="Restaurer dans l'historique">
                            ↩️ Restaurer
                        </button>
                    )}
                </div>

                {!isArchivee && remplacerVersionId === v.id_version && (
                    <FormulaireRemplacement
                        idVersion={v.id_version}
                        onSubmit={handleRemplacer}
                        uploading={uploadingRemplacement}
                    />
                )}

                {annotations.length > 0 && statut !== 'rejete' && (
                    <div style={styles.annotationsZone}>
                        <div style={styles.annotationsTitre}>💬 Annotations de l'encadrant ({annotations.length}) :</div>
                        {annotations.map((a, i) => {
                            const texte = a.texte_commentaire || a.contenu || '';
                            return (
                                <div key={a.id_annotation} style={styles.annotationItem}>
                                    <div style={styles.annotationNumero}>#{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={styles.annotationPage}>Page {a.page}</div>
                                        <div style={styles.annotationTexte}>{texte}</div>
                                        <button style={styles.btnVoirPlus} onClick={() => setAnnotationDetail(a)}>👁 Voir le détail</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {estRejeteAvecAnnotations && (
                    <div style={styles.rejetInfo}>
                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                        <span>
                            Votre encadrant a laissé <strong>{annotations.length} annotation{annotations.length > 1 ? 's' : ''}</strong> sur cette version.
                            Cliquez sur <strong>"Annotations"</strong> pour les consulter sur le PDF.
                        </span>
                    </div>
                )}
            </div>
        );
    };

    if (versionVisualisee) {
        return (
            <div style={{ height: '100vh', overflow: 'hidden' }}>
                <VisualiseurPDF
                    version={versionVisualisee}
                    memoire={memoire}
                    onRetour={() => setVersionVisualisee(null)}
                />
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.sidebar}>
                <div style={styles.logoZone}><Logo size={80} showText={false} /></div>
                <nav style={styles.nav}>
                    <div style={styles.menuActif}><span style={styles.icon}>🎓</span>Mon mémoire</div>
                    <button style={styles.menuItem} onClick={() => window.location.href = '/dashboard/etudiant/profil'}>
                        <span style={styles.icon}>👤</span>Profil
                    </button>
                </nav>
            </div>

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>🎓 Mon mémoire</div>
                    <div style={styles.profilZone}>
                        <div style={styles.profilInfo}>
                            <div style={styles.profilNom}>{user.prenom} {user.nom}</div>
                            <div style={styles.profilRole}>Étudiant</div>
                        </div>
                        <div style={styles.profilAvatar}>{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</div>
                    </div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur   && <div style={styles.erreurBanner}>{erreur}</div>}

                {/* ── Bannière de statut file (si actif) ─────────────────── */}
                {stats.actif && (
                    <div style={styles.fileBanner}>
                        <span style={styles.fileBannerDot} />
                        <span>
                            {stats.enCours > 0
                                ? `📤 Envoi en cours…  ${stats.enAttente > 0 ? `(${stats.enAttente} en attente)` : ''}`
                                : `⏳ ${stats.enAttente} fichier${stats.enAttente > 1 ? 's' : ''} en attente d'envoi`}
                        </span>
                        <button style={styles.fileBannerBtn} onClick={() => setPanneauOuvert(true)}>
                            Voir la file →
                        </button>
                    </div>
                )}

                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.loading}>⏳ Chargement...</p>
                    ) : !memoire ? (
                        <div style={styles.videCard}>
                            <div style={{ fontSize: '3rem' }}>📭</div>
                            <p style={styles.vide}>Aucun mémoire assigné pour le moment.</p>
                            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Contactez votre administration.</p>
                        </div>
                    ) : (
                        <>
                            <div style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.cardTitre}>Mon mémoire</h2>
                                    <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: couleurStatut(memoire.statut).bg, color: couleurStatut(memoire.statut).color }}>
                                        {couleurStatut(memoire.statut).label}
                                    </span>
                                </div>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoItem}>
                                        <div style={styles.infoLabel}>TITRE</div>
                                        <div style={styles.infoVal}>{memoire.titre}</div>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <div style={styles.infoLabel}>FILIÈRE</div>
                                        <div style={styles.infoVal}>{memoire.filiere ? memoire.filiere.libelle_filiere : '-'}</div>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <div style={styles.infoLabel}>ENCADRANT</div>
                                        <div style={styles.infoVal}>
                                            {memoire.encadreurs?.[0]?.encadrant?.utilisateur
                                                ? memoire.encadreurs[0].encadrant.utilisateur.prenom + ' ' + memoire.encadreurs[0].encadrant.utilisateur.nom
                                                : '-'}
                                        </div>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <div style={styles.infoLabel}>VERSIONS DÉPOSÉES</div>
                                        <div style={styles.infoVal}>{versions.length}</div>
                                    </div>
                                </div>
                                {peutDeposer() && (
                                    <button
                                        style={stats.enCours > 0 ? styles.btnDisabled : styles.btnDeposer}
                                        onClick={() => { setDeposer(!deposer); setErreur(''); }}
                                        disabled={stats.enCours > 0}
                                    >
                                        {stats.enCours > 0 ? '⏳ Envoi en cours...' : (deposer ? '✕ Annuler' : '📤 Déposer une version')}
                                    </button>
                                )}
                                {memoire.statut === 'soutenu' && (
                                    <div style={styles.soutenuBadge}>🎓 Félicitations ! Votre mémoire a été soutenu.</div>
                                )}
                            </div>

                            {deposer && stats.enCours === 0 && (
                                <div style={styles.card}>
                                    <h2 style={styles.cardTitre}>📤 Déposer une version</h2>

                                    <form onSubmit={handleDeposer}>
                                        <div style={styles.field}>
                                            <label style={styles.label}>FICHIER PDF (max {MAX_TAILLE_MB} Mo)</label>
                                            <input type="file" accept=".pdf" onChange={handleChangeFichier} style={styles.inputFile} required disabled={stats.enCours > 0} />
                                            {fichier && (
                                                <p style={{ fontSize: '0.8rem', marginTop: '4px', color: fichier.size > MAX_TAILLE_OCT ? '#c62828' : '#888' }}>
                                                    📄 {fichier.name} ({(fichier.size / 1024 / 1024).toFixed(2)} Mo)
                                                    {fichier.size > MAX_TAILLE_OCT && ' — ⚠️ Fichier trop volumineux'}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            style={(fichier && fichier.size > MAX_TAILLE_OCT) ? styles.btnDisabled : styles.btnSoumettre}
                                            disabled={!fichier || (fichier && fichier.size > MAX_TAILLE_OCT)}
                                        >
                                            📤 Ajouter
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div style={styles.card}>
                                <h2 style={styles.cardTitre}>
                                    📁 Historique des versions ({versionsVisibles.length})
                                </h2>
                                {versionsVisibles.length === 0 ? (
                                    <p style={styles.vide}>
                                        {versions.length > 0 ? 'Toutes les versions sont archivées.' : 'Aucune version déposée.'}
                                    </p>
                                ) : (
                                    <div style={styles.versionsListe}>
                                        {versionsVisibles.map((v, index) => (
                                            <VersionCard key={v.id_version} v={v} index={versions.indexOf(v)} />
                                        ))}
                                    </div>
                                )}

                                {versionsArchivees.length > 0 && (
                                    <div style={styles.archivesSection}>
                                        <button style={styles.archivesToggle} onClick={() => setArchivesOuvertes(o => !o)}>
                                            <span>🗄 Archives ({versionsArchivees.length})</span>
                                            <span style={styles.toggleChevron}>{archivesOuvertes ? '▲' : '▼'}</span>
                                        </button>
                                        {archivesOuvertes && (
                                            <div style={styles.archivesListe}>
                                                <p style={styles.archivesHint}>
                                                    Ces versions sont archivées. Elles restent disponibles mais n'apparaissent plus dans l'historique principal.
                                                </p>
                                                {versionsArchivees.map((v, index) => (
                                                    <VersionCard key={v.id_version} v={v} index={index} isArchivee={true} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Modales inchangées ───────────────────────────────────────── */}
            {annotationDetail && (
                <div style={styles.modalOverlay} onClick={() => setAnnotationDetail(null)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalTitre}>💬 Annotation complète</div>
                            <button style={styles.modalClose} onClick={() => setAnnotationDetail(null)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            {annotationDetail.tous ? (
                                annotationDetail.tous.map((a, i) => (
                                    <div key={a.id_annotation} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={styles.modalPage}>📄 Page {a.page} — Annotation #{i + 1}</div>
                                        <div style={styles.modalTexte}>{a.texte_commentaire || a.contenu}</div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div style={styles.modalPage}>📄 Page {annotationDetail.page}</div>
                                    <div style={styles.modalTexte}>{annotationDetail.texte_commentaire || annotationDetail.contenu}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {versionVisualisee && (
                <div style={styles.visualOverlay}>
                    <div style={styles.visualModal}>
                        <VisualiseurPDF version={versionVisualisee} memoire={memoire} onRetour={() => setVersionVisualisee(null)} />
                    </div>
                </div>
            )}

            {/* ── Système de file d'attente ────────────────────────────────── */}
            <ToastsNotification notifications={notifications} onDismiss={dismissNotif} />
            <BadgeFile stats={stats} onClick={() => setPanneauOuvert(true)} />
            {panneauOuvert && (
                <PanneauFile
                    file={file}
                    stats={stats}
                    onAnnuler={annuler}
                    onClose={() => setPanneauOuvert(false)}
                />
            )}
        </div>
    );
}

const styles = {
    page:          { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    sidebar:       { width: '240px', minHeight: '100vh', backgroundColor: '#1a6b3c', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0 },
    logoZone:      { display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.15)' },
    nav:           { display: 'flex', flexDirection: 'column', gap: '4px', padding: '1rem 0.75rem', flex: 1 },
    menuActif:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.9rem', fontWeight: '700' },
    menuItem:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', width: '100%', textAlign: 'left' },
    icon:          { fontSize: '1.1rem' },
    main:          { marginLeft: '240px', flex: 1 },
    header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem', backgroundColor: '#fff', borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
    headerTitre:   { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    profilZone:    { display: 'flex', alignItems: 'center', gap: '12px' },
    profilInfo:    { textAlign: 'right' },
    profilNom:     { fontSize: '0.9rem', fontWeight: '600', color: '#1a1a2e' },
    profilRole:    { fontSize: '0.75rem', color: '#888' },
    profilAvatar:  { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700' },
    succes:        { backgroundColor: '#e8f5ee', color: '#1a6b3c', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #c3e6cb' },
    erreurBanner:  { backgroundColor: '#fdecea', color: '#c62828', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #f5c6cb' },
    fileBanner:    { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 2.5rem', backgroundColor: '#e8f0fe', borderBottom: '1px solid #c5d8fc', fontSize: '0.85rem', color: '#1a3a8f', fontWeight: '500' },
    fileBannerDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1565c0', flexShrink: 0, animation: 'pulse 1.4s infinite' },
    fileBannerBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#1565c0', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
    fileInfo:      { display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: '#e8f4fd', border: '1px solid #bee3f8', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1a5276', lineHeight: 1.5, marginBottom: '1.25rem' },
    content:       { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    loading:       { textAlign: 'center', color: '#999', padding: '3rem' },
    videCard:      { backgroundColor: '#fff', borderRadius: '14px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    vide:          { color: '#999', textAlign: 'center', padding: '1rem' },
    card:          { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0' },
    cardTitre:     { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0, marginBottom: '1rem' },
    infoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
    infoItem:      {},
    infoLabel:     { fontSize: '0.72rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' },
    infoVal:       { fontSize: '0.95rem', color: '#1a1a2e', fontWeight: '500' },
    btnDeposer:    { padding: '0.75rem 1.5rem', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    soutenuBadge:  { backgroundColor: '#f3e5f5', color: '#6a1b9a', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', marginTop: '1rem', textAlign: 'center' },
    field:         { marginBottom: '1.25rem' },
    label:         { fontSize: '0.72rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' },
    inputFile:     { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px dashed #ddd', fontSize: '0.9rem', backgroundColor: '#f8f9fa', boxSizing: 'border-box', cursor: 'pointer' },
    btnSoumettre:  { padding: '0.75rem 1.5rem', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    btnDisabled:   { padding: '0.75rem 1.5rem', backgroundColor: '#a5c9b5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', cursor: 'not-allowed', fontWeight: '600' },
    versionsListe: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    versionCard:   { border: '1px solid #eee', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    versionCardArchivee: { border: '1px dashed #ccc', backgroundColor: '#fafafa', opacity: 0.9 },
    versionHeader: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    versionNum:    { fontSize: '0.9rem', fontWeight: '700', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '5px' },
    archiveIcon:   { fontSize: '0.85rem' },
    badge:         { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
    versionDate:   { fontSize: '0.85rem', color: '#888' },
    btnTelecharger:{ color: '#1a6b3c', fontWeight: '600', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' },
    btnModifier:   { padding: '4px 10px', backgroundColor: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
    btnVisualiser: { padding: '6px 14px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    btnArchiver:   { padding: '4px 10px', backgroundColor: '#f0f4ff', color: '#3949ab', border: '1px solid #c5cae9', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' },
    btnDesarchiver:{ padding: '4px 10px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' },
    remplacerZone: { backgroundColor: '#fffbeb', border: '1px solid #ffe082', borderRadius: '10px', padding: '1rem' },
    annotationsZone:   { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '0.75rem', borderLeft: '3px solid #f0a500' },
    annotationsTitre:  { fontSize: '0.8rem', fontWeight: '700', color: '#f0a500', marginBottom: '0.75rem' },
    annotationItem:    { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' },
    annotationNumero:  { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#f0a500', color: '#fff', fontSize: '0.68rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' },
    annotationPage:    { fontSize: '0.72rem', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' },
    annotationTexte:   { fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 },
    btnVoirPlus:       { background: 'none', border: 'none', color: '#1565c0', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: '2px 0', marginTop: '4px', display: 'block' },
    rejetInfo:     { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.5 },
    modalOverlay:  { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal:         { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', width: '90%', maxWidth: '550px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    modalHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0' },
    modalTitre:    { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e' },
    modalClose:    { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888', padding: 0 },
    modalBody:     { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    modalPage:     { fontSize: '0.8rem', fontWeight: '700', color: '#f0a500', textTransform: 'uppercase', letterSpacing: '0.5px' },
    modalTexte:    { fontSize: '0.92rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' },
    progressWrapper:   { backgroundColor: '#f0f8f4', border: '1px solid #c3e6cb', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
    progressHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' },
    progressLabel:     { fontSize: '0.82rem', fontWeight: '600', color: '#1a6b3c' },
    progressPct:       { fontSize: '0.82rem', fontWeight: '700', color: '#1a6b3c' },
    progressTrack:     { height: '10px', backgroundColor: '#d4edda', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.9rem' },
    progressBar:       { height: '100%', borderRadius: '999px', transition: 'width 0.35s ease, background-color 0.4s ease' },
    progressSteps:     { display: 'flex', justifyContent: 'space-between' },
    progressStep:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    progressDot:       { width: '10px', height: '10px', borderRadius: '50%', transition: 'background-color 0.3s, transform 0.3s' },
    progressStepLabel: { fontSize: '0.65rem', fontWeight: '600', transition: 'color 0.3s' },
    visualOverlay:     { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    visualModal:       { backgroundColor: '#fff', borderRadius: '16px', width: '95vw', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' },
    archivesSection:   { marginTop: '1.25rem', borderTop: '1px solid #eee', paddingTop: '1rem' },
    archivesToggle:    { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: '#555' },
    toggleChevron:     { fontSize: '0.7rem', color: '#999' },
    archivesListe:     { marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    archivesHint:      { fontSize: '0.78rem', color: '#999', fontStyle: 'italic', margin: '0 0 0.75rem 0' },
};