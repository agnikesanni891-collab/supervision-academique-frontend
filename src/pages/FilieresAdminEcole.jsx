import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function FilieresAdminEcole() {
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [modeEdition, setModeEdition] = useState(false);
    const [filiereEnEdition, setFiliereEnEdition] = useState(null);
    const [form, setForm] = useState({ libelle_filiere: '', id_etablissement: 1 });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        chargerFilieres();
    }, []);

    const chargerFilieres = () => {
        api.get('/filieres').then(res => {
            setFilieres(Array.isArray(res.data) ? res.data : []);
        }).finally(() => setLoading(false));
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const ouvrirCreation = () => {
        setModeEdition(false);
        setFiliereEnEdition(null);
        setForm({ libelle_filiere: '', id_etablissement: 1 });
        setShowForm(true);
    };

    const ouvrirEdition = (filiere) => {
        setModeEdition(true);
        setFiliereEnEdition(filiere);
        setForm({ libelle_filiere: filiere.libelle_filiere, id_etablissement: filiere.id_etablissement });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setErreur('');
        try {
            if (modeEdition) {
                await api.put('/filieres/' + filiereEnEdition.id_filiere, form);
                setMessage('Filière modifiée avec succès !');
            } else {
                await api.post('/filieres', form);
                setMessage('Filière créée avec succès !');
            }
            setForm({ libelle_filiere: '', id_etablissement: 1 });
            setShowForm(false);
            setModeEdition(false);
            setFiliereEnEdition(null);
            chargerFilieres();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de l\'opération.');
        } finally {
            setSaving(false);
        }
    };

    const supprimerFiliere = async (id) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette filière ?')) return;
        try {
            await api.delete('/filieres/' + id);
            setFilieres(filieres.filter(f => f.id_filiere !== id));
            setMessage('Filière supprimée avec succès !');
        } catch (err) {
            setErreur('Erreur lors de la suppression.');
        }
    };

    return (
        <div style={styles.page}>
            <Sidebar active="Filières" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>🎓 Filières</div>
                    <button
                        style={styles.btnNouveau}
                        onClick={showForm ? () => setShowForm(false) : ouvrirCreation}
                    >
                        {showForm ? '✕ Annuler' : '+ Nouvelle filière'}
                    </button>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur && <div style={styles.erreurBanner}>{erreur}</div>}

                <div style={styles.content}>

                    {showForm && (
                        <div style={styles.formCard}>
                            <h2 style={styles.formTitre}>
                                {modeEdition ? '✏️ Modifier la filière' : '+ Nouvelle filière'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div style={styles.field}>
                                    <label style={styles.label}>LIBELLÉ DE LA FILIÈRE</label>
                                    <input
                                        name="libelle_filiere"
                                        value={form.libelle_filiere}
                                        onChange={handleChange}
                                        style={styles.input}
                                        placeholder="Ex: Génie Logiciel"
                                        required
                                    />
                                </div>
                                <div style={styles.actions}>
                                    <button
                                        type="button"
                                        style={styles.btnAnnuler}
                                        onClick={() => setShowForm(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        style={saving ? styles.btnDisabled : styles.btnSauvegarder}
                                        disabled={saving}
                                    >
                                        {saving ? 'Sauvegarde...' : modeEdition ? '💾 Modifier' : '✅ Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={styles.section}>
                        {loading ? (
                            <p style={styles.loading}>⏳ Chargement...</p>
                        ) : filieres.length === 0 ? (
                            <p style={styles.vide}>Aucune filière trouvée.</p>
                        ) : (
                            <div style={styles.grid}>
                                {filieres.map(f => (
                                    <div key={f.id_filiere} style={styles.card}>
                                        <div style={styles.cardIcone}>🎓</div>
                                        <div style={styles.cardNom}>{f.libelle_filiere}</div>
                                        <div style={styles.cardActions}>
                                            <button
                                                style={styles.btnModifier}
                                                onClick={() => ouvrirEdition(f)}
                                            >
                                                ✏️ Modifier
                                            </button>
                                            <button
                                                style={styles.btnSupprimer}
                                                onClick={() => supprimerFiliere(f.id_filiere)}
                                            >
                                                🗑 Supprimer
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
    succes: {
        backgroundColor: '#e8f5ee',
        color: '#1a6b3c',
        padding: '0.75rem 2.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        borderBottom: '1px solid #c3e6cb',
    },
    erreurBanner: {
        backgroundColor: '#fdecea',
        color: '#c62828',
        padding: '0.75rem 2.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        borderBottom: '1px solid #f5c6cb',
    },
    content: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        maxWidth: '500px',
    },
    formTitre: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f0f0f0',
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
    actions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
    btnAnnuler: {
        padding: '0.7rem 1.25rem',
        backgroundColor: '#f0f2f5',
        color: '#555',
        border: '1px solid #ddd',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnSauvegarder: {
        padding: '0.7rem 1.25rem',
        backgroundColor: '#1a6b3c',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnDisabled: {
        padding: '0.7rem 1.25rem',
        backgroundColor: '#a5c9b5',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9rem',
        cursor: 'not-allowed',
        fontWeight: '600',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    loading: { textAlign: 'center', color: '#999', padding: '2rem' },
    vide: { textAlign: 'center', color: '#999', padding: '2rem' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
    },
    card: {
        border: '1px solid #eee',
        borderRadius: '12px',
        padding: '1.25rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
    },
    cardIcone: { fontSize: '2rem' },
    cardNom: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' },
    cardActions: { display: 'flex', gap: '8px' },
    btnModifier: {
        padding: '6px 14px',
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        borderRadius: '8px',
        border: '1px solid #bbdefb',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnSupprimer: {
        padding: '6px 14px',
        backgroundColor: '#fdecea',
        color: '#c62828',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
};