const Store = (() => {
  const KEY = 'huffzip_state_v1';

  const defaults = {
    archives: [],
    extractions: [],
    reports: [],
    searchHistory: [],
    notifications: [],
    pinned: [],
    favorites: [],
    settings: {
      theme: 'dark',
      level: 'balanced',
      outputFolder: 'C:/Users/Aryan/HuffZip/Output',
      autoOverwrite: true,
      autoDeleteTemp: true,
      notifications: true,
    },
    stats: { totalCompressed: 0, totalOriginalBytes: 0, totalCompressedBytes: 0, filesProcessed: 0 },
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed(structuredClone(defaults));
      const parsed = JSON.parse(raw);
      return { ...structuredClone(defaults), ...parsed, settings: { ...defaults.settings, ...(parsed.settings || {}) } };
    } catch {
      return seed(structuredClone(defaults));
    }
  }

  function seed(s) {
    const now = Date.now();
    const samples = [
      { name: 'project-report.pdf', ext: 'pdf', orig: 2_450_000, ratio: 0.42, ms: 340, ago: 1000 * 60 * 22 },
      { name: 'dataset.csv', ext: 'csv', orig: 8_900_000, ratio: 0.71, ms: 910, ago: 1000 * 60 * 60 * 3 },
      { name: 'design-assets.zip', ext: 'zip', orig: 15_600_000, ratio: 0.18, ms: 1240, ago: 1000 * 60 * 60 * 26 },
      { name: 'notes.txt', ext: 'txt', orig: 145_000, ratio: 0.63, ms: 60, ago: 1000 * 60 * 60 * 50 },
      { name: 'lecture-recording.mp3', ext: 'mp3', orig: 6_200_000, ratio: 0.09, ms: 720, ago: 1000 * 60 * 60 * 74 },
    ];
    samples.forEach((sm) => {
      const compressed = Math.round(sm.orig * (1 - sm.ratio));
      const created = now - sm.ago;
      const id = uid();
      s.archives.push({
        id, name: sm.name.replace(/\.[^.]+$/, '') + '.huff', sourceName: sm.name, ext: sm.ext,
        originalSize: sm.orig, compressedSize: compressed, ratio: sm.ratio, timeMs: sm.ms,
        fileCount: 1, encrypted: sm.ext === 'pdf', status: 'success', checksum: simpleChecksum(id),
        createdAt: created, level: 'balanced',
      });
      s.reports.push({
        id: uid(), archiveId: id, fileName: sm.name, originalSize: sm.orig, compressedSize: compressed,
        ratio: sm.ratio, timeMs: sm.ms, status: 'success', createdAt: created,
      });
      s.stats.totalCompressed++;
      s.stats.filesProcessed++;
      s.stats.totalOriginalBytes += sm.orig;
      s.stats.totalCompressedBytes += compressed;
    });
    s.notifications.push(
      { id: uid(), icon: 'bi-check-circle-fill', title: 'Compression complete', body: 'design-assets.zip saved 82% space', at: now - 1000 * 60 * 60 },
      { id: uid(), icon: 'bi-shield-lock-fill', title: 'Archive encrypted', body: 'project-report.huff is password protected', at: now - 1000 * 60 * 90 },
      { id: uid(), icon: 'bi-info-circle-fill', title: 'Welcome to HuffZip', body: 'Your smart compression workspace is ready', at: now - 1000 * 60 * 120 },
    );
    persist(s);
    return s;
  }

  function persist(s = state) {
    localStorage.setItem(KEY, JSON.stringify(s));
  }

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(state));

  return {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    settings: () => state.settings,
    updateSettings(patch) { state.settings = { ...state.settings, ...patch }; persist(); notify(); },
    addArchive(a) { state.archives.unshift(a); state.stats.totalCompressed++; state.stats.filesProcessed += a.fileCount || 1; state.stats.totalOriginalBytes += a.originalSize; state.stats.totalCompressedBytes += a.compressedSize; persist(); notify(); },
    addExtraction(x) { state.extractions.unshift(x); persist(); notify(); },
    addReport(r) { state.reports.unshift(r); persist(); notify(); },
    removeArchive(id) { state.archives = state.archives.filter((a) => a.id !== id); state.reports = state.reports.filter((r) => r.archiveId !== id); persist(); notify(); },
    renameArchive(id, name) { const a = state.archives.find((x) => x.id === id); if (a) a.name = name; persist(); notify(); },
    togglePin(id) { state.pinned = state.pinned.includes(id) ? state.pinned.filter((p) => p !== id) : [...state.pinned, id]; persist(); notify(); },
    addSearch(term) { if (!term.trim()) return; state.searchHistory = [term, ...state.searchHistory.filter((t) => t !== term)].slice(0, 12); persist(); },
    clearSearchHistory() { state.searchHistory = []; persist(); notify(); },
    addNotification(n) { state.notifications.unshift({ id: uid(), at: Date.now(), ...n }); persist(); notify(); },
    clearNotifications() { state.notifications = []; persist(); notify(); },
    clearHistory() { state.archives = []; state.extractions = []; state.reports = []; state.pinned = []; state.stats = structuredClone(defaults.stats); persist(); notify(); },
    resetAll() { localStorage.removeItem(KEY); state = seed(structuredClone(defaults)); notify(); },
  };
})();
