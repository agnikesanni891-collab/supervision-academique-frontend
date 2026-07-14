import Logo from './Logo';

const icons = {
    'Tableau de bord': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
    ),
    'Mémoires': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
    ),
    'Avancement': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
    ),
    'Utilisateurs': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    'Filières': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
        </svg>
    ),
    'Cycles': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.86-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
    ),
    'Profil': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    ),
};

export default function Sidebar({ active }) {
    const menus = [
        { label: 'Tableau de bord', path: '/dashboard/admin-ecole' },
        { label: 'Mémoires',        path: '/dashboard/admin-ecole/memoires' },
        { label: 'Avancement',      path: '/dashboard/admin-ecole/avancement' },
        { label: 'Utilisateurs',    path: '/dashboard/admin-ecole/utilisateurs' },
        { label: 'Filières',        path: '/dashboard/admin-ecole/filieres' },
        { label: 'Cycles',          path: '/dashboard/admin-ecole/cycles' },
        { label: 'Profil',          path: '/dashboard/admin-ecole/profil' },
    ];

    return (
        <div style={styles.sidebar}>
            <div style={styles.logoZone}>
                <Logo size={80} showText={false} />
            </div>

            <nav style={styles.nav}>
                {menus.map((item) => {
                    const isActif = active === item.label;
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
                                {icons[item.label]}
                            </span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

const styles = {
    sidebar: {
        width: '240px',
        minHeight: '100vh',
        backgroundColor: '#1a6b3c',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
    },
    logoZone: {
        display: 'flex',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '1rem 0.75rem',
        flex: 1,
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0.7rem 0.85rem',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.75)',
        background: 'none',
        border: 'none',
        fontSize: '0.88rem',
        fontWeight: '500',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s ease',
    },
    menuActif: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        color: '#ffffff',
        fontWeight: '700',
    },
    iconWrap: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'rgba(255,255,255,0.75)',
    },
    iconWrapActif: {
        backgroundColor: '#fff',
        color: '#1a6b3c',
    },
};