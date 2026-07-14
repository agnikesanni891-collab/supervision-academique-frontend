import { useState } from 'react';
import api from '../api/axios';
import Logo from '../components/Logo';

export default function Login() {
    const [form, setForm] = useState({ email: '', mot_de_passe: '' });
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            const response = await api.post('/login', form);
            const { token, utilisateur } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(utilisateur));
            switch (utilisateur.role) {
                case 'admin_plateforme': window.location.href = '/dashboard/admin'; break;
                case 'admin_ecole': window.location.href = '/dashboard/admin-ecole'; break;
                case 'encadrant': window.location.href = '/dashboard/encadrant'; break;
                case 'etudiant': window.location.href = '/dashboard/etudiant'; break;
                default: window.location.href = '/';
            }
        } catch (err) {
            setErreur(err.response?.data?.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logoZone}>
                    <Logo size={120} />
                </div>

                <h2 style={styles.titre}>Connexion à la plateforme</h2>

                {erreur && <div style={styles.erreur}>{erreur}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Mot de passe</label>
                        <input
                            type="password"
                            name="mot_de_passe"
                            value={form.mot_de_passe}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Mot de passe oublié ?{' '}
                    <span style={styles.lien} onClick={() => setShowModal(true)}>Cliquez ici</span>
                </p>
            </div>

            {showModal && (
                <div style={styles.overlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalIcone}>🔒</div>
                        <h3 style={styles.modalTitre}>Mot de passe oublié ?</h3>
                        <p style={styles.modalTexte}>
                            Pour réinitialiser votre mot de passe, veuillez contacter
                            votre <strong>administrateur</strong>. Il pourra vous
                            créer de nouveaux identifiants de connexion.
                        </p>
                        <div style={styles.modalInfo}>
                            📧 Contactez votre établissement directement.
                        </div>
                        <button style={styles.modalBtn} onClick={() => setShowModal(false)}>
                            Compris
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const VERT = '#1a6b3c';
const VERT_CLAIR = '#e8f5ee';

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
    logoZone: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' },
    titre: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.5rem' },
    erreur: { backgroundColor: '#fdecea', color: '#c62828', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'left' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.875rem', fontWeight: '500', color: '#333' },
    input: { padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.95rem', outline: 'none', backgroundColor: VERT_CLAIR },
    btn: { padding: '0.85rem', backgroundColor: VERT, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
    btnDisabled: { padding: '0.85rem', backgroundColor: '#a5c9b5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'not-allowed', marginTop: '0.5rem' },
    footer: { marginTop: '1.5rem', fontSize: '0.85rem', color: '#888' },
    lien: { color: VERT, fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
    modalIcone: { fontSize: '2.5rem', marginBottom: '1rem' },
    modalTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1rem' },
    modalTexte: { fontSize: '0.9rem', color: '#555', lineHeight: '1.6', marginBottom: '1rem' },
    modalInfo: { backgroundColor: VERT_CLAIR, color: VERT, padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' },
    modalBtn: { padding: '0.75rem 2rem', backgroundColor: VERT, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
};