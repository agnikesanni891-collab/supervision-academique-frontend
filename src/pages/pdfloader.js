import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker officiel (requis par pdfjs-dist pour le multi-threading)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//://cloudflare.com{pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Injecte le style CSS nécessaire au rendu textuel et visuel des pages PDF.
 */
export function injectPdfCSS() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('pdf-js-styles')) {
    const link = document.createElement('link');
    link.id = 'pdf-js-styles';
    link.rel = 'stylesheet';
    link.href = `https://://cloudflare.com{pdfjsLib.version}/pdf_viewer.min.css`;
    document.head.appendChild(link);
  }
}

/**
 * Retourne l'instance globale de pdfjsLib.
 */
export async function getPdfJs() {
  return pdfjsLib;
}

// Cache local pour éviter de télécharger le même PDF plusieurs fois durant la navigation
const pdfCache = new Map();

/**
 * Récupère le PDF depuis le cache ou lance le chargement réseau s'il n'y est pas.
 */
export async function getCachedPdfDocument(url) {
  if (pdfCache.has(url)) {
    return pdfCache.get(url);
  }
  
  // Configuration pour inclure les cookies de session si votre API est protégée
  const loadingTask = pdfjsLib.getDocument({
    url: url,
    withCredentials: true 
  });
  
  const pdf = await loadingTask.promise;
  pdfCache.set(url, pdf);
  return pdf;
}