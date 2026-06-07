"use client";

import { useState, useEffect, useMemo } from "react";
import AddWordModal from "@/components/AddWordModal";

// Levenshtein distance algorithm for fuzzy matching
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1,
                   matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const translations = {
  de: {
    title: "Tunesisch • Deutsch",
    subtitle: "Übersetzer & Vokabeltrainer",
    searchPlaceholder: "Suche nach einem Wort (Tunesisch oder Deutsch)...",
    newWordBtn: "+ Neues Wort",
    loading: "Lade Wörterbuch...",
    noExactHits: "Keine genauen Treffer gefunden.",
    didYouMean: "Meintest du:",
    noResults: "Keine Ergebnisse gefunden.",
    addQuestion: "hinzufügen?",
    langToggle: "العربية"
  },
  ar: {
    title: "تونسي • ألماني",
    subtitle: "مترجم ومدرب مفردات",
    searchPlaceholder: "...البحث عن كلمة باللغة التونسية أو الألمانية",
    newWordBtn: "+ كلمة جديدة",
    loading: "...جاري تحميل القاموس",
    noExactHits: ".لم يتم العثور على نتائج دقيقة",
    didYouMean: "هل تقصد:",
    noResults: ".لم يتم العثور على نتائج",
    addQuestion: "إضافة؟",
    langToggle: "Deutsch"
  }
};

export default function Home() {
  const [dictionary, setDictionary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uiLang, setUiLang] = useState("de");

  const t = translations[uiLang];
  const isRtl = uiLang === "ar";

  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        const res = await fetch("/api/dictionary");
        if (res.ok) {
          const data = await res.json();
          setDictionary(data);
        }
      } catch (error) {
        console.error("Failed to load dictionary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDictionary();
  }, []);

  const { filteredWords, suggestion } = useMemo(() => {
    if (!searchQuery.trim()) return { filteredWords: dictionary, suggestion: null };
    
    const query = searchQuery.toLowerCase().trim();
    
    const matches = dictionary.filter(item => 
      item.tunisian.toLowerCase().includes(query) ||
      item.german.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      return { filteredWords: matches, suggestion: null };
    }

    let bestMatch = null;
    let minDistance = Infinity;

    if (query.length > 2) {
      dictionary.forEach(item => {
        const distT = levenshteinDistance(query, item.tunisian.toLowerCase());
        const distG = levenshteinDistance(query, item.german.toLowerCase());
        
        const dist = Math.min(distT, distG);
        const matchWord = distT < distG ? item.tunisian : item.german;

        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = matchWord;
        }
      });
    }

    if (bestMatch && minDistance <= 3) {
      return { filteredWords: [], suggestion: bestMatch };
    }

    return { filteredWords: [], suggestion: null };
  }, [dictionary, searchQuery]);

  const handleAddWord = (newItem) => {
    setDictionary([...dictionary, newItem]);
  };

  const toggleLanguage = () => {
    setUiLang(prev => prev === "de" ? "ar" : "de");
  };

  return (
    <main className="main-content" dir={isRtl ? "rtl" : "ltr"}>
      <header className="app-header">
        <button className="lang-toggle" onClick={toggleLanguage}>
          {t.langToggle}
        </button>
        <div className="title-wrapper">
          <div className="cultural-arch"></div>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
      </header>

      <div className="controls-row">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            dir={isRtl && searchQuery.length === 0 ? "rtl" : "auto"}
          />
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t.newWordBtn}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">{t.loading}</div>
      ) : filteredWords.length === 0 ? (
        suggestion ? (
          <div className="did-you-mean">
            <p>{t.noExactHits}</p>
            <p>
              {t.didYouMean} <button className="suggestion-btn" onClick={() => setSearchQuery(suggestion)}>{suggestion}</button>؟
            </p>
          </div>
        ) : (
          <div className="empty-state">
            {t.noResults} "{searchQuery}" {t.addQuestion}
          </div>
        )
      ) : (
        <div className="words-grid">
          {filteredWords.map((item) => (
            <div key={item.id} className="word-card">
              <div className="word-tunisian" dir="ltr">{item.tunisian}</div>
              <div className="word-german" dir="ltr">{item.german}</div>
              {item.notes && <div className="word-notes">{item.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <AddWordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddWord}
        uiLang={uiLang}
      />
    </main>
  );
}
