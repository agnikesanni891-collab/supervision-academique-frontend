import { useState, useEffect, useRef, useCallback } from 'react';

const injectCSS = () => {
    if (document.getElementById('pdfjs-css')) return;
    const s = document.createElement('style');
    s.id = 'pdfjs-css';
    s.textContent = `
        .pdfTextLayer { position:absolute; top:0; left:0; overflow:hidden; opacity:0.25; line-height:1; user-select:text; -webkit-user-select:text; }
        .pdfTextLayer > span { color:transparent; position:absolute; white-space:pre; cursor:text; transform-origin:0% 0%; }
        .pdfTextLayer ::selection { background: rgba(255,213,0,0.5); }
    `;
    document.head.appendChild(s);
};

let _pdfjs = null;
async function getPdfJs() {
    if (_pdfjs) return _pdfjs;
    return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            _pdfjs = window.pdfjsLib;
            return resolve(_pdfjs);
        }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            _pdfjs = window.pdfjsLib;
            resolve(_pdfjs);
        };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

export default function VisualiseurPDF({ version, memoire, onRetour, statut, onAccepter, onRejeter, onAnnoter }) {
    const storageKey = `pdf_rotation_v${version.id_version}`;

    const [pdfDoc, setPdfDoc]               = useState(null);
    const [numPages, setNumPages]           = useState(0);
    const [loadingPdf, setLoadingPdf]       = useState(true);
    const [pdfError, setPdfError]           = useState(false);
    const [scale]                           = useState(1.4);
    const [manualRotation, setManualRotation] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved !== null ? parseInt(saved) : 0;
    });
    const [activeAnnotId, setActiveAnnotId] = useState(null);
    const [statutLocal, setStatutLocal] = useState(statut);

    const pageRefs       = useRef({});
    const renderTasksRef = useRef({});

    const annotations = (version.annotations || []).map(a => ({
        ...a,
        rects: a.rects && a.rects !== 'null' && a.rects !== '' ? a.rects : null,
    }));

    const lienPDF = version.url_fichier || version.chemin_fichier;

    useEffect(() => {
        localStorage.setItem(storageKey, manualRotation);
    }, [manualRotation, storageKey]);

    useEffect(() => {
        if (!lienPDF) { setLoadingPdf(false); return; }
        injectCSS();
        let cancelled = false;
        (async () => {
            try {
                const pdfjs = await getPdfJs();
                // FIX PERF — on retire disableAutoFetch/disableStream pour activer
                // les requêtes HTTP par plages (range requests) et afficher la
                // page 1 dès les premiers octets reçus, au lieu d'attendre tout
                // le fichier (ce qui était la cause principale de la lenteur,
                // surtout pour les PDF hébergés sur Cloudinary).
                const doc = await pdfjs.getDocument({
                    url: lienPDF,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                }).promise;
                if (!cancelled) { setPdfDoc(doc); setNumPages(doc.numPages); setLoadingPdf(false); }
            } catch {
                if (!cancelled) { setLoadingPdf(false); setPdfError(true); }
            }
        })();
        return () => { cancelled = true; };
    }, [lienPDF]);

    const getTotalRotation = useCallback((pageRotate) => {
        return (360 - pageRotate + manualRotation) % 360;
    }, [manualRotation]);

    const renderHighlights = useCallback((pageNum, width, height) => {
        const refs = pageRefs.current[pageNum];
        if (!refs?.annotLayer) return;
        refs.annotLayer.style.width  = width + 'px';
        refs.annotLayer.style.height = height + 'px';
        refs.annotLayer.innerHTML = '';

        annotations
            .filter(a => parseInt(a.page) === pageNum)
            .forEach(a => {
                const globalIdx = annotations.indexOf(a) + 1;
                const isActive  = a.id_annotation === activeAnnotId;

                let rects = [];
                try {
                    if (a.rects && a.rects !== 'null' && a.rects !== '') {
                        const parsed = typeof a.rects === 'string' ? JSON.parse(a.rects) : a.rects;
                        if (Array.isArray(parsed) && parsed.length > 0) rects = parsed;
                    }
                } catch {}
                if (!rects.length && a.position_x !== null && a.position_y !== null) {
                    const w = parseFloat(a.largeur) || 0;
                    const h = parseFloat(a.hauteur) || 0;
                    if (w > 0 && h > 0) rects = [{ x: a.position_x, y: a.position_y, w, h }];
                }
                if (!rects.length) return;

                rects.forEach((r, ri) => {
                    const highlight = document.createElement('div');
                    highlight.style.cssText = `
                        position:absolute;
                        left:${r.x}%; top:${r.y}%;
                        width:${r.w}%; height:${Math.max(r.h, 1.2)}%;
                        background:${isActive ? 'rgba(255,150,0,0.55)' : 'rgba(255,235,59,0.45)'};
                        border-bottom:2px solid ${isActive ? '#f97316' : '#f59e0b'};
                        pointer-events:none; border-radius:2px;
                        transition: background 0.2s;
                        ${isActive ? 'box-shadow:0 0 0 2px #f97316;' : ''}
                    `;
                    if (ri === 0) {
                        const badge = document.createElement('div');
                        badge.textContent = globalIdx;
                        badge.style.cssText = `
                            position:absolute; top:-12px; left:-4px;
                            background:${isActive ? '#f97316' : '#f59e0b'};
                            color:#fff; border-radius:50%;
                            width:20px; height:20px; font-size:10px; font-weight:800;
                            display:flex; align-items:center; justify-content:center;
                            font-family:sans-serif; box-shadow:0 1px 4px rgba(0,0,0,.2);
                            pointer-events:none;
                        `;
                        highlight.appendChild(badge);
                    }
                    refs.annotLayer.appendChild(highlight);
                });
            });
    }, [annotations, activeAnnotId]);

    const renderPage = useCallback(async (pageNum) => {
        if (!pdfDoc) return;
        const refs = pageRefs.current[pageNum];
        if (!refs?.canvas) return;
        if (renderTasksRef.current[pageNum]) {
            try { renderTasksRef.current[pageNum].cancel(); } catch {}
            renderTasksRef.current[pageNum] = null;
        }
        const page          = await pdfDoc.getPage(pageNum);
        const totalRotation = getTotalRotation(page.rotate);
        const viewport      = page.getViewport({ scale, rotation: totalRotation });
        refs.canvas.width  = viewport.width;
        refs.canvas.height = viewport.height;
        const ctx = refs.canvas.getContext('2d');
        ctx.clearRect(0, 0, viewport.width, viewport.height);
        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTasksRef.current[pageNum] = renderTask;
        try { await renderTask.promise; }
        catch (e) { if (e?.name === 'RenderingCancelledException') return; }
        if (refs.textLayer) {
            refs.textLayer.style.width  = viewport.width + 'px';
            refs.textLayer.style.height = viewport.height + 'px';
            // FIX WARNING — la variable CSS --scale-factor doit être définie
            // sur le conteneur du text layer, avec la même valeur que viewport.scale.
            refs.textLayer.style.setProperty('--scale-factor', viewport.scale);
            refs.textLayer.innerHTML = '';
            const tc = await page.getTextContent();
            window.pdfjsLib.renderTextLayer({
                textContentSource: tc,
                container: refs.textLayer,
                viewport,
                textDivs: [],
            });
        }
        renderHighlights(pageNum, viewport.width, viewport.height);
    }, [pdfDoc, scale, getTotalRotation, renderHighlights]);

    // FIX 3 — Lazy render : on ne rend que les pages visibles (Intersection Observer)
    useEffect(() => {
        if (!pdfDoc || numPages === 0) return;

        let observer;
        const timer = setTimeout(() => {
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pn = parseInt(entry.target.dataset.page);
                        renderPage(pn);
                    }
                });
            }, { rootMargin: '200px' });

            Object.keys(pageRefs.current).forEach(pn => {
                const wrapper = pageRefs.current[pn]?.wrapper;
                if (wrapper) {
                    wrapper.dataset.page = pn;
                    observer.observe(wrapper);
                }
            });
        }, 50); // laisse le temps au layout de la modale de se stabiliser

        return () => { clearTimeout(timer); observer?.disconnect(); };
    }, [pdfDoc, numPages, renderPage, manualRotation]);

    // FIX 1 — Redraw highlights uniquement (sans re-render canvas) quand l'annotation active change
    useEffect(() => {
        if (!pdfDoc) return;
        Object.keys(pageRefs.current).forEach(pn => {
            const pageNum = parseInt(pn);
            const refs = pageRefs.current[pageNum];
            if (!refs?.canvas) return;
            renderHighlights(pageNum, refs.canvas.width, refs.canvas.height);
        });
    }, [activeAnnotId, renderHighlights]);

    // FIX — Forcer le rendu de la page cible avant de scroller (lazy loading)
    const scrollToAnnotation = async (annot) => {
        setActiveAnnotId(annot.id_annotation);
        const pageNum = parseInt(annot.page);
        if (!pageNum || isNaN(pageNum)) return;

        // Rendre TOUTES les pages jusqu'à pageNum
        for (let p = 1; p <= pageNum; p++) {
            await renderPage(p);
            await new Promise(r => setTimeout(r, 0));
        }

        await new Promise(r => setTimeout(r, 100));

        const refs = pageRefs.current[pageNum];

        if (refs?.wrapper) {
            refs.wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const telecharger = async () => {
        if (!lienPDF) return;
        try {
            const r = await fetch(lienPDF);
            const blob = await r.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `memoire_v${version.numero_version}.pdf`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch { window.open(lienPDF, '_blank'); }
    };

    const tournerGauche  = () => setManualRotation(r => (r - 90 + 360) % 360);
    const tournerDroite  = () => setManualRotation(r => (r + 90) % 360);
    const reinitRotation = () => setManualRotation(0);

    return (
        <div style={V.root}>
            {/* ── BARRE SUPÉRIEURE ── */}
            <div style={V.bar}>
                <button style={V.btnBack} onClick={onRetour}>← Retour</button>
                <span style={V.barTitle}>
                    📄 Version {version.numero_version}
                </span>
                <button style={V.btnRot} onClick={tournerGauche} title="Rotation gauche">↺</button>
                <button style={V.btnRot} onClick={tournerDroite} title="Rotation droite">↻</button>
                {manualRotation !== 0 && (
                    <button style={V.btnReset} onClick={reinitRotation}>⟳ Auto</button>
                )}
                {statutLocal === 'soumis' && onAccepter && (
                    <button style={V.btnOk} onClick={onAccepter}>✅ Accepter</button>
                )}
               {statutLocal === 'soumis' && onRejeter && (
    <button style={V.btnKo} onClick={() => {
        setStatutLocal('rejete'); // immédiat, sans attendre l'API
        onRejeter();              // appel API en arrière-plan
    }}>❌ Rejeter</button>
)}
                {statutLocal === 'rejete' && onAnnoter && (
                    <button style={V.btnAnnot} onClick={onAnnoter}>✏️ Annoter</button>
                )}
                {lienPDF && <button style={V.btnDl} onClick={telecharger}>📥 Télécharger</button>}
            </div>

            {/* ── CORPS : PDF + SIDEBAR ── */}
            <div style={V.body}>

                {/* ── ZONE PDF ── */}
                <div style={V.pdfSide}>
                    {loadingPdf && (
                        <div style={V.pdfStatus}>
                            <div style={V.spinner} />
                            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Chargement du document...</div>
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </div>
                    )}
                    {!loadingPdf && pdfError && (
                        <div style={V.pdfStatus}>
                            <div style={{ fontSize: '2.5rem' }}>❌</div>
                            <div style={{ color: '#ccc' }}>Impossible de charger le PDF</div>
                        </div>
                    )}
                    {!loadingPdf && !pdfError && pdfDoc && (
                        <div style={V.pdfScroll} data-pdfscroll="true">
                            {Array.from({ length: numPages }, (_, i) => i + 1).map(pn => (
                                <div
                                    key={pn}
                                    ref={el => {
                                        if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                        pageRefs.current[pn].wrapper = el;
                                    }}
                                    style={V.pageWrapper}
                                >
                                    <div style={V.pageLabel}>— Page {pn} —</div>
                                    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}
                                         ref={el => {
                                             if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                             pageRefs.current[pn].canvasContainer = el;
                                         }}
                                    >
                                        <canvas
                                            ref={el => {
                                                if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                                pageRefs.current[pn].canvas = el;
                                            }}
                                            style={{ display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                                        />
                                        <div
                                            className="pdfTextLayer"
                                            ref={el => {
                                                if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                                pageRefs.current[pn].textLayer = el;
                                            }}
                                        />
                                        <div
                                            ref={el => {
                                                if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                                pageRefs.current[pn].annotLayer = el;
                                            }}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── SIDEBAR ANNOTATIONS (lecture seule) ── */}
                <div style={V.side}>
                    <div style={V.sideTop}>
                        <span style={V.sideTitle}>💬 Annotations de l'encadrant</span>
                        <span style={V.sideBadge}>{annotations.length}</span>
                    </div>

                    <div style={V.hint}>
                        👆 Cliquez sur une annotation pour localiser le passage dans le PDF
                    </div>

                    <div style={V.list}>
                        {annotations.length === 0 ? (
                            <div style={V.empty}>
                                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                                Aucune annotation pour cette version.
                            </div>
                        ) : (
                            annotations.map((a, i) => {
                                const isActive = a.id_annotation === activeAnnotId;
                                return (
                                    <div
                                        key={a.id_annotation}
                                        style={{
                                            ...V.card,
                                            borderColor: isActive ? '#f97316' : '#fde68a',
                                            background:  isActive ? '#fff7ed' : '#fffef7',
                                            boxShadow:   isActive ? '0 0 0 2px #fed7aa' : 'none',
                                        }}
                                        onClick={() => scrollToAnnotation(a)}
                                    >
                                        <div style={V.cardRow}>
                                            <span style={{
                                                ...V.num,
                                                background: isActive ? '#f97316' : '#f59e0b',
                                            }}>{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={V.cardPage}>📄 Page {a.page}</div>
                                                {a.texte_surligne && (
                                                    <div style={V.cardHighlight}>
                                                        « {a.texte_surligne.slice(0, 80)}{a.texte_surligne.length > 80 ? '…' : ''} »
                                                    </div>
                                                )}
                                                <div style={V.cardTxt}>{a.texte_commentaire || a.contenu}</div>
                                            </div>
                                        </div>
                                        <div style={V.cardFooter}>
                                            <span style={V.cardCta}>
                                                {isActive ? '📍 Page localisée' : '→ Aller à la page'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const V = {
    root:        { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif" },
    bar:         { display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1.4rem', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    btnBack:     { background: 'none', border: 'none', color: '#1a6b3c', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: 0 },
    barTitle:    { flex: 1, fontSize: '0.88rem', fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 10 },
    barBadgeRejet: { fontSize: '0.72rem', fontWeight: 700, background: '#fdecea', color: '#c62828', padding: '2px 10px', borderRadius: 20 },
    btnDl:       { padding: '5px 12px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
    btnRot:      { padding: '5px 10px', background: '#f0f2f5', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    btnReset:    { padding: '5px 10px', background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
    body:        { display: 'flex', flex: 1, overflow: 'hidden' },
    pdfSide:     { flex: 1, overflow: 'hidden', background: '#525659', display: 'flex', flexDirection: 'column' },
    pdfStatus:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
    spinner:     { width: 44, height: 44, border: '5px solid #666', borderTop: '5px solid #1a6b3c', borderRadius: '50%', animation: 'spin 0.9s linear infinite' },
    pdfScroll:   { flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' },
    pageWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
    pageLabel:   { fontSize: '0.75rem', color: '#ccc', fontWeight: 600, letterSpacing: '0.5px' },
    side:        { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #e5e7eb', overflow: 'hidden' },
    sideTop:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
    sideTitle:   { fontSize: '0.88rem', fontWeight: 700, color: '#111' },
    sideBadge:   { background: '#f59e0b', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 },
    hint:        { padding: '0.55rem 1rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '0.74rem', color: '#92400e', flexShrink: 0 },
    list:        { flex: 1, overflowY: 'auto', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: 8 },
    empty:       { color: '#bbb', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.82rem' },
    card:        { border: '1.5px solid #fde68a', borderRadius: 10, padding: '0.65rem 0.7rem', cursor: 'pointer', transition: 'all 0.15s', background: '#fffef7' },
    cardRow:     { display: 'flex', gap: 8, marginBottom: 4 },
    num:         { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0, marginTop: 1 },
    cardPage:    { fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 },
    cardHighlight: { fontSize: '0.72rem', color: '#78350f', background: '#fef9c3', padding: '2px 6px', borderRadius: 4, marginBottom: 4, fontStyle: 'italic', lineHeight: 1.4 },
    cardTxt:     { fontSize: '0.82rem', color: '#374151', lineHeight: 1.45 },
    cardFooter:  { marginTop: 6, paddingTop: 5, borderTop: '1px solid #fde68a' },
    cardCta:     { fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b' },
    rejetBanner: { margin: '0.75rem', padding: '0.75rem', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start', flexShrink: 0 },
    btnOk:    { padding: '5px 12px', background: '#e8f5e9', color: '#2e7d32', border: '1.5px solid #c8e6c9', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
    btnKo:    { padding: '5px 12px', background: '#fdecea', color: '#c62828', border: '1.5px solid #ffcdd2', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
    btnAnnot: { padding: '5px 12px', background: '#fff8e1', color: '#e65100', border: '1.5px solid #ffe082', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
};