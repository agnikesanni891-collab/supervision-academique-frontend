import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function NouveauMemoire() {
    const [form, setForm] = useState({
        titre: '',
        id_filiere: '',
        id_cycle: '',
        id_etudiant: '',
        id_encadrant: '',
    });
    const [filieres, setFilieres] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [etudiants, setEtudiants] = useState([]);
    const [encadrants, setEncadrants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/filieres').then(res => {
            setFilieres(Array.isArray(res.data) ? res.data : []);
        });
        api.get('/cycles').then(res => {
            setCycles(Array.isArray(res.data) ? res.data : []);
        });
        api.get('/utilisateurs').then(res => {
            const users = Array.isArray(res.data) ? res.data : [];
            setEtudiants(users.filter(u => u.role === 'etudiant'));
            setEncadrants(users.filter(u => u.role === 'encadrant'));
        });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setErreur('');
        try {
            await api.post('/memoires', {
                titre: form.titre,
                id_filiere: parseInt(form.id_filiere),
                id_cycle: form.id_cycle ? parseInt(form.id_cycle) : null,
                id_etudiant: parseInt(form.id_etudiant),
                id_encadrant: parseInt(form.id_encadrant),
            });
            setMessage('Mémoire créé avec succès !');
            setTimeout(() => {
                window.location.href = '/dashboard/admin-ecole';
            }, 1500);
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <Sidebar active="Mémoires" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>📄 Nouveau mémoire</div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.content}>
                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>Informations du mémoire</h2>

                        <form onSubmit={handleSubmit}>
                            <div style={styles.field}>
                                <label style={styles.label}>TITRE DU MÉMOIRE</label>
                                <input
                                    name="titre"
                                    value={form.titre}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Entrez le titre complet du mémoire"
                                    required
                                />
                            </div>

                            <div style={styles.row}>
                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>FILIÈRE</label>
                                    <select
                                        name="id_filiere"
                                        value={form.id_filiere}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Sélectionner une filière</option>
                                        {filieres.map(f => (
                                            <option key={f.id_filiere} value={f.id_filiere}>
                                                {f.libelle_filiere}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>CYCLE</label>
                                    <select
                                        name="id_cycle"
                                        value={form.id_cycle}
                                        onChange={handleChange}
                                        style={styles.input}
                                    >
                                        <option value="">Sélectionner un cycle</option>
                                        {cycles.map(c => (
                                            <option key={c.id_cycle} value={c.id_cycle}>
                                                {c.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>ÉTUDIANT</label>
                                <select
                                    name="id_etudiant"
                                    value={form.id_etudiant}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                >
                                    <option value="">Sélectionner un étudiant</option>
                                    {etudiants.map(e => (
                                        <option key={e.id_user} value={e.id_user}>
                                            {e.prenom} {e.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>ENCADRANT</label>
                                <select
                                    name="id_encadrant"
                                    value={form.id_encadrant}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                >
                                    <option value="">Sélectionner un encadrant</option>
                                    {encadrants.map(e => (
                                        <option key={e.id_user} value={e.id_user}>
                                            {e.prenom} {e.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.actions}>
                                <button
                                    type="button"
                                    style={styles.btnAnnuler}
                                    onClick={() => window.location.href = '/dashboard/admin-ecole'}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    style={loading ? styles.btnDisabled : styles.btnSoumettre}
                                    disabled={loading}
                                >
                                    {loading ? 'Création...' : '✅ Créer le mémoire'}
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
    },
    row: {
        display: 'flex',
        gap: '1rem',
    },
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
    btnSoumettre: {
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
        fontWeight: '600',
        cursor: 'not-allowed',
    },
};