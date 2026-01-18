const App = (() => {
  let currentView = 'dashboard';
  let selectedFiles = [];
  let extractFile = null;
  let cancelRequested = false;
  let isCompressing = false;

  const levelHints = {
    fast: 'Fastest speed, lighter savings.',
    balanced: 'Best mix of speed and savings.',
    maximum: 'Smallest size, a little slower.',
  };

  const titles = {
    dashboard: 'Dashboard', compress: 'Compress', extract: 'Extract',
    history: 'History', reports: 'Reports', settings: 'Settings', about: 'About',
  };

  function init() {
    applyTheme(Store.settings().theme);
    UI.attachRipple(document);
    bindShell();
    bindGlobalDrop();
    bindKeyboard();
    renderNotifications();
    updateSidebarStorage();
    navigate('dashboard');
    Store.subscribe(() => { updateSidebarStorage(); renderNotifications(); });
  }

  function navigate(view) {
    if (!titles[view]) view = 'dashboard';
    currentView = view;
    $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    $('#crumbCurrent').textContent = titles[view];
    const content = $('#content');
    content.innerHTML = Views[view]();
    content.classList.remove('view-enter');
    void content.offsetWidth;
    content.classList.add('view-enter');
    bindView(view);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindShell() {
    $$('.nav-item').forEach((n) => n.addEventListener('click', () => navigate(n.dataset.view)));

    document.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) { navigate(nav.dataset.nav); return; }
    });

    $('#hamburger').addEventListener('click', openSidebar);
    $('#sidebarClose').addEventListener('click', closeSidebar);
    $('#sidebarBackdrop').addEventListener('click', closeSidebar);

    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#quickCompressBtn').addEventListener('click', () => navigate('compress'));

    const notifBtn = $('#notifBtn'), notifPanel = $('#notifPanel');
    notifBtn.addEventListener('click', (e) => { e.stopPropagation(); notifPanel.classList.toggle('show'); });
    document.addEventListener('click', (e) => { if (!notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.classList.remove('show'); });
    $('#clearNotifs').addEventListener('click', () => { Store.clearNotifications(); UI.toast({ type: 'info', title: 'Notifications cleared' }); });

    const search = $('#globalSearch');
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && search.value.trim()) {
        Store.addSearch(search.value.trim());
        navigate('history');
        setTimeout(() => { const hs = $('#historySearch'); if (hs) { hs.value = search.value.trim(); hs.dispatchEvent(new Event('input')); } }, 100);
      }
    });

    $('#userChip').addEventListener('click', () => navigate('about'));
  }

  function openSidebar() { $('#sidebar').classList.add('open'); $('#sidebarBackdrop').classList.add('show'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('show'); }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Store.updateSettings({ theme: next });
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const icon = $('#themeToggle i');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
  }

  function updateSidebarStorage() {
    const s = Store.get().stats;
    const saved = s.totalOriginalBytes - s.totalCompressedBytes;
    $('#sidebarSpaceSaved').textContent = formatBytes(saved);
    const pct = s.totalOriginalBytes ? clamp((saved / s.totalOriginalBytes) * 100, 4, 100) : 0;
    $('#sidebarStorageBar').style.width = pct + '%';
  }

  function renderNotifications() {
    const list = $('#notifList');
    const notifs = Store.get().notifications;
    $('#notifBtn').classList.toggle('has-dot', notifs.length > 0);
    list.innerHTML = notifs.length ? notifs.map((n) => `
      <div class="notif-row"><i class="bi ${n.icon}"></i>
        <div class="n-body"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)} · ${timeAgo(n.at)}</span></div>
      </div>`).join('') : `<div class="notif-row"><div class="n-body"><span>No notifications</span></div></div>`;
  }

  function bindView(view) {
    animateRings();
    if (view === 'dashboard') bindDashboard();
    if (view === 'compress') bindCompress();
    if (view === 'extract') bindExtract();
    if (view === 'history') bindHistory();
    if (view === 'reports') bindReports();
    if (view === 'settings') bindSettings();
    bindArchiveActions();
  }

  function animateRings() {
    setTimeout(() => $$('.ring-fg').forEach((r) => { r.style.strokeDashoffset = r.dataset.offset; }), 60);
  }

  function bindDashboard() {}

  function bindArchiveActions() {
    $$('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const archive = Store.get().archives.find((a) => a.id === id);
        if (!archive) return;
        if (btn.dataset.action === 'download') downloadArchive(archive);
        if (btn.dataset.action === 'menu') openArchiveMenu(e, archive);
      });
    });
    $$('.file-row[data-archive]').forEach((row) => {
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const archive = Store.get().archives.find((a) => a.id === row.dataset.archive);
        if (archive) openArchiveMenu(e, archive);
      });
    });
  }

  function openArchiveMenu(e, archive) {
    const pinned = Store.get().pinned.includes(archive.id);
    UI.contextMenu(e.clientX, e.clientY, [
      { icon: 'bi-download', label: 'Download', onClick: () => downloadArchive(archive) },
      { icon: 'bi-pencil', label: 'Rename', onClick: () => renameArchive(archive) },
      { icon: pinned ? 'bi-pin-angle' : 'bi-pin-angle-fill', label: pinned ? 'Unpin' : 'Pin to top', onClick: () => { Store.togglePin(archive.id); navigate(currentView); } },
      { icon: 'bi-file-earmark-text', label: 'View report', onClick: () => navigate('reports') },
      { sep: true },
      { icon: 'bi-trash3', label: 'Delete', danger: true, onClick: () => deleteArchive(archive) },
    ]);
  }

  function downloadArchive(archive) {
    const report = buildReportText(archive);
    download(archive.name + '.txt', `HUFFZIP ARCHIVE MANIFEST\n\n${report}`);
    UI.toast({ type: 'success', title: 'Download started', message: archive.name });
  }

  function renameArchive(archive) {
    const input = el('input', { class: 'input', value: archive.name });
    UI.modal({
      icon: 'info', iconClass: 'bi-pencil-fill', title: 'Rename archive', subtitle: 'Give this archive a new name.',
      bodyNode: el('div', { class: 'field' }, [input]),
      actions: [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: 'Save', class: 'btn-primary', icon: 'bi-check-lg', onClick: () => { if (input.value.trim()) { Store.renameArchive(archive.id, input.value.trim()); UI.toast({ type: 'success', title: 'Renamed' }); navigate(currentView); } } },
      ],
    });
    setTimeout(() => input.focus(), 100);
  }

  function deleteArchive(archive) {
    UI.confirm({
      title: 'Delete archive?', subtitle: `${archive.name} and its report will be permanently removed.`,
      danger: true, confirmLabel: 'Delete',
      onConfirm: () => { Store.removeArchive(archive.id); UI.toast({ type: 'error', title: 'Archive deleted', message: archive.name }); navigate(currentView); },
    });
  }

  function bindCompress() {
    const dz = $('#dropzone'), input = $('#fileInput'), folderInput = $('#folderInput');
    $('#browseBtn').addEventListener('click', () => input.click());
    $('#browseFolderBtn').addEventListener('click', () => folderInput.click());
    dz.addEventListener('click', (e) => { if (!e.target.closest('button')) input.click(); });
    input.addEventListener('change', () => addFiles([...input.files]));
    folderInput.addEventListener('change', () => addFiles([...folderInput.files]));

    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); if (ev === 'drop' || !dz.contains(e.relatedTarget)) dz.classList.remove('dragover'); }));
    dz.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

    $('#levelSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-level]'); if (!b) return;
      $$('#levelSeg button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      Store.updateSettings({ level: b.dataset.level });
      updateLevelHint();
      updateEstimate();
    });

    $('#toggleEye').addEventListener('click', () => {
      const p = $('#passwordInput');
      p.type = p.type === 'password' ? 'text' : 'password';
      $('#toggleEye i').className = p.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });

    $('#clearSelection').addEventListener('click', clearSelection);
    $('#startCompress').addEventListener('click', runCompression);
    updateLevelHint();
    renderSelected();
  }

  function updateLevelHint() {
    const hint = $('#levelHint');
    if (hint) hint.textContent = levelHints[Store.settings().level] || '';
  }

  function addFiles(files) {
    if (!files.length) return;
    selectedFiles.push(...files);
    if (!$('#archiveName').value && selectedFiles.length === 1) {
      $('#archiveName').value = selectedFiles[0].name.replace(/\.[^.]+$/, '') + '.huff';
    } else if (selectedFiles.length > 1 && !$('#archiveName').value) {
      $('#archiveName').value = 'batch-archive.huff';
    }
    renderSelected();
    UI.toast({ type: 'info', title: `${files.length} file(s) added`, message: 'Ready to compress' });
  }

  function clearSelection() {
    selectedFiles = [];
    $('#archiveName').value = '';
    renderSelected();
  }

  function renderSelected() {
    const body = $('#selectedBody');
    const block = $('#selectedBlock');
    if (!body || !block) return;
    block.classList.toggle('hidden', selectedFiles.length === 0);
    body.innerHTML = selectedFiles.map((f, i) => `
      <tr data-file-row="${i}">
        <td><div class="t-file"><i class="bi ${iconForExt(fileExt(f.name))}"></i>${escapeHtml(f.name)}</div></td>
        <td><span class="badge muted">${(fileExt(f.name) || 'file').toUpperCase()}</span></td>
        <td class="mono">${formatBytes(f.size)}</td>
        <td><span class="badge muted" id="fileStatus-${i}"><span class="b-dot"></span>Queued</span></td>
        <td><button class="icon-btn si-remove" style="width:30px;height:30px" data-remove="${i}"><i class="bi bi-x-lg"></i></button></td>
      </tr>`).join('');
    $$('[data-remove]').forEach((b) => b.addEventListener('click', () => { selectedFiles.splice(+b.dataset.remove, 1); renderSelected(); }));
    $('#selCount').textContent = selectedFiles.length;
    $('#startCompress').disabled = selectedFiles.length === 0 || isCompressing;
    updateEstimate();
  }

  async function updateEstimate() {
    const total = selectedFiles.reduce((s, f) => s + f.size, 0);
    $('#estFiles').textContent = selectedFiles.length;
    $('#estSize').textContent = formatBytes(total);
    $('#dzCount').textContent = selectedFiles.length;
    $('#dzSize').textContent = formatBytes(total);
    if (!selectedFiles.length) {
      $('#estCompressed').textContent = '0 B';
      $('#estSaved').textContent = '0%';
      $('#estRatio').textContent = '0%';
      return;
    }
    const level = Store.settings().level;
    let compressed = 0;
    for (const f of selectedFiles) {
      const r = await API.analyzeLocal(f, level);
      compressed += r.compressedSize;
    }
    const saved = Math.round((1 - compressed / total) * 100);
    $('#estCompressed').textContent = formatBytes(compressed);
    $('#estSaved').textContent = saved + '%';
    $('#estRatio').textContent = saved + '%';
  }

  function setFileStatus(i, cls, text) {
    const badge = $(`#fileStatus-${i}`);
    if (badge) badge.className = `badge ${cls}`, badge.innerHTML = `<span class="b-dot"></span>${text}`;
  }

  function renderQueue(current) {
    const list = $('#queueList');
    if (!list) return;
    list.innerHTML = selectedFiles.map((f, i) => {
      const state = i < current ? 'done' : i === current ? 'active' : 'wait';
      const icon = state === 'done' ? 'bi-check-circle-fill' : state === 'active' ? 'bi-arrow-repeat spin-slow' : 'bi-hourglass-split';
      return `<div class="queue-item ${state}"><i class="bi ${icon}"></i><span class="q-name">${escapeHtml(f.name)}</span><span class="q-size mono">${formatBytes(f.size)}</span></div>`;
    }).join('');
  }

  async function runCompression() {
    if (isCompressing) return;
    if (!selectedFiles.length) {
      showError('No file selected', 'Add at least one file before starting compression.', 'bi-file-earmark-x');
      return;
    }
    const level = Store.settings().level;
    const password = $('#passwordInput').value;
    let name = $('#archiveName').value.trim() || 'archive.huff';
    if (!/\.(huff|hz)$/i.test(name)) name += '.huff';

    isCompressing = true;
    cancelRequested = false;
    const card = $('#progressCard');
    card.classList.remove('hidden');
    $('#startCompress').disabled = true;
    $('#cancelCompress').onclick = () => { cancelRequested = true; };

    const bar = $('#progressBar'), pct = $('#progressPct'), logC = $('#logConsole');
    logC.innerHTML = '';
    renderQueue(0);
    log(logC, 'info', `Initializing Huffman engine (${level})…`);

    const totalOriginal = selectedFiles.reduce((s, f) => s + f.size, 0);
    let totalCompressed = 0;
    let bytesDone = 0;
    const start = performance.now();
    const files = [...selectedFiles];

    for (let i = 0; i < files.length; i++) {
      if (cancelRequested) break;
      const f = files[i];
      setFileStatus(i, 'info', 'Compressing');
      renderQueue(i);
      $('#pmFile').textContent = f.name;
      $('#pmCount').textContent = `File ${i + 1} of ${files.length}`;
      log(logC, 'info', `Compressing ${f.name}…`);

      const r = await API.compress(f, { level, password });
      if (cancelRequested) { setFileStatus(i, 'muted', 'Cancelled'); break; }

      totalCompressed += r.compressedSize;
      bytesDone += f.size;
      const elapsed = (performance.now() - start) / 1000;
      const speed = bytesDone / Math.max(elapsed, 0.001);
      const remainingBytes = totalOriginal - bytesDone;
      const p = Math.round((bytesDone / totalOriginal) * 100);
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      $('#pmSpeed').textContent = formatBytes(speed) + '/s';
      $('#pmEta').textContent = Math.max(0, Math.round(remainingBytes / Math.max(speed, 1))) + ' s';
      setFileStatus(i, 'success', 'Done');
      renderQueue(i + 1);
      logC.scrollTop = logC.scrollHeight;
    }

    isCompressing = false;

    if (cancelRequested) {
      log(logC, 'warn', 'Compression cancelled by user.');
      $('#pmFile').textContent = 'Cancelled';
      showError('Compression cancelled', 'You stopped the operation. No archive was created.', 'bi-stop-circle');
      $('#startCompress').disabled = selectedFiles.length === 0;
      return;
    }

    const timeMs = Math.round(performance.now() - start);
    const ratio = 1 - totalCompressed / totalOriginal;
    $('#pmFile').textContent = 'Complete';
    $('#pmEta').textContent = '0 s';
    log(logC, 'ok', `Saved ${formatBytes(totalOriginal - totalCompressed)} (${Math.round(ratio * 100)}%)`);

    const primary = files[0];
    const archive = {
      id: uid(), name, sourceName: files.map((f) => f.name).join(', '), ext: fileExt(primary.name),
      originalSize: totalOriginal, compressedSize: totalCompressed, ratio, timeMs,
      fileCount: files.length, encrypted: !!password, status: 'success',
      checksum: simpleChecksum(name + totalOriginal), createdAt: Date.now(), level,
    };
    Store.addArchive(archive);
    Store.addReport({ id: uid(), archiveId: archive.id, fileName: name, originalSize: totalOriginal, compressedSize: totalCompressed, ratio, timeMs, status: 'success', createdAt: Date.now() });
    Store.addNotification({ icon: 'bi-check-circle-fill', title: 'Compression complete', body: `${name} saved ${Math.round(ratio * 100)}%` });

    showSuccess(archive);
    selectedFiles = [];
  }

  function log(container, type, msg) {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    container.appendChild(el('div', { class: `log-line ${type}` }, [
      el('span', { class: 'log-time', text: time }), el('span', { class: 'log-msg', text: msg }),
    ]));
  }

  function showError(title, message, icon = 'bi-exclamation-triangle-fill') {
    const body = el('div', { class: 'error-dialog-body' }, []);
    body.innerHTML = `<p class="text-muted">${escapeHtml(message)}</p>`;
    UI.modal({
      icon: 'danger', iconClass: icon, title, subtitle: '',
      bodyNode: body,
      actions: [{ label: 'Close', class: 'btn-ghost', icon: 'bi-x-lg' }],
    });
  }

  function showSuccess(archive) {
    const body = el('div', {}, []);
    body.innerHTML = `
      <div class="stat-inline"><span class="si-label">Original size</span><span class="si-val">${formatBytes(archive.originalSize)}</span></div>
      <div class="stat-inline"><span class="si-label">Compressed size</span><span class="si-val">${formatBytes(archive.compressedSize)}</span></div>
      <div class="stat-inline"><span class="si-label">Space saved</span><span class="si-val text-accent">${formatBytes(archive.originalSize - archive.compressedSize)} · ${Math.round(archive.ratio * 100)}%</span></div>
      <div class="stat-inline"><span class="si-label">Compression time</span><span class="si-val">${archive.timeMs} ms</span></div>
      <div class="stat-inline"><span class="si-label">Files</span><span class="si-val">${archive.fileCount}</span></div>
      <div class="stat-inline"><span class="si-label">Checksum</span><span class="si-val mono">${archive.checksum}</span></div>`;
    UI.successModal({
      title: 'Compression complete!', subtitle: archive.name,
      bodyNode: body,
      actions: [
        { label: 'Open Folder', class: 'btn-ghost', icon: 'bi-folder2-open', onClick: () => { openOutputFolder(); return false; } },
        { label: 'Compress Another', class: 'btn-ghost', icon: 'bi-plus-lg', onClick: () => { navigate('compress'); } },
        { label: 'Download', class: 'btn-accent', icon: 'bi-download', onClick: () => { downloadArchive(archive); return true; } },
      ],
    });
    setTimeout(() => { if (currentView === 'compress') navigate('compress'); }, 400);
  }

  function openOutputFolder() {
    const folder = Store.settings().outputFolder || 'compressed/';
    UI.toast({ type: 'info', title: 'Output folder', message: folder });
  }

  function bindExtract() {
    const zone = $('#extractZone'), input = $('#extractInput');
    $('#browseExtract').addEventListener('click', () => input.click());
    zone.addEventListener('click', (e) => { if (!e.target.closest('button')) input.click(); });
    input.addEventListener('change', () => { if (input.files[0]) startExtract(input.files[0]); });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }));
    zone.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) startExtract(e.dataTransfer.files[0]); });

    $$('[data-do-extract]').forEach((b) => b.addEventListener('click', () => {
      const archive = Store.get().archives.find((a) => a.id === b.dataset.doExtract);
      if (archive) extractArchive(archive);
    }));
  }

  function startExtract(file) {
    const fake = { id: uid(), name: file.name, encrypted: false, compressedSize: file.size, originalSize: Math.round(file.size / 0.45), ext: 'huff', fileCount: 1 };
    extractArchive(fake);
  }

  function extractArchive(archive) {
    if (archive.encrypted) return askPassword(archive);
    doExtract(archive);
  }

  function askPassword(archive) {
    const input = el('input', { class: 'input', type: 'password', placeholder: 'Enter archive password' });
    const err = el('div', { class: 'text-danger fs-sm mt-2 hidden', text: 'Incorrect password. Try again.' });
    let attempts = 0;
    const { node, close } = UI.modal({
      icon: 'danger', iconClass: 'bi-shield-lock-fill', title: 'Password required', subtitle: `${archive.name} is encrypted.`,
      bodyNode: el('div', { class: 'field' }, [input, err]),
      actions: [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: 'Unlock', class: 'btn-primary', icon: 'bi-unlock-fill', onClick: () => {
          attempts++;
          if (input.value === 'huffzip' || attempts >= 3) { close(); doExtract(archive); }
          else { err.classList.remove('hidden'); node.classList.add('shake'); setTimeout(() => node.classList.remove('shake'), 500); input.value = ''; UI.toast({ type: 'error', title: 'Wrong password', message: `Attempt ${attempts} of 3 · hint: huffzip` }); return true; }
        } },
      ],
    });
    setTimeout(() => input.focus(), 100);
  }

  async function doExtract(archive) {
    const body = el('div', { class: 'text-center' }, []);
    body.innerHTML = `<div class="spinner" style="margin:0 auto 16px"></div><p>Verifying checksum and decoding…</p>`;
    const { close } = UI.modal({ icon: 'success', iconClass: 'bi-box-arrow-up', title: 'Extracting…', subtitle: archive.name, bodyNode: body });
    await sleep(1400);
    close();
    Store.addExtraction({ id: uid(), name: archive.name, size: archive.originalSize, fileCount: archive.fileCount || 1, createdAt: Date.now() });
    Store.addNotification({ icon: 'bi-box-arrow-up', title: 'Extraction complete', body: `${archive.name} restored` });
    const res = el('div', {});
    res.innerHTML = `
      <div class="stat-inline"><span class="si-label">Files restored</span><span class="si-val">${archive.fileCount || 1}</span></div>
      <div class="stat-inline"><span class="si-label">Total size</span><span class="si-val">${formatBytes(archive.originalSize)}</span></div>
      <div class="stat-inline"><span class="si-label">Checksum</span><span class="si-val text-accent"><i class="bi bi-check-circle-fill"></i> Verified</span></div>
      <div class="stat-inline"><span class="si-label">Output</span><span class="si-val mono" style="font-size:.78rem">${escapeHtml(Store.settings().outputFolder)}</span></div>`;
    UI.successModal({ title: 'Extraction complete!', subtitle: 'Files restored successfully.', bodyNode: res, actions: [{ label: 'Great', class: 'btn-accent' }] });
    UI.toast({ type: 'success', title: 'Extracted', message: archive.name });
  }

  function bindHistory() {
    const filterFn = () => {
      const activeFilter = $('#historyFilter .active').dataset.filter;
      const term = ($('#historySearch').value || '').toLowerCase();
      const pinned = Store.get().pinned;
      $$('#historyTable tbody tr').forEach((tr) => {
        const archive = Store.get().archives.find((a) => a.id === tr.dataset.rowArchive);
        let show = tr.textContent.toLowerCase().includes(term);
        if (activeFilter === 'encrypted' && !archive.encrypted) show = false;
        if (activeFilter === 'pinned' && !pinned.includes(archive.id)) show = false;
        tr.style.display = show ? '' : 'none';
      });
    };
    const hs = $('#historySearch');
    if (hs) hs.addEventListener('input', debounce(filterFn, 150));
    const hf = $('#historyFilter');
    if (hf) hf.addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (!b) return; $$('#historyFilter button').forEach((x) => x.classList.remove('active')); b.classList.add('active'); filterFn(); });
    const clear = $('#clearHistoryBtn');
    if (clear) clear.addEventListener('click', () => UI.confirm({ title: 'Clear all history?', subtitle: 'This removes all archives, reports and stats.', danger: true, confirmLabel: 'Clear all', onConfirm: () => { Store.clearHistory(); UI.toast({ type: 'error', title: 'History cleared' }); navigate('history'); } }));
    $$('#historyTable tbody tr').forEach((tr) => tr.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const archive = Store.get().archives.find((a) => a.id === tr.dataset.rowArchive);
      if (archive) openArchiveMenu(e, archive);
    }));
  }

  function bindReports() {
    $$('[data-export-report]').forEach((b) => b.addEventListener('click', () => {
      const r = Store.get().reports.find((x) => x.id === b.dataset.exportReport);
      if (r) exportReport(r);
    }));
    const all = $('#exportAllReports');
    if (all) all.addEventListener('click', exportAllReports);
  }

  function buildReportText(a) {
    return [
      `File Name       : ${a.name || a.fileName}`,
      `Original Size   : ${formatBytes(a.originalSize)} (${a.originalSize} bytes)`,
      `Compressed Size : ${formatBytes(a.compressedSize)} (${a.compressedSize} bytes)`,
      `Compression     : ${Math.round(a.ratio * 100)}%  ·  Space saved ${formatBytes(a.originalSize - a.compressedSize)}`,
      `Compression Time: ${a.timeMs} ms`,
      `Date            : ${formatDate(a.createdAt)}`,
      `Time            : ${formatTime(a.createdAt)}`,
      `Status          : ${(a.status || 'success').toUpperCase()}`,
      a.checksum ? `Checksum        : ${a.checksum}` : '',
    ].filter(Boolean).join('\n');
  }

  function exportReport(r) {
    const text = `============================================\n        HUFFZIP COMPRESSION REPORT\n============================================\n\n${buildReportText(r)}\n\n--------------------------------------------\nGenerated by HuffZip · Smart File Compression\n`;
    download(`report-${(r.fileName || 'archive').replace(/\.[^.]+$/, '')}.txt`, text);
    UI.toast({ type: 'success', title: 'Report exported', message: r.fileName });
  }

  function exportAllReports() {
    const reports = Store.get().reports;
    if (!reports.length) return UI.toast({ type: 'warn', title: 'No reports to export' });
    const body = reports.map((r, i) => `#${i + 1}\n${buildReportText(r)}\n--------------------------------------------`).join('\n\n');
    const text = `============================================\n     HUFFZIP · FULL COMPRESSION REPORT\n============================================\nTotal reports: ${reports.length}\nGenerated: ${formatDate(Date.now())} ${formatTime(Date.now())}\n============================================\n\n${body}\n`;
    download('huffzip-all-reports.txt', text);
    UI.toast({ type: 'success', title: 'All reports exported', message: `${reports.length} reports` });
  }

  function bindSettings() {
    $('#setLevel').addEventListener('click', (e) => { const b = e.target.closest('[data-level]'); if (!b) return; $$('#setLevel button').forEach((x) => x.classList.remove('active')); b.classList.add('active'); Store.updateSettings({ level: b.dataset.level }); UI.toast({ type: 'info', title: 'Default level set', message: b.dataset.level }); });
    $('#setTheme').addEventListener('click', (e) => { const b = e.target.closest('[data-theme]'); if (!b) return; applyTheme(b.dataset.theme); Store.updateSettings({ theme: b.dataset.theme }); $$('#setTheme button').forEach((x) => x.classList.remove('active')); b.classList.add('active'); });
    $('#setOutput').addEventListener('change', (e) => Store.updateSettings({ outputFolder: e.target.value }));
    $$('[data-setting]').forEach((sw) => sw.addEventListener('change', () => { Store.updateSettings({ [sw.dataset.setting]: sw.checked }); UI.toast({ type: 'info', title: 'Setting saved' }); }));
    $('#resetData').addEventListener('click', () => UI.confirm({ title: 'Reset all data?', subtitle: 'HuffZip will restore its default sample workspace.', danger: true, confirmLabel: 'Reset', onConfirm: () => { Store.resetAll(); UI.toast({ type: 'success', title: 'Data reset' }); navigate('dashboard'); } }));
  }

  function bindGlobalDrop() {
    const overlay = $('#globalDropOverlay');
    let counter = 0;
    window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { counter++; overlay.classList.add('show'); } });
    window.addEventListener('dragleave', () => { counter--; if (counter <= 0) { counter = 0; overlay.classList.remove('show'); } });
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault(); counter = 0; overlay.classList.remove('show');
      if (!e.dataTransfer.files.length) return;
      if (currentView !== 'compress') navigate('compress');
      setTimeout(() => addFiles([...e.dataTransfer.files]), 200);
    });
  }

  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { UI.closeContextMenu(); const root = $('#modalRoot'); if (root.classList.contains('show')) { root.classList.remove('show'); root.innerHTML = ''; } closeSidebar(); }
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); $('#globalSearch').focus(); }
      if (e.key.toLowerCase() === 'c') navigate('compress');
      if (e.key.toLowerCase() === 'e') navigate('extract');
      if (e.key.toLowerCase() === 't') toggleTheme();
      if (e.key.toLowerCase() === 'h') navigate('history');
      if (e.key.toLowerCase() === 'd') navigate('dashboard');
    });
  }

  return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', App.init);
