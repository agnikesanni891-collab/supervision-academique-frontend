import { useState, useEffect } from 'react';
import api from '../api/axios';
import Logo from '../components/Logo';

export default function DashboardAdminPlateforme() {
    const [onglet, setOnglet] = useState('etablissements');
    const [etablissements, setEtablissements] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    const [modalEtab, setModalEtab] = useState(false);
    const [modalAdmin, setModalAdmin] = useState(false);
    const [editEtab, setEditEtab] = useState(null);
    const [editAdmin, setEditAdmin] = useState(null);

    const [formEtab, setFormEtab] = useState({ nom_etablissement: '', ville: '', adresse: '', telephone: '' });
    const [formAdmin, setFormAdmin] = useState({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', id_etablissement: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => { chargerDonnees(); }, []);

    const chargerDonnees = async () => {
        setLoading(true);
        try {
            const [resEtab, resAdmins] = await Promise.all([
                api.get('/etablissements'),
                api.get('/admin-ecoles'),
            ]);
            setEtablissements(Array.isArray(resEtab.data) ? resEtab.data : resEtab.data.data || []);
            setAdmins(Array.isArray(resAdmins.data) ? resAdmins.data : resAdmins.data.data || []);
        } catch (e) {
            setErreur('Erreur chargement données.');
        } finally {
            setLoading(false);
        }
    };

    const flash = (msg, ok = true) => {
        if (ok) { setMessage(msg); setErreur(''); }
        else { setErreur(msg); setMessage(''); }
        setTimeout(() => { setMessage(''); setErreur(''); }, 3000);
    };

    // ===== ÉTABLISSEMENTS =====
    const ouvrirModalEtab = (etab = null) => {
        setEditEtab(etab);
        setFormEtab(etab ? {
            nom_etablissement: etab.nom_etablissement || '',
            ville:             etab.ville || '',
            adresse:           etab.adresse || '',
            telephone:         etab.telephone || '',
        } : { nom_etablissement: '', ville: '', adresse: '', telephone: '' });
        setModalEtab(true);
    };

    const sauvegarderEtab = async () => {
        try {
            if (editEtab) {
                await api.put('/etablissements/' + editEtab.id_etablissement, formEtab);
                flash('✅ Établissement modifié !');
            } else {
                await api.post('/etablissements', formEtab);
                flash('✅ Établissement créé !');
            }
            setModalEtab(false);
            chargerDonnees();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur.', false);
        }
    };

    const supprimerEtab = async (id) => {
        if (!window.confirm('Supprimer cet établissement ?')) return;
        try {
            await api.delete('/etablissements/' + id);
            flash('Établissement supprimé.');
            chargerDonnees();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur suppression.', false);
        }
    };

    // ===== ADMINS ÉCOLE =====
    const ouvrirModalAdmin = (admin = null) => {
        setEditAdmin(admin);
        setFormAdmin(admin ? {
            nom:               admin.utilisateur?.nom || '',
            prenom:            admin.utilisateur?.prenom || '',
            email:             admin.utilisateur?.email || '',
            telephone:         admin.utilisateur?.telephone || '',
            mot_de_passe:      '',
            id_etablissement:  admin.id_etablissement || '',
        } : { nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', id_etablissement: '' });
        setModalAdmin(true);
    };

    const sauvegarderAdmin = async () => {
        try {
            if (editAdmin) {
                await api.put('/utilisateurs/' + editAdmin.id_user, {
                    nom:       formAdmin.nom,
                    prenom:    formAdmin.prenom,
                    email:     formAdmin.email,
                    telephone: formAdmin.telephone,
                    ...(formAdmin.mot_de_passe ? { mot_de_passe: formAdmin.mot_de_passe } : {}),
                });
                flash('✅ Admin modifié !');
            } else {
                await api.post('/utilisateurs', {
                    ...formAdmin,
                    role: 'admin_ecole',
                });
                flash('✅ Admin école créé !');
            }
            setModalAdmin(false);
            chargerDonnees();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur.', false);
        }
    };

    const toggleActif = async (admin) => {
        try {
            await api.patch('/utilisateurs/' + admin.id_user + '/toggle-actif');
            flash('✅ Statut modifié !');
            chargerDonnees();
        } catch (e) {
            flash('Erreur.', false);
        }
    };

const supprimerAdmin = async (id) => {
    if (!window.confirm('Supprimer cet admin école ?')) return;
    try {
        await api.delete('/admin-ecoles/' + id);
        flash('Admin supprimé.');
        chargerDonnees();
    } catch (e) {
        flash(e.response?.data?.message || 'Erreur suppression.', false);
    }
};

    return (
        <div style={styles.page}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={styles.headerTitre}>🌐 Admin Plateforme</div>
                    <div style={styles.profilZone}>
                        <div style={styles.profilInfo}>
                            <div style={styles.profilNom}>{user.prenom} {user.nom}</div>
                            <div style={styles.profilRole}>Admin Plateforme</div>
                        </div>
                        <div style={styles.profilAvatar}>
                            {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                        </div>
                    </div>
                </div>

                {message && <div style={styles.succes}>{message}</div>}
                {erreur && <div style={styles.erreurBanner}>{erreur}</div>}

                {/* Stats */}
                <div style={styles.statsGrid}>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #1a6b3c', backgroundColor: '#e8f5ee' }}>
                        <div style={styles.statIcone}>🏫</div>
                        <div style={{ ...styles.statValeur, color: '#1a6b3c' }}>{etablissements.length}</div>
                        <div style={styles.statLabel}>Établissements</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #1565c0', backgroundColor: '#e3f2fd' }}>
                        <div style={styles.statIcone}>👤</div>
                        <div style={{ ...styles.statValeur, color: '#1565c0' }}>{admins.length}</div>
                        <div style={styles.statLabel}>Admins École</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #2e7d32', backgroundColor: '#e8f5e9' }}>
                        <div style={styles.statIcone}>✅</div>
                        <div style={{ ...styles.statValeur, color: '#2e7d32' }}>
                            {admins.filter(a => a.utilisateur?.est_actif).length}
                        </div>
                        <div style={styles.statLabel}>Admins actifs</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #c62828', backgroundColor: '#fdecea' }}>
                        <div style={styles.statIcone}>❌</div>
                        <div style={{ ...styles.statValeur, color: '#c62828' }}>
                            {admins.filter(a => !a.utilisateur?.est_actif).length}
                        </div>
                        <div style={styles.statLabel}>Admins désactivés</div>
                    </div>
                </div>

                {/* Onglets */}
                <div style={styles.onglets}>
                    <button
                        style={{ ...styles.onglet, borderBottom: onglet === 'etablissements' ? '3px solid #1a6b3c' : '3px solid transparent', color: onglet === 'etablissements' ? '#1a6b3c' : '#888', fontWeight: onglet === 'etablissements' ? '700' : '500' }}
                        onClick={() => setOnglet('etablissements')}
                    >
                        🏫 Établissements ()
                    </button>
                    <button
                        style={{ ...styles.onglet, borderBottom: onglet === 'admins' ? '3px solid #1a6b3c' : '3px solid transparent', color: onglet === 'admins' ? '#1a6b3c' : '#888', fontWeight: onglet === 'admins' ? '700' : '500' }}
                        onClick={() => setOnglet('admins')}
                    >
                        👤 Admins École ({})
                    </button>
                </div>

                <div style={styles.content}>
                    {loading ? <p style={styles.loading}>⏳ Chargement...</p> : (

                        onglet === 'etablissements' ? (
                            <>
                                <div style={styles.toolbar}>
                                    <h2 style={styles.sectionTitre}>Liste des établissements</h2>
                                    <button style={styles.btnNouveau} onClick={() => ouvrirModalEtab()}>
                                        + Nouvel établissement
                                    </button>
                                </div>
                                {etablissements.length === 0 ? (
                                    <p style={styles.vide}>📭 Aucun établissement.</p>
                                ) : (
                                    <div style={styles.grid}>
                                        {etablissements.map(e => (
                                            <div key={e.id_etablissement} style={styles.card}>
                                                <div style={styles.cardIconeZone}>
                                                    <div style={styles.cardIcone}>🏫</div>
                                                    <div style={styles.cardTitre}>{e.nom_etablissement}</div>
                                                </div>
                                                <div style={styles.cardInfos}>
                                                    {e.ville && <div style={styles.cardInfo}>🏙 {e.ville}</div>}
                                                    {e.adresse && <div style={styles.cardInfo}>📍 {e.adresse}</div>}
                                                    {e.telephone && <div style={styles.cardInfo}>📞 {e.telephone}</div>}
                                                    <div style={styles.cardInfo}>
                                                        👤 {admins.filter(a => a.id_etablissement === e.id_etablissement).length} admin(s)
                                                    </div>
                                                </div>
                                                <div style={styles.cardActions}>
                                                    <button style={styles.btnModifier} onClick={() => ouvrirModalEtab(e)}>
                                                        ✏️ Modifier
                                                    </button>
                                                    <button style={styles.btnSupprimer} onClick={() => supprimerEtab(e.id_etablissement)}>
                                                        🗑 Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={styles.toolbar}>
                                    <h2 style={styles.sectionTitre}>Admins École</h2>
                                    <button style={styles.btnNouveau} onClick={() => ouvrirModalAdmin()}>
                                        + Nouvel admin école
                                    </button>
                                </div>
                                {admins.length === 0 ? (
                                    <p style={styles.vide}>📭 Aucun admin école.</p>
                                ) : (
                                    <div style={styles.grid}>
                                        {admins.map(a => {
                                            const actif = a.utilisateur?.est_actif;
                                            return (
                                                <div key={a.id_user} style={{ ...styles.card, opacity: actif ? 1 : 0.7 }}>
                                                    <div style={styles.cardIconeZone}>
                                                        <div style={styles.adminAvatar}>
                                                            {a.utilisateur?.prenom?.charAt(0)}{a.utilisateur?.nom?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={styles.cardTitre}>
                                                                {a.utilisateur?.prenom} {a.utilisateur?.nom}
                                                            </div>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700',
                                                                backgroundColor: actif ? '#e8f5e9' : '#fdecea',
                                                                color: actif ? '#2e7d32' : '#c62828',
                                                            }}>
                                                                {actif ? 'Actif' : 'Désactivé'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={styles.cardInfos}>
                                                        <div style={styles.cardInfo}>📧 {a.utilisateur?.email}</div>
                                                        {a.utilisateur?.telephone && <div style={styles.cardInfo}>📞 {a.utilisateur.telephone}</div>}
                                                        <div style={styles.cardInfo}>🏫 {a.etablissement?.nom_etablissement || '-'}</div>
                                                    </div>
                                                    <div style={styles.cardActions}>
                                                        <button style={styles.btnModifier} onClick={() => ouvrirModalAdmin(a)}>
                                                            ✏️ Modifier
                                                        </button>
                                                        <button
                                                            style={actif ? styles.btnDesactiver : styles.btnActiver}
                                                            onClick={() => toggleActif(a)}
                                                        >
                                                            {actif ? '🔒 Désactiver' : '🔓 Activer'}
                                                        </button>
                                                        <button style={styles.btnSupprimer} onClick={() => supprimerAdmin(a.id_user)}>
                                                            🗑
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>
            </div>

            {/* MODALE ÉTABLISSEMENT */}
            {modalEtab && (
                <div style={styles.overlay} onClick={() => setModalEtab(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalTitre}>{editEtab ? '✏️ Modifier établissement' : '🏫 Nouvel établissement'}</div>
                            <button style={styles.modalClose} onClick={() => setModalEtab(false)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.field}>
                                <label style={styles.label}>NOM DE L'ÉTABLISSEMENT *</label>
                                <input style={styles.input} value={formEtab.nom_etablissement}
                                    onChange={e => setFormEtab({ ...formEtab, nom_etablissement: e.target.value })}
                                    placeholder="Ex: Université de Cotonou" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>VILLE</label>
                                <input style={styles.input} value={formEtab.ville}
                                    onChange={e => setFormEtab({ ...formEtab, ville: e.target.value })}
                                    placeholder="Ex: Cotonou" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>ADRESSE</label>
                                <input style={styles.input} value={formEtab.adresse}
                                    onChange={e => setFormEtab({ ...formEtab, adresse: e.target.value })}
                                    placeholder="Adresse de l'établissement" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>TÉLÉPHONE</label>
                                <input style={styles.input} value={formEtab.telephone}
                                    onChange={e => setFormEtab({ ...formEtab, telephone: e.target.value })}
                                    placeholder="+229 XX XX XX XX" />
                            </div>
                        </div>
                        <div style={styles.modalFooter}>
                            <button style={styles.btnAnnuler} onClick={() => setModalEtab(false)}>Annuler</button>
                            <button style={styles.btnSauvegarder} onClick={sauvegarderEtab}>
                                {editEtab ? '💾 Modifier' : '✅ Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE ADMIN ÉCOLE */}
            {modalAdmin && (
                <div style={styles.overlay} onClick={() => setModalAdmin(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalTitre}>{editAdmin ? '✏️ Modifier admin école' : '👤 Nouvel admin école'}</div>
                            <button style={styles.modalClose} onClick={() => setModalAdmin(false)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.formGrid}>
                                <div style={styles.field}>
                                    <label style={styles.label}>NOM *</label>
                                    <input style={styles.input} value={formAdmin.nom}
                                        onChange={e => setFormAdmin({ ...formAdmin, nom: e.target.value })}
                                        placeholder="Nom" />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>PRÉNOM *</label>
                                    <input style={styles.input} value={formAdmin.prenom}
                                        onChange={e => setFormAdmin({ ...formAdmin, prenom: e.target.value })}
                                        placeholder="Prénom" />
                                </div>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>EMAIL *</label>
                                <input style={styles.input} type="email" value={formAdmin.email}
                                    onChange={e => setFormAdmin({ ...formAdmin, email: e.target.value })}
                                    placeholder="email@exemple.com" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>TÉLÉPHONE</label>
                                <input style={styles.input} value={formAdmin.telephone}
                                    onChange={e => setFormAdmin({ ...formAdmin, telephone: e.target.value })}
                                    placeholder="+229 XX XX XX XX" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>{editAdmin ? 'NOUVEAU MOT DE PASSE (optionnel)' : 'MOT DE PASSE *'}</label>
                                <input style={styles.input} type="password" value={formAdmin.mot_de_passe}
                                    onChange={e => setFormAdmin({ ...formAdmin, mot_de_passe: e.target.value })}
                                    placeholder="••••••••" />
                            </div>
                            {!editAdmin && (
                                <div style={styles.field}>
                                    <label style={styles.label}>ÉTABLISSEMENT *</label>
                                    <select style={styles.input} value={formAdmin.id_etablissement}
                                        onChange={e => setFormAdmin({ ...formAdmin, id_etablissement: e.target.value })}>
                                        <option value="">Sélectionner un établissement</option>
                                        {etablissements.map(etab => (
                                            <option key={etab.id_etablissement} value={etab.id_etablissement}>
                                                {etab.nom_etablissement}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div style={styles.modalFooter}>
                            <button style={styles.btnAnnuler} onClick={() => setModalAdmin(false)}>Annuler</button>
                            <button style={styles.btnSauvegarder} onClick={sauvegarderAdmin}>
                                {editAdmin ? '💾 Modifier' : '✅ Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Sidebar() {
    return (
        <div style={styles.sidebar}>
            <div style={styles.logoZone}><Logo size={80} showText={false} /></div>
            <nav style={styles.nav}>
                <div style={styles.menuActif}><span style={styles.icon}>🌐</span>Tableau de bord</div>
                <button style={styles.menuItem} onClick={() => window.location.href = '/dashboard/admin/profil'}>
                    <span style={styles.icon}>👤</span>Profil
                </button>
                <button style={styles.menuItemDanger} onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                }}>
                    <span style={styles.icon}></span>
                </button>
            </nav>
        </div>
    );
}

const styles = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    sidebar: { width: '240px', minHeight: '100vh', backgroundColor: '#1a6b3c', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0 },
    logoZone: { display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.15)' },
    nav: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '1rem 0.75rem', flex: 1 },
    menuActif: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.9rem', fontWeight: '700' },
    menuItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', width: '100%', textAlign: 'left' },
    menuItemDanger: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', color: '#ffaaaa', background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', width: '100%', textAlign: 'left', marginTop: 'auto' },
    icon: { fontSize: '1.1rem' },
    main: { marginLeft: '240px', flex: 1 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem', backgroundColor: '#fff', borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
    headerTitre: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
    profilZone: { display: 'flex', alignItems: 'center', gap: '12px' },
    profilInfo: { textAlign: 'right' },
    profilNom: { fontSize: '0.9rem', fontWeight: '600', color: '#1a1a2e' },
    profilRole: { fontSize: '0.75rem', color: '#888' },
    profilAvatar: { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700' },
    succes: { backgroundColor: '#e8f5ee', color: '#1a6b3c', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #c3e6cb' },
    erreurBanner: { backgroundColor: '#fdecea', color: '#c62828', padding: '0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid #f5c6cb' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', padding: '2rem 2.5rem 1rem' },
    statCard: { borderRadius: '14px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    statIcone: { fontSize: '1.5rem', marginBottom: '0.5rem' },
    statValeur: { fontSize: '2rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.8rem', color: '#666', marginTop: '6px', fontWeight: '500' },
    onglets: { display: 'flex', padding: '0 2.5rem', backgroundColor: '#fff', borderBottom: '1px solid #eee' },
    onglet: { padding: '0.85rem 1.25rem', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' },
    content: { padding: '2rem 2.5rem' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
    sectionTitre: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
    btnNouveau: { padding: '0.7rem 1.5rem', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    loading: { textAlign: 'center', color: '#999', padding: '3rem' },
    vide: { textAlign: 'center', color: '#999', padding: '3rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' },
    card: { backgroundColor: '#fff', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    cardIconeZone: { display: 'flex', alignItems: 'center', gap: '12px' },
    cardIcone: { fontSize: '2rem' },
    adminAvatar: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700', flexShrink: 0 },
    cardTitre: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' },
    cardInfos: { display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
    cardInfo: { fontSize: '0.82rem', color: '#666' },
    cardActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    btnModifier: { flex: 1, padding: '6px 0', backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '8px', border: '1px solid #bbdefb', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
    btnSupprimer: { padding: '6px 12px', backgroundColor: '#fdecea', color: '#c62828', borderRadius: '8px', border: '1px solid #f5c6cb', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
    btnDesactiver: { flex: 1, padding: '6px 0', backgroundColor: '#fff8e1', color: '#f57f17', borderRadius: '8px', border: '1px solid #ffe082', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
    btnActiver: { flex: 1, padding: '6px 0', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', width: '90%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0' },
    modalTitre: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e' },
    modalClose: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888', padding: 0 },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    modalFooter: { display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    field: {},
    label: { fontSize: '0.72rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' },
    input: { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' },
    btnAnnuler: { flex: 1, padding: '0.75rem', backgroundColor: '#f0f2f5', color: '#555', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    btnSauvegarder: { flex: 1, padding: '0.75rem', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
};