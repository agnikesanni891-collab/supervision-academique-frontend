import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function GestionCycles() {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ libelle: '' });
    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const chargerCycles = () => {
        setLoading(true);
        api.get('/cycles')
            .then(res => setCycles(Array.isArray(res.data) ? res.data : []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { chargerCycles(); }, []);

    const resetForm = () => {
        setForm({ libelle: '' });
        setEditId(null);
        setMessage('');
        setErreur('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        setErreur('');
        try {
            if (editId) {
                await api.put(`/cycles/${editId}`, form);
                setMessage('Cycle modifié avec succès !');
            } else {
                await api.post('/cycles', form);
                setMessage('Cycle créé avec succès !');
            }
            resetForm();
            chargerCycles();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de l\'opération.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cycle) => {
        setEditId(cycle.id_cycle);
        setForm({ libelle: cycle.libelle });
        setMessage('');
        setErreur('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce cycle ?')) return;
        try {
            await api.delete(`/cycles/${id}`);
            setMessage('Cycle supprimé.');
            chargerCycles();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    return (
        <div style={styles.page}>
            <Sidebar active="Cycles" />

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>🔄 Gestion des cycles</div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur  && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.content}>

                    {/* Formulaire */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>
                            {editId ? '✏️ Modifier le cycle' : '➕ Nouveau cycle'}
                        </h2>

                        <form onSubmit={handleSubmit}>
<div style={styles.field}>
    <label style={styles.label}>LIBELLÉ DU CYCLE</label>
    <select
        value={form.libelle}
        onChange={e => setForm({ libelle: e.target.value })}
        style={styles.input}
        required
    >
        <option value="">Sélectionner un cycle</option>
        <option value="Licence">Licence</option>
        <option value="Master">Master</option>
        <option value="Doctorat">Doctorat</option>
        <option value="BTS">BTS</option>
        <option value="DUT">DUT</option>
    </select>
</div>

                            <div style={styles.actions}>
                                {editId && (
                                    <button
                                        type="button"
                                        style={styles.btnAnnuler}
                                        onClick={resetForm}
                                    >
                                        Annuler
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    style={submitting ? styles.btnDisabled : styles.btnSoumettre}
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? 'Enregistrement...'
                                        : editId ? '✅ Modifier' : '✅ Créer le cycle'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Liste checklist */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>📋 Cycles existants</h2>

                        {loading ? (
                            <p style={styles.vide}>Chargement...</p>
                        ) : cycles.length === 0 ? (
                            <p style={styles.vide}>Aucun cycle enregistré.</p>
                        ) : (
                            <div style={styles.liste}>
                                {cycles.map((c, i) => (
                                    <div
                                        key={c.id_cycle}
                                        style={{
                                            ...styles.item,
                                            ...(editId === c.id_cycle ? styles.itemActif : {}),
                                        }}
                                    >
                                        {/* Icône + libellé */}
                                        <div style={styles.itemGauche}>
                                            <div style={styles.checkIcon}>✓</div>
                                            <span style={styles.itemLabel}>{c.libelle}</span>
                                        </div>

                                        {/* Actions */}
                                        <div style={styles.itemActions}>
                                            <button
                                                style={styles.btnEdit}
                                                onClick={() => handleEdit(c)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                style={styles.btnDelete}
                                                onClick={() => handleDelete(c.id_cycle)}
                                            >
                                                🗑️
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
    content: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
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
    actions: { display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' },
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
    vide: { color: '#aaa', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' },

    // Checklist styles
    liste: { display: 'flex', flexDirection: 'column', gap: '0' },
    item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        borderBottom: '1px solid #f0f0f0',
        borderRadius: '8px',
        transition: 'background 0.15s',
    },
    itemActif: {
        backgroundColor: '#e8f5ee',
    },
    itemGauche: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    checkIcon: {
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: '#1a6b3c',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '700',
        flexShrink: 0,
    },
    itemLabel: {
        fontSize: '0.92rem',
        fontWeight: '500',
        color: '#1a1a2e',
    },
    itemActions: {
        display: 'flex',
        gap: '0.4rem',
    },
    btnEdit: {
        padding: '0.35rem 0.6rem',
        backgroundColor: '#fff8e1',
        border: '1px solid #ffe082',
        borderRadius: '8px',
        fontSize: '0.85rem',
        cursor: 'pointer',
    },
    btnDelete: {
        padding: '0.35rem 0.6rem',
        backgroundColor: '#fdecea',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        fontSize: '0.85rem',
        cursor: 'pointer',
    },
};