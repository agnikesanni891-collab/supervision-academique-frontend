import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const injectCSS = () => {
    if (document.getElementById('pdfjs-css')) return;
    const s = document.createElement('style');
    s.id = 'pdfjs-css';
    s.textContent = `
        .pdfTextLayer { position:absolute; top:0; left:0; overflow:hidden; opacity:0.25; line-height:1; user-select:text; -webkit-user-select:text; }
        .pdfTextLayer > span { color:transparent; position:absolute; white-space:pre; cursor:text; transform-origin:0% 0%; }
        .pdfTextLayer ::selection { background: rgba(255,213,0,0.5); }
        @keyframes pulse-mic { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
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

// ─── Hook Web Speech API ───────────────────────────────────────────────────
function useSpeechRecognition({ onResult, onEnd }) {
    const recRef = useRef(null);
    const [listening, setListening] = useState(false);
    const supported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const start = useCallback(() => {
        if (!supported || listening) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = 'fr-FR';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.continuous = false;
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (onResult) onResult(transcript);
        };
        rec.onerror = () => { setListening(false); if (onEnd) onEnd(); };
        rec.onend = () => { setListening(false); if (onEnd) onEnd(); };
        recRef.current = rec;
        rec.start();
        setListening(true);
    }, [supported, listening, onResult, onEnd]);

    const stop = useCallback(() => {
        recRef.current?.stop();
        setListening(false);
    }, []);

    return { listening, supported, start, stop };
}

// ─── Bouton micro réutilisable ─────────────────────────────────────────────
function BoutonMic({ value, onChange, placeholder = 'Votre commentaire…', style = {} }) {
    const [mode, setMode] = useState('text'); // 'text' | 'voice'
    const textareaRef = useRef(null);

    const { listening, supported, start, stop } = useSpeechRecognition({
        onResult: (transcript) => {
            onChange(value ? value + ' ' + transcript : transcript);
        },
        onEnd: () => {},
    });

    const toggleMic = () => {
        if (!supported) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale.\nUtilisez Chrome ou Edge.");
            return;
        }
        if (listening) { stop(); }
        else { start(); }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Onglets Écrire / Dicter */}
            <div style={B.tabs}>
                <button
                    type="button"
                    style={{ ...B.tab, ...(mode === 'text' ? B.tabActive : {}) }}
                    onClick={() => { setMode('text'); stop(); }}
                >
                    ✏️ Écrire
                </button>
                <button
                    type="button"
                    style={{ ...B.tab, ...(mode === 'voice' ? B.tabActive : {}) }}
                    onClick={() => setMode('voice')}
                >
                    🎙️ Dicter
                </button>
            </div>

            {mode === 'text' ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{ ...B.textarea, ...style }}
                />
            ) : (
                <div style={B.voicePanel}>
                    {/* Aperçu du texte dicté */}
                    {value ? (
                        <div style={B.transcriptBox}>{value}</div>
                    ) : (
                        <div style={B.transcriptPlaceholder}>
                            {listening ? 'Parlez maintenant…' : 'Appuyez sur le micro pour dicter'}
                        </div>
                    )}

                    {/* Bouton micro */}
                    <button
                        type="button"
                        onClick={toggleMic}
                        style={{
                            ...B.micBtn,
                            background: listening ? '#dc2626' : '#1a6b3c',
                            animation: listening ? 'pulse-mic 1.2s infinite' : 'none',
                        }}
                        title={listening ? 'Arrêter' : 'Démarrer la dictée'}
                    >
                        {listening ? '⏹' : '🎙️'}
                    </button>

                    <div style={B.micLabel}>
                        {listening
                            ? <span style={{ color: '#dc2626', fontWeight: 700 }}>● Enregistrement en cours…</span>
                            : <span style={{ color: '#888' }}>Microphone prêt — fr-FR</span>
                        }
                    </div>

                    {/* Bouton effacer si du texte existe */}
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            style={B.clearBtn}
                        >
                            🗑 Effacer le texte
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Styles du composant BoutonMic ────────────────────────────────────────
const B = {
    tabs:               { display: 'flex', gap: 4, marginBottom: 6 },
    tab:                { flex: 1, padding: '5px 0', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#555' },
    tabActive:          { background: '#1a6b3c', color: '#fff', border: '1.5px solid #1a6b3c' },
    textarea:           { width: '100%', padding: '0.5rem', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 70 },
    voicePanel:         { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0.75rem', background: '#f8f9fa', border: '1.5px solid #e5e7eb', borderRadius: 7 },
    transcriptBox:      { width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.5rem', fontSize: '0.82rem', color: '#1a1a2e', minHeight: 48, lineHeight: 1.5, boxSizing: 'border-box' },
    transcriptPlaceholder: { color: '#aaa', fontSize: '0.82rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' },
    micBtn:             { width: 52, height: 52, borderRadius: '50%', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
    micLabel:           { fontSize: '0.72rem', textAlign: 'center' },
    clearBtn:           { fontSize: '0.72rem', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' },
};

// ─── Composant principal ───────────────────────────────────────────────────
export default function AnnotateurPDF({
    version, memoire, onRetour, onAnnotationAjoutee, onAnnotationsEnvoyees
}) {
    const storageKey = `pdf_rotation_v${version.id_version}`;

    const [annotations, setAnnotations]       = useState([]);
    const [editingId, setEditingId]           = useState(null);
    const [editForm, setEditForm]             = useState({ texte_commentaire: '' });
    const [saving, setSaving]                 = useState(false);
    const [toast, setToast]                   = useState(null);
    const [pdfDoc, setPdfDoc]                 = useState(null);
    const [numPages, setNumPages]             = useState(0);
    const [loadingPdf, setLoadingPdf]         = useState(true);
    const [pdfError, setPdfError]             = useState(false);
    const [scale]                             = useState(1.4);
    const [manualRotation, setManualRotation] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved !== null ? parseInt(saved) : 0;
    });
    const [popup, setPopup]                   = useState(null);
    const [popupComment, setPopupComment]     = useState('');
    const [tempHighlights, setTempHighlights] = useState(null);
    const [drawMode, setDrawMode]             = useState(false);
    const [drawing, setDrawing]               = useState(null);
    const [manuPage, setManuPage]             = useState('');
    const [manuComment, setManuComment]       = useState('');
    const [savingManu, setSavingManu]         = useState(false);

    const pageRefs       = useRef({});
    const containerRef   = useRef(null);
    const renderTasksRef = useRef({});
    const drawStartRef   = useRef(null);
    const lienPDF        = version.url_fichier || version.chemin_fichier;

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
                const doc = await pdfjs.getDocument({
                    url: lienPDF,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                }).promise;
                if (!cancelled) { setPdfDoc(doc); setNumPages(doc.numPages); setLoadingPdf(false); }
            } catch (e) {
                if (!cancelled) { setLoadingPdf(false); setPdfError(true); }
            }
        })();
        return () => { cancelled = true; };
    }, [lienPDF]);

    useEffect(() => { load(); }, []);

    const load = () => {
        api.get('/versions/' + version.id_version + '/annotations')
            .then(r => {
                const data = Array.isArray(r.data) ? r.data : [];
                const cleaned = data.map(a => ({
                    ...a,
                    rects: a.rects && a.rects !== 'null' && a.rects !== '' ? a.rects : null,
                }));
                setAnnotations(cleaned);
            })
            .catch(() => {});
    };

    const flash = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

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
                        background:rgba(255,235,59,0.45);
                        border-bottom:2px solid #f59e0b;
                        pointer-events:none; border-radius:2px;
                    `;
                    if (ri === 0) {
                        const badge = document.createElement('div');
                        badge.textContent = globalIdx;
                        badge.style.cssText = `
                            position:absolute; top:-12px; left:-4px;
                            background:#f59e0b; color:#fff; border-radius:50%;
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
    }, [annotations]);

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

    useEffect(() => {
        if (!pdfDoc || numPages === 0) return;
        for (let i = 1; i <= numPages; i++) renderPage(i);
    }, [pdfDoc, numPages, renderPage, manualRotation]);

    useEffect(() => {
        if (!pdfDoc) return;
        Object.keys(pageRefs.current).forEach(pn => {
            const pageNum = parseInt(pn);
            pdfDoc.getPage(pageNum).then(page => {
                const totalRot = getTotalRotation(page.rotate);
                const vp = page.getViewport({ scale, rotation: totalRot });
                renderHighlights(pageNum, vp.width, vp.height);
            });
        });
    }, [annotations, pdfDoc, scale, renderHighlights, getTotalRotation]);

    // ===== MODE TEXTE =====
    const handleMouseUp = useCallback((e, pageNum) => {
        if (drawMode) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
        const selectedText = sel.toString().trim();
        if (selectedText.length < 2) return;
        const range       = sel.getRangeAt(0);
        const selRect     = range.getBoundingClientRect();
        const clientRects = Array.from(range.getClientRects());
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const canvasContainer = pageRefs.current[pageNum]?.canvasContainer;
        if (!canvasContainer) return;
        const pageRect = canvasContainer.getBoundingClientRect();
        const rects = clientRects
            .filter(r => r.width > 2 && r.height > 2)
            .map(r => ({
                x: Math.max(0, ((r.left - pageRect.left) / pageRect.width) * 100),
                y: Math.max(0, ((r.top  - pageRect.top ) / pageRect.height) * 100),
                w: Math.min(100, (r.width  / pageRect.width ) * 100),
                h: Math.min(100, Math.max(1, (r.height / pageRect.height) * 100)),
            }));
        setTempHighlights({ pageNum, rects });
        setPopup({
            x: Math.min(selRect.left - containerRect.left + selRect.width / 2, containerRect.width - 320),
            y: selRect.bottom - containerRect.top + 10,
            page: pageNum,
            texte: selectedText,
            position_x: Math.max(0, ((selRect.left - pageRect.left) / pageRect.width) * 100),
            position_y: Math.max(0, ((selRect.top  - pageRect.top ) / pageRect.height) * 100),
            largeur:    Math.min(100, (selRect.width  / pageRect.width ) * 100),
            hauteur:    Math.min(100, Math.max(2, (selRect.height / pageRect.height) * 100)),
            rects,
        });
        setPopupComment('');
    }, [drawMode]);

    // ===== MODE DESSIN =====
    const handleDrawStart = useCallback((e, pageNum) => {
        if (!drawMode) return;
        e.preventDefault();
        const canvasContainer = pageRefs.current[pageNum]?.canvasContainer;
        if (!canvasContainer) return;
        const pageRect = canvasContainer.getBoundingClientRect();
        drawStartRef.current = {
            pageNum,
            x: ((e.clientX - pageRect.left) / pageRect.width) * 100,
            y: ((e.clientY - pageRect.top ) / pageRect.height) * 100,
            pageRect,
        };
        setDrawing({ pageNum, x: drawStartRef.current.x, y: drawStartRef.current.y, w: 0, h: 0 });
    }, [drawMode]);

    const handleDrawMove = useCallback((e, pageNum) => {
        if (!drawMode || !drawStartRef.current || drawStartRef.current.pageNum !== pageNum) return;
        const { x: sx, y: sy, pageRect } = drawStartRef.current;
        const cx = ((e.clientX - pageRect.left) / pageRect.width) * 100;
        const cy = ((e.clientY - pageRect.top ) / pageRect.height) * 100;
        setDrawing({ pageNum, x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) });
    }, [drawMode]);

    const handleDrawEnd = useCallback((e, pageNum) => {
        if (!drawMode || !drawStartRef.current || drawStartRef.current.pageNum !== pageNum) return;
        const d = drawing;
        drawStartRef.current = null;
        if (!d || d.w < 1 || d.h < 1) { setDrawing(null); return; }
        const containerRect   = containerRef.current?.getBoundingClientRect();
        const canvasContainer = pageRefs.current[pageNum]?.canvasContainer;
        if (!containerRect || !canvasContainer) return;
        const pageRect = canvasContainer.getBoundingClientRect();
        const rects = [{ x: d.x, y: d.y, w: d.w, h: d.h }];
        setTempHighlights({ pageNum, rects });
        setDrawing(null);
        const centerX = (d.x / 100) * pageRect.width + pageRect.left - containerRect.left + (d.w / 100) * pageRect.width / 2;
        const bottomY = (d.y / 100) * pageRect.height + pageRect.top - containerRect.top + (d.h / 100) * pageRect.height + 10;
        setPopup({
            x: Math.min(centerX, containerRect.width - 320),
            y: bottomY,
            page: pageNum,
            texte: '',
            position_x: parseFloat(d.x.toFixed(2)),
            position_y: parseFloat(d.y.toFixed(2)),
            largeur:    parseFloat(d.w.toFixed(2)),
            hauteur:    parseFloat(d.h.toFixed(2)),
            rects,
        });
        setPopupComment('');
    }, [drawMode, drawing]);

    const clearTemp = () => {
        setTempHighlights(null);
        setPopup(null);
        setDrawing(null);
        window.getSelection()?.removeAllRanges();
    };

    const handleContainerMouseDown = useCallback((e) => {
        if (popup && !e.target.closest('[data-popup]')) clearTemp();
    }, [popup]);

    const ajouterDepuisSelection = async () => {
        if (!popup || !popupComment.trim()) { flash('Le commentaire est obligatoire.', false); return; }
        setSaving(true);
        try {
            const rectsJson = popup.rects && popup.rects.length > 0 ? JSON.stringify(popup.rects) : null;
            const res = await api.post('/versions/' + version.id_version + '/annotations', {
                page:              popup.page,
                position_x:       parseFloat((popup.position_x || 0).toFixed(2)),
                position_y:       parseFloat((popup.position_y || 0).toFixed(2)),
                largeur:          parseFloat((popup.largeur || 0).toFixed(2)),
                hauteur:          parseFloat((popup.hauteur || 0).toFixed(2)),
                texte_surligne:   popup.texte || null,
                texte_commentaire: popupComment.trim(),
                rects:            rectsJson,
            });
            const newAnnot = { ...res.data, rects: rectsJson };
            setAnnotations(prev => [...prev, newAnnot]);
            clearTemp();
            flash('✅ Annotation ajoutée !');
            if (onAnnotationAjoutee) onAnnotationAjoutee();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur serveur.', false);
        } finally { setSaving(false); }
    };

    const ajouterManuellement = async () => {
        if (!manuPage || !manuComment.trim()) { flash('Page et commentaire obligatoires.', false); return; }
        setSavingManu(true);
        try {
            const res = await api.post('/versions/' + version.id_version + '/annotations', {
                page:              parseInt(manuPage),
                position_x:       0,
                position_y:       0,
                largeur:          0,
                hauteur:          0,
                texte_surligne:   null,
                texte_commentaire: manuComment.trim(),
                rects:            null,
            });
            setAnnotations(prev => [...prev, res.data]);
            setManuPage('');
            setManuComment('');
            flash('✅ Annotation ajoutée !');
            if (onAnnotationAjoutee) onAnnotationAjoutee();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur serveur.', false);
        } finally { setSavingManu(false); }
    };

    const scrollToPage = (pageNum) => {
        pageRefs.current[pageNum]?.wrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const modifier = async (id) => {
        if (!editForm.texte_commentaire.trim()) { flash('Commentaire obligatoire.', false); return; }
        setSaving(true);
        try {
            const annot = annotations.find(a => a.id_annotation === id);
            await api.put('/annotations/' + id, {
                page: annot?.page || 1,
                texte_commentaire: editForm.texte_commentaire.trim(),
            });
            setEditingId(null);
            flash('✅ Annotation modifiée !');
            load();
        } catch (e) {
            flash(e.response?.data?.message || 'Erreur.', false);
        } finally { setSaving(false); }
    };

    const supprimer = async (id) => {
        if (!window.confirm('Supprimer cette annotation ?')) return;
        try {
            await api.delete('/annotations/' + id);
            setAnnotations(prev => prev.filter(a => a.id_annotation !== id));
            flash('Annotation supprimée.');
        } catch { flash('Erreur suppression.', false); }
    };

    const envoyer = () => {
        if (annotations.length === 0) { flash("Ajoutez d'abord au moins une annotation.", false); return; }
        if (onAnnotationsEnvoyees) onAnnotationsEnvoyees();
    };

    const telecharger = async () => {
        if (!lienPDF) return;
        const nomFichier = `memoire_v${version.numero_version}.pdf`;
        try {
            const r = await fetch(lienPDF);
            const blob = await r.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = nomFichier;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch { window.open(lienPDF, '_blank'); }
    };

    const tournerGauche  = () => setManualRotation(r => (r - 90 + 360) % 360);
    const tournerDroite  = () => setManualRotation(r => (r + 90) % 360);
    const reinitRotation = () => setManualRotation(0);

    return (
        <div style={C.root}>
            <div style={C.bar}>
                <button style={C.btnBack} onClick={onRetour}>← Retour</button>
                <span style={C.barTitle}>✏️ Annoter — {memoire.titre}</span>
                <button style={C.btnRot} onClick={tournerGauche}>↺</button>
                <button style={C.btnRot} onClick={tournerDroite}>↻</button>
                {manualRotation !== 0 && (
                    <button style={C.btnReset} onClick={reinitRotation}>⟳ Auto</button>
                )}
                <button
                    style={{
                        ...C.btnRot,
                        background: drawMode ? '#1a6b3c' : '#f0f2f5',
                        color: drawMode ? '#fff' : '#555',
                        fontSize: '0.78rem', padding: '5px 10px',
                    }}
                    onClick={() => { setDrawMode(d => !d); setTempHighlights(null); setPopup(null); setDrawing(null); }}
                    title="Mode dessin — pour PDF image/scanné"
                >
                    {drawMode ? '✏️ Dessin ON' : '✏️ Dessin'}
                </button>
                {lienPDF && <button style={C.btnDl} onClick={telecharger}>📥 Télécharger</button>}
            </div>

            {toast && (
                <div style={{ ...C.toast, backgroundColor: toast.ok ? '#e8f5ee' : '#fdecea', color: toast.ok ? '#1a6b3c' : '#c62828' }}>
                    {toast.msg}
                </div>
            )}

            <div style={C.body}>
                <div style={C.pdfSide} ref={containerRef} onMouseDown={handleContainerMouseDown}>
                    {loadingPdf && (
                        <div style={C.pdfStatus}>
                            <div style={C.spinner} />
                            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Chargement du document...</div>
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </div>
                    )}
                    {!loadingPdf && pdfError && (
                        <div style={C.pdfStatus}>
                            <div style={{ fontSize: '2.5rem' }}>❌</div>
                            <div style={{ color: '#ccc' }}>Impossible de charger le PDF</div>
                        </div>
                    )}

                    {/* ─── POPUP ANNOTATION (avec BoutonMic) ─── */}
                    {popup && (
                        <div
                            data-popup="1"
                            style={C.popup}
                            onMouseDown={e => e.stopPropagation()}
                        >
                            <div style={C.popupTitre}>
                                💬 Annoter la sélection
                                <span style={C.popupBadge}>#{annotations.length + 1}</span>
                            </div>
                            {popup.texte ? (
                                <div style={C.popupTexte}>
                                    « {popup.texte.slice(0, 80)}{popup.texte.length > 80 ? '…' : ''} »
                                </div>
                            ) : (
                                <div style={{ ...C.popupTexte, color: '#888', fontStyle: 'normal' }}>
                                    📐 Zone dessinée — Page {popup.page}
                                </div>
                            )}
                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 6 }}>Page {popup.page}</div>

                            {/* ← BoutonMic remplace le textarea brut */}
                            <BoutonMic
                                value={popupComment}
                                onChange={setPopupComment}
                                placeholder="Votre commentaire… (Ctrl+Entrée pour valider)"
                                style={{ height: 70 }}
                            />

                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                <button style={C.popupBtnAdd} onClick={ajouterDepuisSelection} disabled={saving}>
                                    {saving ? '⏳' : '+ Ajouter'}
                                </button>
                                <button style={C.popupBtnCancel} onClick={clearTemp}>Annuler</button>
                            </div>
                        </div>
                    )}

                    <div style={C.pdfScroll}>
                        {pdfDoc && Array.from({ length: numPages }, (_, i) => i + 1).map(pn => (
                            <div
                                key={pn}
                                ref={el => {
                                    if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                    pageRefs.current[pn].wrapper = el;
                                }}
                                style={C.pageWrapper}
                            >
                                <div style={C.pageLabel}>— Page {pn} —</div>
                                <div
                                    ref={el => {
                                        if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                        pageRefs.current[pn].canvasContainer = el;
                                    }}
                                    style={{
                                        position: 'relative', display: 'inline-block', lineHeight: 0,
                                        cursor: drawMode ? 'crosshair' : 'text',
                                        userSelect: drawMode ? 'none' : 'text',
                                    }}
                                    onMouseUp={e => drawMode ? handleDrawEnd(e, pn) : handleMouseUp(e, pn)}
                                    onMouseDown={e => {
                                        handleDrawStart(e, pn);
                                        if (!drawMode && !e.target.closest('.pdfTextLayer')) e.preventDefault();
                                    }}
                                    onMouseMove={e => handleDrawMove(e, pn)}
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
                                        style={{ pointerEvents: drawMode ? 'none' : 'auto', userSelect: 'text', WebkitUserSelect: 'text' }}
                                    />
                                    <div
                                        ref={el => {
                                            if (!pageRefs.current[pn]) pageRefs.current[pn] = {};
                                            pageRefs.current[pn].annotLayer = el;
                                        }}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
                                    />
                                    {drawing?.pageNum === pn && (
                                        <div style={{
                                            position: 'absolute',
                                            left: `${drawing.x}%`, top: `${drawing.y}%`,
                                            width: `${drawing.w}%`, height: `${drawing.h}%`,
                                            background: 'rgba(255,235,59,0.35)',
                                            border: '2px dashed #f59e0b',
                                            pointerEvents: 'none', borderRadius: 2, zIndex: 20,
                                        }} />
                                    )}
                                    {tempHighlights?.pageNum === pn && tempHighlights.rects.map((r, i) => (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            left: `${r.x}%`, top: `${r.y}%`,
                                            width: `${r.w}%`, height: `${Math.max(r.h, 1)}%`,
                                            background: 'rgba(255,235,59,0.55)',
                                            borderBottom: '2px solid #f59e0b',
                                            pointerEvents: 'none', borderRadius: 2, zIndex: 10,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── PANNEAU LATÉRAL ─── */}
                <div style={C.side}>
                    <div style={C.sideTop}>
                        <span style={C.sideTitle}>💬 Annotations</span>
                        <span style={C.sideBadge}>{annotations.length}</span>
                    </div>
                    <div style={C.hint}>
                        {drawMode
                            ? '✏️ Mode dessin — cliquez-glissez pour annoter une zone'
                            : '📌 Sélectionnez du texte ou ajoutez une annotation manuelle ci-dessous'
                        }
                    </div>

                    {/* ─── FORMULAIRE MANUEL (avec BoutonMic) ─── */}
                    <div style={C.formManu}>
                        <div style={C.formManuTitre}>+ Nouvelle annotation manuelle</div>
                        <input
                            type="number"
                            min="1"
                            max={numPages || 999}
                            value={manuPage}
                            onChange={e => setManuPage(e.target.value)}
                            placeholder="Numéro de page"
                            style={C.inputSm}
                        />
                        <div style={{ marginTop: 6 }}>
                            {/* ← BoutonMic remplace le textarea brut */}
                            <BoutonMic
                                value={manuComment}
                                onChange={setManuComment}
                                placeholder="Votre commentaire…"
                            />
                        </div>
                        <button
                            style={savingManu ? C.btnAddDis : C.btnAdd}
                            onClick={ajouterManuellement}
                            disabled={savingManu}
                        >
                            {savingManu ? '⏳' : '+ Ajouter'}
                        </button>
                    </div>

                    {/* ─── LISTE DES ANNOTATIONS ─── */}
                    <div style={C.list}>
                        {annotations.length === 0
                            ? <p style={C.empty}>Aucune annotation pour l'instant.</p>
                            : annotations.map((a, i) => (
                                <div
                                    key={a.id_annotation}
                                    style={{ ...C.card, cursor: editingId === a.id_annotation ? 'default' : 'pointer' }}
                                    onClick={() => editingId !== a.id_annotation && scrollToPage(parseInt(a.page))}
                                >
                                    {editingId === a.id_annotation ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={C.num}>{i + 1}</span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1565c0' }}>Modifier</span>
                                            </div>
                                            {/* ← BoutonMic dans la modification aussi */}
                                            <BoutonMic
                                                value={editForm.texte_commentaire}
                                                onChange={v => setEditForm({ ...editForm, texte_commentaire: v })}
                                                placeholder="Modifier le commentaire…"
                                                style={{ height: 60 }}
                                            />
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button style={C.btnSave} onClick={() => modifier(a.id_annotation)} disabled={saving}>💾 Sauvegarder</button>
                                                <button style={C.btnCancel} onClick={() => setEditingId(null)}>Annuler</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={C.cardRow}>
                                                <span style={C.num}>{i + 1}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={C.cardPage}>📄 Page {a.page}</div>
                                                    {a.texte_surligne && (
                                                        <div style={C.cardHighlight}>
                                                            « {a.texte_surligne.slice(0, 60)}{a.texte_surligne.length > 60 ? '…' : ''} »
                                                        </div>
                                                    )}
                                                    <div style={C.cardTxt}>{a.texte_commentaire}</div>
                                                </div>
                                            </div>
                                            <div style={C.cardBtns}>
                                                <button style={C.btnEdit} onClick={e => { e.stopPropagation(); setEditingId(a.id_annotation); setEditForm({ texte_commentaire: a.texte_commentaire }); }}>✏️ Modifier</button>
                                                <button style={C.btnDel}  onClick={e => { e.stopPropagation(); supprimer(a.id_annotation); }}>🗑 Supprimer</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                    <button
                        style={annotations.length === 0 ? C.btnSendOff : C.btnSendOn}
                        onClick={envoyer}
                        disabled={annotations.length === 0}
                    >
                        📤 Envoyer les annotations
                    </button>
                </div>
            </div>
        </div>
    );
}

const C = {
    root:          { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif" },
    bar:           { display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1.4rem', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    btnBack:       { background: 'none', border: 'none', color: '#1a6b3c', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: 0 },
    barTitle:      { flex: 1, fontSize: '0.88rem', fontWeight: 700, color: '#111' },
    btnDl:         { padding: '5px 12px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
    btnRot:        { padding: '5px 10px', background: '#f0f2f5', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    btnReset:      { padding: '5px 10px', background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
    toast:         { padding: '0.4rem 1.4rem', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 },
    body:          { display: 'flex', flex: 1, overflow: 'hidden' },
    pdfSide:       { flex: 1, overflow: 'hidden', background: '#525659', position: 'relative', display: 'flex', flexDirection: 'column' },
    pdfStatus:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
    spinner:       { width: 44, height: 44, border: '5px solid #666', borderTop: '5px solid #1a6b3c', borderRadius: '50%', animation: 'spin 0.9s linear infinite' },
    pdfScroll:     { flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' },
    pageWrapper:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
    pageLabel:     { fontSize: '0.75rem', color: '#ccc', fontWeight: 600, letterSpacing: '0.5px' },
    popup: {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000, background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', width: 320,
    },
    popupTitre:    { fontSize: '0.82rem', fontWeight: 700, color: '#111', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    popupBadge:    { background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 },
    popupTexte:    { fontSize: '0.72rem', color: '#78350f', background: '#fef9c3', padding: '4px 8px', borderRadius: 6, marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 },
    popupBtnAdd:   { flex: 1, padding: '7px 0', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
    popupBtnCancel:{ flex: 1, padding: '7px 0', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' },
    side:          { width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #e5e7eb', overflow: 'hidden' },
    sideTop:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
    sideTitle:     { fontSize: '0.92rem', fontWeight: 700, color: '#111' },
    sideBadge:     { background: '#f59e0b', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 },
    hint:          { padding: '0.6rem 1rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '0.75rem', color: '#92400e', flexShrink: 0 },
    formManu:      { padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0, background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 0 },
    formManuTitre: { fontSize: '0.8rem', fontWeight: 700, color: '#1565c0', marginBottom: 8 },
    btnAdd:        { marginTop: 8, padding: '7px 14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
    btnAddDis:     { marginTop: 8, padding: '7px 14px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.82rem', cursor: 'not-allowed', alignSelf: 'flex-start' },
    list:          { flex: 1, overflowY: 'auto', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: 8 },
    empty:         { color: '#bbb', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.82rem', margin: 0 },
    card:          { border: '1.5px solid #fde68a', borderRadius: 10, padding: '0.65rem 0.7rem', background: '#fffef7' },
    cardRow:       { display: 'flex', gap: 8, marginBottom: 5 },
    num:           { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0, marginTop: 1 },
    cardPage:      { fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 },
    cardHighlight: { fontSize: '0.72rem', color: '#78350f', background: '#fef9c3', padding: '2px 6px', borderRadius: 4, marginBottom: 4, fontStyle: 'italic', lineHeight: 1.4 },
    cardTxt:       { fontSize: '0.82rem', color: '#374151', lineHeight: 1.45 },
    cardBtns:      { display: 'flex', gap: 6, marginTop: 5 },
    inputSm:       { width: '100%', padding: '0.45rem 0.6rem', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    btnSave:       { flex: 1, padding: '6px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
    btnCancel:     { flex: 1, padding: '6px', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: '0.8rem', cursor: 'pointer' },
    btnEdit:       { padding: '3px 10px', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 6, fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer' },
    btnDel:        { padding: '3px 10px', background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', borderRadius: 6, fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer' },
    btnSendOn:     { margin: '0.7rem', padding: '0.78rem', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
    btnSendOff:    { margin: '0.7rem', padding: '0.78rem', background: '#d1d5db', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.88rem', cursor: 'not-allowed', fontWeight: 700, flexShrink: 0 },
};