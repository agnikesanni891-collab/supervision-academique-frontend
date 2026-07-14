import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function UtilisateursAdminEcole() {
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chargerUtilisateurs();
    }, []);

    const chargerUtilisateurs = () => {
        setLoading(true);
        api.get('/utilisateurs').then(res => {
            console.log('USERS:', res.data);
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setUtilisateurs(data);
        }).catch(err => {
            console.log('ERREUR:', err.response?.data);
        }).finally(() => {
            setLoading(false);
        });
    };

    const toggleActif = async (id) => {
        try {
            await api.patch('/utilisateurs/' + id + '/toggle-actif');
            chargerUtilisateurs();
        } catch (err) {
            alert('Erreur lors de la modification du statut.');
        }
    };

    const couleurRole = (role) => {
        const map = {
            etudiant: { bg: '#e3f2fd', color: '#1565c0' },
            encadrant: { bg: '#e8f5ee', color: '#1a6b3c' },
            admin_ecole: { bg: '#fff8e1', color: '#f0a500' },
            admin_plateforme: { bg: '#f3e5f5', color: '#6a1b9a' },
        };
        return map[role] || { bg: '#f5f5f5', color: '#555' };
    };

    return (
        <div style={styles.page}>
            <Sidebar active="Utilisateurs" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>👥 Utilisateurs</div>
                    <button
                        style={styles.btnNouveau}
                        onClick={() => window.location.href = '/dashboard/admin-ecole/utilisateurs/nouveau'}
                    >
                        + Nouvel utilisateur
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.section}>
                        {loading ? (
                            <p style={styles.loading}>⏳ Chargement...</p>
                        ) : utilisateurs.length === 0 ? (
                            <p style={styles.vide}>Aucun utilisateur trouvé.</p>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Nom</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Rôle</th>
                                        <th style={styles.th}>Statut</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {utilisateurs.map(u => {
                                        const c = couleurRole(u.role);
                                        return (
                                            <tr key={u.id_user} style={styles.tr}>
                                                <td style={styles.td}>{u.prenom} {u.nom}</td>
                                                <td style={styles.td}>{u.email}</td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        backgroundColor: c.bg,
                                                        color: c.color,
                                                    }}>
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        backgroundColor: u.est_actif ? '#e8f5ee' : '#fdecea',
                                                        color: u.est_actif ? '#1a6b3c' : '#c62828',
                                                    }}>
                                                        {u.est_actif ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <button
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            backgroundColor: u.est_actif ? '#fdecea' : '#e8f5ee',
                                                            color: u.est_actif ? '#c62828' : '#1a6b3c',
                                                        }}
                                                        onClick={() => toggleActif(u.id_user)}
                                                    >
                                                        {u.est_actif ? '🔴 Désactiver' : '🟢 Activer'}
                                                    </button>

                                                    <button
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            backgroundColor: '#e3f2fd',
                                                            color: '#1565c0',
                                                            marginRight: '8px',
                                                        }}
                                                        onClick={() => window.location.href = '/dashboard/admin-ecole/utilisateurs/' + u.id_user + '/modifier'}
                                                    >
                                                        ✏️ Modifier
                                                    </button>
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2.5rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    btnNouveau: {
        padding: '0.7rem 1.5rem',
        backgroundColor: '#1a6b3c',
        color: '#fff',
        borderRadius: '10px',
        border: 'none',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    content: { padding: '2rem 2.5rem' },
    section: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflowX: 'auto',
    },
    loading: { textAlign: 'center', color: '#999', padding: '2rem' },
    vide: { textAlign: 'center', color: '#999', padding: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '0.85rem 1rem',
        textAlign: 'left',
        fontSize: '0.78rem',
        fontWeight: '700',
        color: '#888',
        borderBottom: '2px solid #f0f0f0',
        textTransform: 'uppercase',
    },
    tr: { borderBottom: '1px solid #f8f8f8' },
    td: { padding: '1rem', fontSize: '0.875rem', color: '#333', verticalAlign: 'middle' },
};