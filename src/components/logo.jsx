export default function Logo({ size = 120, showText = true }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 120 120"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="120" height="120" rx="16" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" />
                <text x="5" y="88" fontSize="92" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="#1a6b3c">S</text>
                <text x="57" y="88" fontSize="92" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="#f0a500">A</text>
                <polygon points="63,10 54,52 63,47 54,95 72,42 63,47 72,10" fill="#f0a500" opacity="0.85" />
            </svg>

            {showText && (
                <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1a6b3c', letterSpacing: '1px' }}>
                        Supervision
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#f0a500', letterSpacing: '1px' }}>
                        académique
                    </div>
                </div>
            )}
        </div>
    );
}