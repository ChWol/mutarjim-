"use client";

import { useState } from 'react';

const translations = {
  de: {
    title: "Neues Wort hinzufügen",
    editTitle: "Eintrag bearbeiten",
    tunisian: "Tunesisch",
    tunPlaceholder: "z.B. Aaslema",
    german: "Deutsch",
    gerPlaceholder: "z.B. Hallo",
    notes: "Notizen (Optional)",
    notesPlaceholder: "z.B. zur Begrüßung",
    cancel: "Abbrechen",
    save: "Speichern",
    saveEdit: "Änderungen speichern",
    saving: "Speichere...",
    errorEmpty: "Tunesisch und Deutsch sind erforderlich",
    errorSave: "Fehler beim Speichern",
  },
  ar: {
    title: "إضافة كلمة جديدة",
    editTitle: "تعديل المدخل",
    tunisian: "تونسي",
    tunPlaceholder: "مثال: عسلامة",
    german: "ألماني",
    gerPlaceholder: "مثال: Hallo",
    notes: "ملاحظات (اختياري)",
    notesPlaceholder: "مثال: للتحية",
    cancel: "إلغاء",
    save: "حفظ",
    saveEdit: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    errorEmpty: "الكلمتان التونسية والألمانية مطلوبة",
    errorSave: "خطأ في الحفظ",
  }
};

export default function AddWordModal({ isOpen, onClose, onAdd, uiLang = "de", editingItem = null }) {
  const [tunisian, setTunisian] = useState(editingItem?.tunisian || '');
  const [german, setGerman] = useState(editingItem?.german || '');
  const [notes, setNotes] = useState(editingItem?.notes || '');
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
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem?.id, tunisian, german, notes })
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
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="word-dialog-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="word-dialog-title">{editingItem ? t.editTitle : t.title}</h2>
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
              {loading ? t.saving : editingItem ? t.saveEdit : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
