import { useState } from 'react';
import api from '../api/axios';
import Logo from '../components/Logo';

const SVG_ICONS = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
    ),
    memoires: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
    ),
    avancement: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
    ),
    utilisateurs: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    filieres: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
        </svg>
    ),
    cycles: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.86-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
    ),
    profil: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    ),
};

export default function Profil() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [modeEdition, setModeEdition] = useState(false);
    const [form, setForm] = useState({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        mot_de_passe: '',
    });
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');
    const [saving, setSaving] = useState(false);

    const getRoleLabel = () => {
        switch (user.role) {
            case 'admin_ecole':      return 'Admin École';
            case 'admin_plateforme': return 'Admin Plateforme';
            case 'encadrant':        return 'Encadrant';
            case 'etudiant':         return 'Étudiant';
            default:                 return user.role;
        }
    };

    const getMenus = () => {
        switch (user.role) {
            case 'admin_plateforme':
                return [
                    { label: 'Tableau de bord', icon: SVG_ICONS.dashboard,    path: '/dashboard/admin' },
                    { label: 'Profil',           icon: SVG_ICONS.profil,       path: '/dashboard/admin/profil' },
                ];
            case 'admin_ecole':
                return [
                    { label: 'Tableau de bord', icon: SVG_ICONS.dashboard,    path: '/dashboard/admin-ecole' },
                    { label: 'Mémoires',        icon: SVG_ICONS.memoires,     path: '/dashboard/admin-ecole/memoires' },
                    { label: 'Avancement',      icon: SVG_ICONS.avancement,   path: '/dashboard/admin-ecole/avancement' },
                    { label: 'Utilisateurs',    icon: SVG_ICONS.utilisateurs, path: '/dashboard/admin-ecole/utilisateurs' },
                    { label: 'Filières',        icon: SVG_ICONS.filieres,     path: '/dashboard/admin-ecole/filieres' },
                    { label: 'Cycles',          icon: SVG_ICONS.cycles,       path: '/dashboard/admin-ecole/cycles' },
                    { label: 'Profil',          icon: SVG_ICONS.profil,       path: '/dashboard/admin-ecole/profil' },
                ];
            case 'encadrant':
                return [
                    { label: 'Mes mémoires', icon: SVG_ICONS.memoires, path: '/dashboard/encadrant' },
                    { label: 'Profil',       icon: SVG_ICONS.profil,   path: '/dashboard/encadrant/profil' },
                ];
            case 'etudiant':
                return [
                    { label: 'Mon mémoire', icon: SVG_ICONS.memoires, path: '/dashboard/etudiant' },
                    { label: 'Profil',      icon: SVG_ICONS.profil,   path: '/dashboard/etudiant/profil' },
                ];
            default:
                return [];
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(''); setErreur('');
        try {
            const payload = { nom: form.nom, prenom: form.prenom, email: form.email };
            if (form.mot_de_passe) payload.mot_de_passe = form.mot_de_passe;
            await api.put('/utilisateurs/' + user.id_user, payload);
            const userMaj = { ...user, nom: form.nom, prenom: form.prenom, email: form.email };
            localStorage.setItem('user', JSON.stringify(userMaj));
            setMessage('Profil mis à jour avec succès !');
            setModeEdition(false);
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la mise à jour.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const menus = getMenus();
    const currentPath = window.location.pathname;

    return (
        <div style={styles.page}>
            {/* Sidebar dynamique selon le rôle */}
            <div style={styles.sidebar}>
                <div style={styles.logoZone}>
                    <Logo size={80} showText={false} />
                </div>
                <nav style={styles.nav}>
                    {menus.map(item => {
                        const isActif = currentPath === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => window.location.href = item.path}
                                style={{
                                    ...styles.menuItem,
                                    ...(isActif ? styles.menuActif : {}),
                                }}
                            >
                                <span style={{
                                    ...styles.iconWrap,
                                    ...(isActif ? styles.iconWrapActif : {}),
                                }}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>👤 Profil</div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur   && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.content}>
                    <div style={styles.carteGauche}>
                        <div style={styles.avatar}>
                            {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                        </div>
                        <div style={styles.nom}>{form.prenom} {form.nom}</div>
                        <div style={styles.roleBadge}>👑 {getRoleLabel()}</div>
                        <button style={styles.btnModifier} onClick={() => setModeEdition(!modeEdition)}>
                            {modeEdition ? '✕ Annuler' : '✏️ Modifier le profil'}
                        </button>
                    </div>

                    <div style={styles.carteDroite}>
                        <div style={styles.sectionTitre}>🔵 Informations personnelles</div>

                        {!modeEdition ? (
                            <>
                                <div style={styles.field}><label style={styles.label}>NOM</label><div style={styles.valeur}>{form.nom}</div></div>
                                <div style={styles.field}><label style={styles.label}>PRÉNOM</label><div style={styles.valeur}>{form.prenom}</div></div>
                                <div style={styles.field}><label style={styles.label}>EMAIL</label><div style={styles.valeur}>{form.email}</div></div>
                                <div style={styles.field}><label style={styles.label}>RÔLE</label><div style={styles.valeur}>{getRoleLabel()}</div></div>
                            </>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={styles.field}><label style={styles.label}>NOM</label><input name="nom" value={form.nom} onChange={handleChange} style={styles.input} required /></div>
                                <div style={styles.field}><label style={styles.label}>PRÉNOM</label><input name="prenom" value={form.prenom} onChange={handleChange} style={styles.input} required /></div>
                                <div style={styles.field}><label style={styles.label}>EMAIL</label><input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} required /></div>
                                <div style={styles.field}>
                                    <label style={styles.label}>NOUVEAU MOT DE PASSE (optionnel)</label>
                                    <input name="mot_de_passe" type="password" value={form.mot_de_passe} onChange={handleChange} style={styles.input} placeholder="Laisser vide pour ne pas changer" />
                                </div>
                                <button type="submit" style={saving ? styles.btnDisabled : styles.btnSauvegarder} disabled={saving}>
                                    {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                                </button>
                            </form>
                        )}

                        <button style={styles.btnDeconnexion} onClick={handleLogout}>
                            🚪 Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    sidebar: {
        width: '240px', minHeight: '100vh', backgroundColor: '#1a6b3c',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, bottom: 0,
    },
    logoZone: {
        display: 'flex', justifyContent: 'center',
        padding: '1.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
    },
    nav: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '1rem 0.75rem', flex: 1 },
    menuItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0.7rem 0.85rem', borderRadius: '10px',
        color: 'rgba(255,255,255,0.75)', background: 'none',
        border: 'none', fontSize: '0.88rem', fontWeight: '500',
        cursor: 'pointer', width: '100%', textAlign: 'left',
    },
    menuActif: { backgroundColor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: '700' },
    iconWrap: {
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'rgba(255,255,255,0.75)',
    },
    iconWrapActif: { backgroundColor: '#fff', color: '#1a6b3c' },
    main: { marginLeft: '240px', flex: 1 },
    header: {
        padding: '1.25rem 2.5rem', backgroundColor: '#fff',
        borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    succes: { backgroundColor: '#e8f5ee', color: '#1a6b3c', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #c3e6cb' },
    erreur: { backgroundColor: '#fdecea', color: '#c62828', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #f5c6cb' },
    content: { display: 'flex', gap: '2rem', padding: '2rem 2.5rem', alignItems: 'flex-start' },
    carteGauche: {
        backgroundColor: '#fff', borderRadius: '14px', padding: '2rem',
        textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        width: '260px', flexShrink: 0,
    },
    avatar: {
        width: '90px', height: '90px', borderRadius: '50%',
        backgroundColor: '#1a6b3c', color: '#fff', fontSize: '1.8rem',
        fontWeight: '700', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 1rem',
    },
    nom: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' },
    roleBadge: {
        display: 'inline-block', backgroundColor: '#e8f5ee', color: '#1a6b3c',
        padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem',
        fontWeight: '600', marginBottom: '1.5rem',
    },
    btnModifier: {
        width: '100%', padding: '0.75rem', backgroundColor: '#1a6b3c',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
    },
    carteDroite: {
        backgroundColor: '#fff', borderRadius: '14px', padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: 1,
    },
    sectionTitre: {
        fontSize: '1rem', fontWeight: '700', color: '#1a1a2e',
        marginBottom: '1.5rem', paddingBottom: '0.75rem',
        borderBottom: '1px solid #f0f0f0',
    },
    field: { marginBottom: '1.25rem' },
    label: {
        fontSize: '0.72rem', fontWeight: '700', color: '#aaa',
        letterSpacing: '0.8px', textTransform: 'uppercase',
        display: 'block', marginBottom: '0.4rem',
    },
    valeur: {
        padding: '0.75rem 1rem', backgroundColor: '#f8f9fa',
        borderRadius: '8px', fontSize: '0.9rem', color: '#333', border: '1px solid #eee',
    },
    input: {
        width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
        border: '1.5px solid #ddd', fontSize: '0.9rem', outline: 'none',
        backgroundColor: '#f8f9fa', boxSizing: 'border-box',
    },
    btnSauvegarder: {
        width: '100%', padding: '0.85rem', backgroundColor: '#1a6b3c',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', marginBottom: '1rem',
    },
    btnDisabled: {
        width: '100%', padding: '0.85rem', backgroundColor: '#a5c9b5',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '0.95rem', cursor: 'not-allowed', fontWeight: '600', marginBottom: '1rem',
    },
    btnDeconnexion: {
        width: '100%', padding: '0.85rem', backgroundColor: '#1a6b3c',
        color: '#f9f7f7', border: '1px solid #1a6b3c', borderRadius: '10px',
        fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', marginTop: '1rem',
    },
};