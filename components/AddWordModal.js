"use client";

import { useState } from 'react';

const translations = {
  de: {
    title: "Neues Wort hinzufügen",
    tunisian: "Tunesisch",
    tunPlaceholder: "z.B. Aaslema",
    german: "Deutsch",
    gerPlaceholder: "z.B. Hallo",
    notes: "Notizen (Optional)",
    notesPlaceholder: "z.B. zur Begrüßung",
    cancel: "Abbrechen",
    save: "Speichern",
    saving: "Speichere...",
    errorEmpty: "Tunesisch und Deutsch sind erforderlich",
    errorSave: "Fehler beim Speichern",
  },
  ar: {
    title: "إضافة كلمة جديدة",
    tunisian: "تونسي",
    tunPlaceholder: "مثال: عسلامة",
    german: "ألماني",
    gerPlaceholder: "مثال: Hallo",
    notes: "ملاحظات (اختياري)",
    notesPlaceholder: "مثال: للتحية",
    cancel: "إلغاء",
    save: "حفظ",
    saving: "جاري الحفظ...",
    errorEmpty: "الكلمتان التونسية والألمانية مطلوبة",
    errorSave: "خطأ في الحفظ",
  }
};

export default function AddWordModal({ isOpen, onClose, onAdd, uiLang = "de" }) {
  const [tunisian, setTunisian] = useState('');
  const [german, setGerman] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[uiLang];
  const isRtl = uiLang === 'ar';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tunisian.trim() || !german.trim()) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunisian, german, notes })
      });

      if (!res.ok) {
        throw new Error(t.errorSave);
      }

      const newItem = await res.json();
      onAdd(newItem);
      
      setTunisian('');
      setGerman('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} dir={isRtl ? "rtl" : "ltr"}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.title}</h2>
        </div>
        
        {error && <p style={{ color: '#d32f2f', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tunisian">{t.tunisian}</label>
            <input 
              type="text" 
              id="tunisian" 
              value={tunisian} 
              onChange={(e) => setTunisian(e.target.value)} 
              placeholder={t.tunPlaceholder}
              autoFocus
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="german">{t.german}</label>
            <input 
              type="text" 
              id="german" 
              value={german} 
              onChange={(e) => setGerman(e.target.value)} 
              placeholder={t.gerPlaceholder}
              dir="ltr"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">{t.notes}</label>
            <input 
              type="text" 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder={t.notesPlaceholder}
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
