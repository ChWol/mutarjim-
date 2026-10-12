"use client";

import { useEffect, useRef, useState } from "react";
import AddWordModal from "@/components/AddWordModal";

const PAGE_SIZE = 24;

const translations = {
  de: {
    searchPlaceholder: "Ein Wort auf Tunesisch oder Deutsch suchen …",
    newWordBtn: "Wort hinzufügen",
    dictionary: "Wörterbuch",
    results: "Suchergebnisse",
    wordCount: (count) => `${count} Treffer`,
    loading: "Suche im Wörterbuch …",
    loadingMore: "Weitere Treffer werden geladen …",
    noExactHits: "Keine passenden Treffer gefunden.",
    didYouMean: "Meintest du",
    noResults: "Keine Ergebnisse gefunden.",
    addQuestion: "",
    langToggle: "العربية",
    editHint: "Rechtsklick zum Bearbeiten",
  },
  ar: {
    searchPlaceholder: "ابحث عن كلمة تونسية أو ألمانية...",
    newWordBtn: "إضافة كلمة",
    dictionary: "القاموس",
    results: "نتائج البحث",
    wordCount: (count) => `${count} نتيجة`,
    loading: "جاري البحث في القاموس...",
    loadingMore: "جاري تحميل المزيد...",
    noExactHits: "لم يتم العثور على نتائج مطابقة.",
    didYouMean: "هل تقصد",
    noResults: "لم يتم العثور على نتائج.",
    addQuestion: "",
    langToggle: "Deutsch",
    editHint: "انقر بزر الفأرة الأيمن للتعديل",
  },
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [words, setWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uiLang, setUiLang] = useState("de");
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const searchQueryRef = useRef(searchQuery.trim());
  const [loadedKey, setLoadedKey] = useState("");

  const t = translations[uiLang];
  const isRtl = uiLang === "ar";
  const hasQuery = Boolean(searchQuery.trim());
  const requestKey = `${searchQuery.trim()}::${refreshVersion}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    const query = searchQuery.trim();
    searchQueryRef.current = query;
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (query) params.set("q", query);
        const response = await fetch(`/api/dictionary?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setWords(data.items);
        setTotal(data.total);
        setSuggestion(data.suggestion);
        setHasMore(data.hasMore);
        setLoadedKey(requestKey);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to search dictionary:", error);
          setWords([]);
          setTotal(0);
          setSuggestion(null);
          setHasMore(false);
          setLoadedKey(requestKey);
        }
      }
    }, 60);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [requestKey, searchQuery, refreshVersion]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);

      const requestedQuery = searchQuery.trim();
      const params = new URLSearchParams({
        offset: String(words.length),
        limit: String(PAGE_SIZE),
      });
      if (requestedQuery) params.set("q", requestedQuery);
      fetch(`/api/dictionary?${params}`)
        .then((response) => {
          if (!response.ok) throw new Error("Could not load more results");
          return response.json();
        })
        .then((data) => {
          if (searchQueryRef.current !== requestedQuery) return;
          setWords((current) => [...current, ...data.items]);
          setTotal(data.total);
          setHasMore(data.hasMore);
        })
        .catch((error) => console.error("Failed to load more dictionary entries:", error))
        .finally(() => {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        });
    }, { rootMargin: "240px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasQuery, loading, loadingMore, searchQuery, words.length]);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSavedWord = () => setRefreshVersion((version) => version + 1);
  const toggleLanguage = () => setUiLang((language) => language === "de" ? "ar" : "de");

  return (
    <main className="main-content" dir={isRtl ? "rtl" : "ltr"}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-top-controls">
          <button className="lang-toggle" onClick={toggleLanguage} type="button">
            {t.langToggle}
          </button>
        </div>
        <div className="hero-kicker" dir="ltr">
          <span dir="rtl">تونس</span>
          <svg viewBox="0 0 104 28" fill="none" aria-hidden="true">
            <path d="M4 19C16 6 25 5 36 13 45 20 53 25 65 20 75 16 79 9 87 11" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
            <path d="M87 6 101 12 87 18Z" fill="currentColor" />
          </svg>
          <span className="germany-label">Deutschland</span>
        </div>
        <h1 id="hero-title">مترجم سريع</h1>
        <div className="hero-rule" aria-hidden="true" />
      </section>

      <div className="search-panel">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
            <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => {
              searchQueryRef.current = event.target.value.trim();
              setSearchQuery(event.target.value);
            }}
            className="search-input"
            dir={isRtl && searchQuery.length === 0 ? "rtl" : "auto"}
            aria-label={t.searchPlaceholder}
          />
        </div>
        <button
          className="add-word-button"
          onClick={openAddModal}
          aria-label={t.newWordBtn}
          title={t.newWordBtn}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <section aria-labelledby="dictionary-title">
          <div className="dictionary-heading">
            <h2 id="dictionary-title">{hasQuery ? t.results : t.dictionary}</h2>
            {!loading && total > 0 && <span className="word-count">{t.wordCount(total)}</span>}
            {loading && <span className="search-loading-indicator" role="status" aria-label={t.loading} />}
          </div>

          {loading && words.length === 0 ? (
            <div className="empty-state">{t.loading}</div>
          ) : words.length > 0 ? (
            <>
              <div className="words-grid" aria-busy={loading}>
                {words.map((item) => (
                  <article
                    key={item.id}
                    className="word-card"
                    onContextMenu={(event) => {
                      event.preventDefault();
                      openEditModal(item);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
                        event.preventDefault();
                        openEditModal(item);
                      }
                    }}
                    tabIndex={0}
                    title={t.editHint}
                    aria-label={`${item.tunisian}: ${item.german}. ${t.editHint}`}
                  >
                    <div className="word-tunisian" dir="auto">{item.tunisian}</div>
                    <div className="word-german" dir="auto">{item.german}</div>
                    {item.notes && <div className="word-notes">{item.notes}</div>}
                  </article>
                ))}
              </div>
              {hasMore && <div ref={sentinelRef} className="load-more-sentinel" aria-live="polite">{loadingMore ? t.loadingMore : ""}</div>}
            </>
          ) : suggestion ? (
            <div className="did-you-mean" dir={isRtl ? "rtl" : "ltr"}>
              <p>{t.noExactHits}</p>
              <p className="suggestion-line">
                <span>{t.didYouMean}</span>
                <button className="suggestion-btn" onClick={() => setSearchQuery(suggestion)} type="button" dir="auto">{suggestion}</button>
                <span>{isRtl ? "؟" : "?"}</span>
              </p>
            </div>
          ) : (
            <div className="empty-state">{t.noResults}</div>
          )}
        </section>

      <AddWordModal
        key={editingItem?.id || (isModalOpen ? "new-word-open" : "new-word-closed")}
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleSavedWord}
        uiLang={uiLang}
        editingItem={editingItem}
      />
    </main>
  );
}
