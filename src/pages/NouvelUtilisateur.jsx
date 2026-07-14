import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function NouvelUtilisateur() {
    const [form, setForm] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: '',
        role: 'etudiant', id_filiere: '',
        specialite: '', grade: '',
    });
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/filieres').then(res => {
            setFilieres(Array.isArray(res.data) ? res.data : []);
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
            const payload = {
                nom:          form.nom,
                prenom:       form.prenom,
                email:        form.email,
                mot_de_passe: form.mot_de_passe,
                role:         form.role,
            };
            if (form.role === 'etudiant') {
                payload.id_filiere = parseInt(form.id_filiere);
            }
            if (form.role === 'encadrant') {
                payload.specialite = form.specialite;
                payload.grade      = form.grade;
            }
            await api.post('/utilisateurs', payload);
            setMessage('✅ Utilisateur créé avec succès !');
            setTimeout(() => {
                window.location.href = '/dashboard/admin-ecole/utilisateurs';
            }, 1500);
        } catch (err) {
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const firstError = Object.values(errors)[0];
                setErreur(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setErreur(err.response?.data?.message || 'Erreur lors de la création.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <Sidebar active="Utilisateurs" />
            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>👥 Nouvel utilisateur</div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur  && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.content}>
                    <div style={styles.card}>
                        <h2 style={styles.cardTitre}>Informations de l'utilisateur</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.field}>
                                <label style={styles.label}>RÔLE</label>
                                <select name="role" value={form.role} onChange={handleChange} style={styles.input} required>
                                    <option value="etudiant">Étudiant</option>
                                    <option value="encadrant">Encadrant</option>
                                </select>
                            </div>

                            <div style={styles.row}>
                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>NOM</label>
                                    <input name="nom" value={form.nom} onChange={handleChange} style={styles.input} placeholder="Nom" required />
                                </div>
                                <div style={{ ...styles.field, flex: 1 }}>
                                    <label style={styles.label}>PRÉNOM</label>
                                    <input name="prenom" value={form.prenom} onChange={handleChange} style={styles.input} placeholder="Prénom" required />
                                </div>
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>EMAIL</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="email@exemple.com" required />
                            </div>

                            <div style={styles.field}>
                                <label style={styles.label}>MOT DE PASSE</label>
                                <input name="mot_de_passe" type="password" value={form.mot_de_passe} onChange={handleChange} style={styles.input} placeholder="Minimum 6 caractères" required />
                            </div>

                            {form.role === 'etudiant' && (
                                <div style={styles.field}>
                                    <label style={styles.label}>FILIÈRE</label>
                                    <select name="id_filiere" value={form.id_filiere} onChange={handleChange} style={styles.input} required>
                                        <option value="">Sélectionner une filière</option>
                                        {filieres.map(f => (
                                            <option key={f.id_filiere} value={f.id_filiere}>{f.libelle_filiere}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {form.role === 'encadrant' && (
                                <>
                                    <div style={styles.field}>
                                        <label style={styles.label}>SPÉCIALITÉ</label>
                                        <select name="specialite" value={form.specialite} onChange={handleChange} style={styles.input}>
                                            <option value="">Sélectionner une spécialité</option>
                                            <option value="Génie Logiciel">Génie Logiciel</option>
                                            <option value="Réseaux et Télécommunications">Réseaux et Télécommunications</option>
                                            <option value="Systèmes d'Information">Systèmes d'Information</option>
                                            <option value="Intelligence Artificielle">Intelligence Artificielle</option>
                                            <option value="Sécurité Informatique">Sécurité Informatique</option>
                                            <option value="Base de Données">Base de Données</option>
                                            <option value="Développement Web et Mobile">Développement Web et Mobile</option>
                                            <option value="Génie Électrique">Génie Électrique</option>
                                            <option value="Mathématiques Appliquées">Mathématiques Appliquées</option>
                                            <option value="Gestion de Projets Informatiques">Gestion de Projets Informatiques</option>
                                        </select>
                                    </div>
                                   
                                </>
                            )}

                            <div style={styles.actions}>
                                <button type="button" style={styles.btnAnnuler}
                                    onClick={() => window.location.href = '/dashboard/admin-ecole/utilisateurs'}>
                                    Annuler
                                </button>
                                <button type="submit" style={loading ? styles.btnDisabled : styles.btnSoumettre} disabled={loading}>
                                    {loading ? '⏳ Création...' : "✅ Créer l'utilisateur"}
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
    header: { padding: '1.25rem 2.5rem', backgroundColor: '#fff', borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    succes: { backgroundColor: '#e8f5ee', color: '#1a6b3c', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #c3e6cb' },
    erreur: { backgroundColor: '#fdecea', color: '#c62828', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #f5c6cb' },
    content: { padding: '2rem 2.5rem' },
    card: { backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '700px' },
    cardTitre: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0' },
    row: { display: 'flex', gap: '1rem' },
    field: { marginBottom: '1.25rem' },
    label: { fontSize: '0.72rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' },
    input: { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.9rem', outline: 'none', backgroundColor: '#f8f9fa', boxSizing: 'border-box' },
    actions: { display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' },
    btnAnnuler: { padding: '0.75rem 1.5rem', backgroundColor: '#f0f2f5', color: '#555', border: '1px solid #ddd', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    btnSoumettre: { padding: '0.75rem 1.5rem', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    btnDisabled: { padding: '0.75rem 1.5rem', backgroundColor: '#a5c9b5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', cursor: 'not-allowed', fontWeight: '600' },
};