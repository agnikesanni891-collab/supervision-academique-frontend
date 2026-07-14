import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function DetailMemoire() {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.indexOf('memoires') + 1];

    const [memoire, setMemoire] = useState(null);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        chargerMemoire();
    }, []);

    const chargerMemoire = () => {
        api.get('/memoires/' + id).then(res => {
            setMemoire(res.data);
        }).catch(() => setErreur('Mémoire introuvable.'));

        
api.get('/memoires/' + id + '/versions').then(res => {
    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    // ✅ Trier par id_version croissant pour garantir l'ordre
    const sorted = [...data].sort((a, b) => a.id_version - b.id_version);
    setVersions(sorted);
}).finally(() => setLoading(false));
    };

    const changerStatut = async (statut) => {
        // ✅ Bloquer si pas de version déposée
        if (versions.length === 0) {
            setErreur('Impossible : aucune version déposée.');
            return;
        }
        // ✅ Bloquer si la dernière version n'est pas acceptée
        const derniereVersion = versions[versions.length - 1];
        const statutDerniere = derniereVersion.statut_version || derniereVersion.statut;
        if (statutDerniere !== 'accepte') {
            setErreur('Impossible : la dernière version doit être acceptée avant de changer le statut.');
            return;
        }
        try {
            await api.patch('/memoires/' + id + '/statut', { statut });
            setMessage('Statut mis à jour : ' + labelStatut[statut]);
            setErreur('');
            chargerMemoire();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur statut.');
        }
    };

    // ✅ Statuts BDD réels : cree, en_cours, soutenu
    const couleurStatut = (statut) => {
        const map = {
            cree:     { bg: '#fff8e1', color: '#f57f17' },
            en_cours: { bg: '#e3f2fd', color: '#1565c0' },
            soutenu:  { bg: '#e8f5e9', color: '#2e7d32' },
            // statuts des versions
            soumis:   { bg: '#e3f2fd', color: '#1565c0' },
            rejete:   { bg: '#fdecea', color: '#c62828' },
            accepte:  { bg: '#e8f5e9', color: '#2e7d32' },
        };
        return map[statut] || { bg: '#f5f5f5', color: '#555' };
    };

    const labelStatut = {
        cree: 'Créé',
        en_cours: 'En cours',
        soutenu: 'Validé',
        soumis: 'Soumis',
        rejete: 'Rejeté',
        accepte: 'Accepté',
    };

    if (loading) return (
        <div style={styles.page}>
            <Sidebar active="Mémoires" />
            <div style={styles.main}>
                <p style={{ padding: '2rem', color: '#999' }}>Chargement...</p>
            </div>
        </div>
    );

    if (!memoire) return (
        <div style={styles.page}>
            <Sidebar active="Mémoires" />
            <div style={styles.main}>
                <p style={{ padding: '2rem', color: '#c62828' }}>Mémoire introuvable.</p>
            </div>
        </div>
    );

    const etudiant = memoire.encadreurs?.[0]?.etudiant?.utilisateur;
    const encadrant = memoire.encadreurs?.[0]?.encadrant?.utilisateur;
    const c = couleurStatut(memoire.statut);

    const derniereVersion = versions.length > 0 ? versions[versions.length - 1] : null;
    const statutDerniere = derniereVersion ? (derniereVersion.statut_version || derniereVersion.statut) : null;
    // ✅ Condition unique : dernière version acceptée
    const peutChangerStatut = versions.length > 0 && statutDerniere === 'accepte';

    return (
        <div style={styles.page}>
            <Sidebar active="Mémoires" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div>
                        <button style={styles.btnRetour} onClick={() => window.location.href = '/dashboard/admin-ecole/memoires'}>
                            ← Retour
                        </button>
                        <div style={styles.headerTitre}>📄 Détail du mémoire</div>
                    </div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur && <div style={styles.erreurBanner}>{erreur}</div>}

                <div style={styles.content}>

                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitre}>Informations</h2>
                            <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: c.bg, color: c.color }}>
                                {labelStatut[memoire.statut] || memoire.statut}
                            </span>
                        </div>

                        <div style={styles.infoGrid}>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>TITRE</div>
                                <div style={styles.infoVal}>{memoire.titre}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>FILIÈRE</div>
                                <div style={styles.infoVal}>{memoire.filiere?.libelle_filiere || '-'}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>ÉTUDIANT</div>
                                <div style={styles.infoVal}>{etudiant ? etudiant.prenom + ' ' + etudiant.nom : '-'}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>ENCADRANT</div>
                                <div style={styles.infoVal}>{encadrant ? encadrant.prenom + ' ' + encadrant.nom : '-'}</div>
                            </div>
                        </div>

                        <div style={styles.statutZone}>
                            <div style={styles.infoLabel}>CHANGER LE STATUT</div>

                            {/* ✅ Message contextuel clair */}
                            {versions.length === 0 && (
                                <p style={styles.avertissement}>
                                    ⚠️ Aucune version déposée — changement de statut impossible.
                                </p>
                            )}
                            {versions.length > 0 && !peutChangerStatut && (
                                <p style={styles.avertissement}>
                                    ⚠️ La dernière version doit être <strong>acceptée</strong> pour changer le statut.
                                </p>
                            )}
                            {peutChangerStatut && (
                                <p style={styles.avertissementOk}>
                                    ✅ Dernière version acceptée — vous pouvez changer le statut.
                                </p>
                            )}

                            <div style={styles.statutBtns}>
                                {/* ✅ Statuts BDD corrects : en_cours et soutenu */}
                                {['en_cours', 'soutenu'].map(s => {
                                    const cs = couleurStatut(s);
                                    const bloque = !peutChangerStatut;
                                    const actif = memoire.statut === s;
                                    return (
                                        <button
                                            key={s}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                border: '2px solid ' + (bloque && !actif ? '#ddd' : cs.color),
                                                backgroundColor: actif ? cs.color : bloque ? '#f5f5f5' : '#fff',
                                                color: actif ? '#fff' : bloque ? '#aaa' : cs.color,
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: bloque && !actif ? 'not-allowed' : 'pointer',
                                                opacity: bloque && !actif ? 0.6 : 1,
                                            }}
                                            onClick={() => !bloque && changerStatut(s)}
                                            disabled={bloque && !actif}
                                        >
                                            {labelStatut[s]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>📁 Versions déposées ({versions.length})</h2>

                        {versions.length === 0 ? (
                            <p style={styles.vide}>Aucune version déposée pour ce mémoire.</p>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Version</th>
                                        <th style={styles.th}>Date dépôt</th>
                                        <th style={styles.th}>Statut</th>
                                        <th style={styles.th}>Fichier</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {versions.map((v, index) => {
                                        const sv = v.statut_version || v.statut;
                                        const cv = couleurStatut(sv);
                                        const lien = v.url_fichier || v.chemin_fichier || null;
                                        return (
                                            <tr key={v.id_version} style={styles.tr}>
                                                <td style={styles.td}>Version {index + 1}</td>
                                                <td style={styles.td}>
                                                    {v.date_depot ? new Date(v.date_depot).toLocaleDateString('fr-FR') : '-'}
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: cv.bg, color: cv.color }}>
                                                        {labelStatut[sv] || sv || '-'}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    {lien ? (
                                                        <a href={lien} target="_blank" rel="noreferrer" style={styles.lienFichier}>
                                                            📥 Télécharger
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    main: { marginLeft: '240px', flex: 1 },
    header: {
        padding: '1rem 2.5rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    btnRetour: {
        background: 'none', border: 'none',
        color: '#1a6b3c', fontSize: '0.85rem',
        fontWeight: '600', cursor: 'pointer',
        padding: '0', marginBottom: '4px', display: 'block',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    succes: {
        backgroundColor: '#e8f5ee', color: '#1a6b3c',
        padding: '0.75rem 2.5rem', fontSize: '0.875rem',
        fontWeight: '500', borderBottom: '1px solid #c3e6cb',
    },
    erreurBanner: {
        backgroundColor: '#fdecea', color: '#c62828',
        padding: '0.75rem 2.5rem', fontSize: '0.875rem',
        fontWeight: '500', borderBottom: '1px solid #f5c6cb',
    },
    content: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    card: {
        backgroundColor: '#fff', borderRadius: '14px',
        padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    cardHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.25rem',
        paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0',
    },
    cardTitre: {
        fontSize: '1rem', fontWeight: '700',
        color: '#1a1a2e', margin: 0, marginBottom: '1rem',
    },
    infoGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem', marginBottom: '1.5rem',
    },
    infoItem: {},
    infoLabel: {
        fontSize: '0.72rem', fontWeight: '700', color: '#aaa',
        letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px',
    },
    infoVal: { fontSize: '0.95rem', color: '#1a1a2e', fontWeight: '500' },
    statutZone: { borderTop: '1px solid #f0f0f0', paddingTop: '1rem' },
    statutBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' },
    avertissement: { fontSize: '0.8rem', color: '#f57f17', marginBottom: '8px', marginTop: '6px' },
    avertissementOk: { fontSize: '0.8rem', color: '#2e7d32', marginBottom: '8px', marginTop: '6px' },
    vide: { color: '#999', textAlign: 'center', padding: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '0.75rem 1rem', textAlign: 'left',
        fontSize: '0.78rem', fontWeight: '700', color: '#888',
        borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase',
    },
    tr: { borderBottom: '1px solid #f8f8f8' },
    td: { padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#333', verticalAlign: 'middle' },
    lienFichier: { color: '#1a6b3c', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' },
};