// useUploadQueue.js
// Hook de file d'attente d'upload avec notifications en temps réel
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Statuts possibles d'un job dans la file
 * 'en_attente' | 'en_cours' | 'succes' | 'echec'
 */

let _jobCounter = 0;
const newId = () => `job_${++_jobCounter}_${Date.now()}`;

export function useUploadQueue({ baseURL, token, onVersionDeposee }) {
    const [file, setFile]         = useState([]);   // la file complète
    const [notifications, setNotifications] = useState([]); // toasts de résultat
    const processingRef = useRef(false);
    const fileRef       = useRef([]);

    // Garder fileRef sync avec state (pour accès dans closure sans stale)
    useEffect(() => { fileRef.current = file; }, [file]);

    // ── Ajouter un ou plusieurs fichiers à la file ──────────────────────────
    const ajouter = useCallback((fichiers, memoireId, label) => {
        const nouveaux = (Array.isArray(fichiers) ? fichiers : [fichiers]).map(f => ({
            id:        newId(),
            fichier:   f,
            memoireId,
            label:     label || f.name,
            statut:    'en_attente',   // en_attente | en_cours | succes | echec
            progression: 0,
            erreur:    null,
            dateAjout: new Date(),
        }));
        setFile(prev => [...prev, ...nouveaux]);
        return nouveaux.map(j => j.id);
    }, []);

    // ── Retirer un job de la file (uniquement si en_attente) ────────────────
    const annuler = useCallback((id) => {
        setFile(prev => prev.filter(j => j.id !== id || j.statut !== 'en_attente'));
    }, []);

    // ── Dismisser une notification ──────────────────────────────────────────
    const dismissNotif = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // ── Mettre à jour un job (progression, statut…) ─────────────────────────
    const majJob = useCallback((id, patch) => {
        setFile(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
    }, []);

    // ── Traiter le prochain job en attente ──────────────────────────────────
    const traiterProchain = useCallback(async () => {
        if (processingRef.current) return;

        const prochain = fileRef.current.find(j => j.statut === 'en_attente');
        if (!prochain) return;

        processingRef.current = true;
        majJob(prochain.id, { statut: 'en_cours', progression: 0 });

        const formData = new FormData();
        formData.append('fichier', prochain.fichier);

        try {
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const url = (baseURL || '').replace(/\/$/, '')
                    + `/memoires/${prochain.memoireId}/versions`;

                xhr.open('POST', url);
                if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                xhr.setRequestHeader('Accept', 'application/json');

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        majJob(prochain.id, {
                            progression: Math.round((e.loaded / e.total) * 100)
                        });
                    }
                });

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
                    } else {
                        try { reject({ message: JSON.parse(xhr.responseText).message || 'Erreur serveur.' }); }
                        catch { reject({ message: `Erreur serveur (${xhr.status}).` }); }
                    }
                };
                xhr.onerror = () => reject({ message: 'Erreur réseau. Vérifiez votre connexion.' });
                xhr.send(formData);
            });

            majJob(prochain.id, { statut: 'succes', progression: 100 });

            // Notif succès
            const notifId = newId();
            setNotifications(prev => [...prev, {
                id:     notifId,
                type:   'succes',
                texte:  `✅ "${prochain.label}" déposé avec succès !`,
                date:   new Date(),
            }]);
            // Auto-dismiss après 8s
            setTimeout(() => dismissNotif(notifId), 8000);

            // Callback pour recharger les versions dans le parent
            if (onVersionDeposee) onVersionDeposee(prochain.memoireId);

        } catch (err) {
            const msg = err?.message || 'Erreur inconnue.';
            majJob(prochain.id, { statut: 'echec', erreur: msg });

            const notifId = newId();
            setNotifications(prev => [...prev, {
                id:     notifId,
                type:   'erreur',
                texte:  `❌ "${prochain.label}" — ${msg}`,
                date:   new Date(),
            }]);
            setTimeout(() => dismissNotif(notifId), 12000);
        } finally {
            processingRef.current = false;
            // Chaîner le suivant après un court délai
            setTimeout(() => traiterProchain(), 400);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseURL, token, majJob, dismissNotif, onVersionDeposee]);

    // Démarrer le traitement dès qu'un job en_attente apparaît
    useEffect(() => {
        const aTraiter = file.some(j => j.statut === 'en_attente');
        if (aTraiter && !processingRef.current) traiterProchain();
    }, [file, traiterProchain]);

    // Stats pratiques pour l'UI
    const stats = {
        enAttente: file.filter(j => j.statut === 'en_attente').length,
        enCours:   file.filter(j => j.statut === 'en_cours').length,
        succes:    file.filter(j => j.statut === 'succes').length,
        echec:     file.filter(j => j.statut === 'echec').length,
        total:     file.length,
        actif:     file.some(j => j.statut === 'en_attente' || j.statut === 'en_cours'),
    };

    return { file, stats, notifications, ajouter, annuler, dismissNotif };
}