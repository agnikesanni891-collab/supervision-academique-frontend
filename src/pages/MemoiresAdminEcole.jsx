import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function MemoiresAdminEcole() {
    const [memoires, setMemoires] = useState([]);
    const [filtreStatut, setFiltreStatut] = useState('Tous');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chargerMemoires();
    }, []);

    const chargerMemoires = () => {
        api.get('/memoires').then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setMemoires(data);
        }).finally(() => setLoading(false));
    };

    const supprimerMemoire = async (id) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce mémoire ?')) return;
        try {
            await api.delete('/memoires/' + id);
            setMemoires(prev => prev.filter(m => m.id_memoire !== id));
        } catch (err) {
            alert('Erreur lors de la suppression.');
        }
    };

    const couleurStatut = (statut) => {
        const map = {
            cree:     { bg: '#fff8e1', color: '#f57f17', label: 'Créé' },
            en_cours: { bg: '#e3f2fd', color: '#1565c0', label: 'En cours' },
            soutenu:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Soutenu' },
        };
        return map[statut] || { bg: '#f5f5f5', color: '#555', label: 'Inconnu' };
    };

    const statuts = ['Tous', 'cree', 'en_cours', 'soutenu'];

    const labelOnglet = {
        Tous: 'Tous',
        cree: 'Créé',
        en_cours: 'En cours',
        soutenu: 'Soutenu',
    };

    const getCount = (s) => {
        if (s === 'Tous') return memoires.length;
        return memoires.filter(m => m.statut === s).length;
    };

    const memoiresFiltres = filtreStatut === 'Tous'
        ? memoires
        : memoires.filter(m => m.statut === filtreStatut);

    return (
        <div style={styles.page}>
            <Sidebar active="Mémoires" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>📄 Mémoires</div>
                    <button
                        style={styles.btnNouveau}
                        onClick={() => window.location.href = '/dashboard/admin-ecole/memoires/nouveau'}
                    >
                        + Nouveau mémoire
                    </button>
                </div>

                {/* Stats bar */}
                <div style={styles.statsBar}>
                    {statuts.filter(s => s !== 'Tous').map(s => {
                        const c = couleurStatut(s);
                        return (
                            <div key={s} style={{ ...styles.statItem, backgroundColor: c.bg }}>
                                <span style={{ ...styles.statCount, color: c.color }}>{getCount(s)}</span>
                                <span style={styles.statLabel}>{c.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Onglets */}
                <div style={styles.onglets}>
                    {statuts.map(s => (
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
                            {labelOnglet[s]} ({getCount(s)})
                        </button>
                    ))}
                </div>

                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.loading}>⏳ Chargement...</p>
                    ) : memoiresFiltres.length === 0 ? (
                        <p style={styles.vide}>📭 Aucun mémoire trouvé.</p>
                    ) : (
                        <div style={styles.grid}>
                            {memoiresFiltres.map(m => {
                                const c = couleurStatut(m.statut);
                                const etudiant = m.encadreurs?.[0]?.etudiant?.utilisateur;
                                const encadrant = m.encadreurs?.[0]?.encadrant?.utilisateur;
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
                                                <span style={styles.cardInfoVal}>{m.filiere?.libelle_filiere || '-'}</span>
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
                                            <button
                                                style={styles.btnSupprimer}
                                                onClick={() => supprimerMemoire(m.id_memoire)}
                                            >
                                                🗑 Supprimer
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
    statsBar: {
        display: 'flex', gap: '1rem', padding: '1rem 2.5rem',
        backgroundColor: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto',
    },
    statItem: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0.5rem 1.25rem', borderRadius: '10px', minWidth: '80px',
    },
    statCount: { fontSize: '1.5rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.72rem', color: '#666', marginTop: '4px', fontWeight: '500' },
    onglets: {
        display: 'flex', padding: '0 2.5rem', backgroundColor: '#fff',
        borderBottom: '1px solid #eee', overflowX: 'auto',
    },
    onglet: {
        padding: '0.85rem 1.25rem', background: 'none', border: 'none',
        fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap',
    },
    content: { padding: '2rem 2.5rem' },
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
    btnSupprimer: {
        flex: 1, padding: '6px 0', backgroundColor: '#fdecea', color: '#c62828',
        borderRadius: '8px', border: '1px solid #f5c6cb', fontSize: '0.8rem',
        fontWeight: '600', cursor: 'pointer',
    },
};