const META_MARKER = '\n\n__PDF_HIGHLIGHT_META__';

export function getAnnotationText(annotation) {
    const rawText = String(annotation?.texte_commentaire || annotation?.contenu || '');
    const markerIndex = rawText.indexOf(META_MARKER);
    return markerIndex === -1 ? rawText : rawText.slice(0, markerIndex).trim();
}

export function getAnnotationMeta(annotation) {
    const rawText = String(annotation?.texte_commentaire || annotation?.contenu || '');
    const markerIndex = rawText.indexOf(META_MARKER);
    if (markerIndex === -1) return null;

    try {
        return JSON.parse(rawText.slice(markerIndex + META_MARKER.length));
    } catch {
        return null;
    }
}

export function buildAnnotationText(comment, meta) {
    const cleanComment = (comment || '').trim();
    if (!meta) return cleanComment;
    return cleanComment + META_MARKER + JSON.stringify(meta);
}

export function annotationToHighlight(annotation, index) {
    const meta = getAnnotationMeta(annotation);
    if (!meta?.position) return null;

    return {
        id: String(annotation.id_annotation),
        position: meta.position,
        content: meta.content || {},
        comment: {
            text: getAnnotationText(annotation),
            emoji: String(index + 1),
        },
        annotation,
    };
}
