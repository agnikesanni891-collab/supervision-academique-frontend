import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function ModifierUtilisateur() {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.indexOf('utilisateurs') + 1];

    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        specialite: '',
        grade: '',
    });
    const [role, setRole] = useState('');
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/filieres').then(res => {
            setFilieres(Array.isArray(res.data) ? res.data : []);
        });
        api.get('/utilisateurs/' + id).then(res => {
            const u = res.data;
            setRole(u.role);
            setForm({
                nom: u.nom || '',
                prenom: u.prenom || '',
                email: u.email || '',
                mot_de_passe: '',
                specialite: u.encadrant?.specialite || '',
                grade: u.encadrant?.grade || '',
            });
        }).catch(() => {
            setErreur('Impossible de charger les données de cet utilisateur.');
        }).finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setErreur('');
        try {
            const payload = {
                nom: form.nom,
                prenom: form.prenom,
                email: form.email,
            };
            if (form.mot_de_passe) {
                payload.mot_de_passe = form.mot_de_passe;
            }
            await api.put('/utilisateurs/' + id, payload);
            setMessage('Utilisateur modifié avec succès !');
            setTimeout(() => {
                window.location.href = '/dashboard/admin-ecole/utilisateurs';
            }, 1500);
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={styles.page}>
            <Sidebar active="Utilisateurs" />
            <div style={styles.main}>
                <p style={{ padding: '2rem', color: '#999' }}>⏳ Chargement...</p>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <Sidebar active="Utilisateurs" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>✏️ Modifier utilisateur</div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.content}>
                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>
                            Modifier —{' '}
                            <span style={{ color: '#1a6b3c' }}>{form.prenom} {form.nom}</span>
                            <span style={{
                                marginLeft: '10px',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                backgroundColor: '#e8f5ee',
                                color: '#1a6b3c',
                                fontWeight: '600',
                            }}>
                                {role}
                            </span>
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={styles.row}>
                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>NOM</label>
                                    <input
                                        name="nom"
                                        value={form.nom}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>PRÉNOM</label>
                                    <input
                                        name="prenom"
                                        value={form.prenom}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>EMAIL</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>NOUVEAU MOT DE PASSE (optionnel)</label>
                                <input
                                    name="mot_de_passe"
                                    type="password"
                                    value={form.mot_de_passe}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>

                            {role === 'encadrant' && (
                                <>
                                    <div style={styles.field}>
                                        <label style={styles.label}>SPÉCIALITÉ</label>
                                        <input
                                            name="specialite"
                                            value={form.specialite}
                                            onChange={handleChange}
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>GRADE</label>
                                        <input
                                            name="grade"
                                            value={form.grade}
                                            onChange={handleChange}
                                            style={styles.input}
                                        />
                                    </div>
                                </>
                            )}

                            <div style={styles.actions}>
                                <button
                                    type="button"
                                    style={styles.btnAnnuler}
                                    onClick={() => window.location.href = '/dashboard/admin-ecole/utilisateurs'}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    style={saving ? styles.btnDisabled : styles.btnSauvegarder}
                                    disabled={saving}
                                >
                                    {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                                </button>
                            </div>
                        </form>
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
        padding: '1.25rem 2.5rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    succes: {
        backgroundColor: '#e8f5ee',
        color: '#1a6b3c',
        padding: '0.75rem 2.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        borderBottom: '1px solid #c3e6cb',
    },
    erreur: {
        backgroundColor: '#fdecea',
        color: '#c62828',
        padding: '0.75rem 2.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        borderBottom: '1px solid #f5c6cb',
    },
    content: { padding: '2rem 2.5rem' },
    card: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        maxWidth: '700px',
    },
    cardTitre: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '1.5rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
    },
    row: { display: 'flex', gap: '1rem' },
    field: { marginBottom: '1.25rem' },
    label: {
        fontSize: '0.72rem',
        fontWeight: '700',
        color: '#aaa',
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '0.4rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1.5px solid #ddd',
        fontSize: '0.9rem',
        outline: 'none',
        backgroundColor: '#f8f9fa',
        boxSizing: 'border-box',
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        justifyContent: 'flex-end',
    },
    btnAnnuler: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#f0f2f5',
        color: '#555',
        border: '1px solid #ddd',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnSauvegarder: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#1a6b3c',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnDisabled: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#a5c9b5',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        cursor: 'not-allowed',
        fontWeight: '600',
    },
};