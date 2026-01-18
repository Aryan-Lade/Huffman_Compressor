const Views = (() => {
  const sectionHead = (title, subtitle, actionsHtml = '') => `
    <div class="section-head">
      <div class="st"><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="section-actions">${actionsHtml}</div>
    </div>`;

  function dashboard() {
    const s = Store.get();
    const st = s.stats;
    const saved = st.totalOriginalBytes - st.totalCompressedBytes;
    const avgRatio = st.totalOriginalBytes ? Math.round((saved / st.totalOriginalBytes) * 100) : 0;
    const successRate = st.totalCompressed ? Math.round((s.archives.filter((a) => a.status === 'success').length / st.totalCompressed) * 100) : 100;
    const recent = s.archives.slice(0, 6);

    const activity = buildActivity();
    const activityRows = activity.length ? activity.map(activityRow).join('') : emptyInline('No activity yet', 'Your recent actions will show up here.');

    const tableRows = recent.length ? recent.map((a) => `
      <tr data-archive="${a.id}">
        <td><div class="t-file"><i class="bi ${iconForExt(a.ext)}"></i>${escapeHtml(a.name)}</div></td>
        <td class="mono">${formatBytes(a.originalSize)}</td>
        <td class="mono">${formatBytes(a.compressedSize)}</td>
        <td><span class="badge success">${Math.round(a.ratio * 100)}%</span></td>
        <td>${timeAgo(a.createdAt)}</td>
        <td><span class="badge ${a.status === 'success' ? 'success' : 'danger'}"><span class="b-dot"></span>${a.status}</span></td>
        <td>
          <button class="icon-btn" style="width:30px;height:30px" data-action="download" data-id="${a.id}" data-tooltip="Download"><i class="bi bi-download"></i></button>
          <button class="icon-btn" style="width:30px;height:30px" data-action="menu" data-id="${a.id}" data-tooltip="More"><i class="bi bi-three-dots"></i></button>
        </td>
      </tr>`).join('') : '';

    return `
      ${sectionHead('Dashboard', 'Welcome back, Aryan. Here is your compression overview.',
        `<button class="btn btn-ghost" data-nav="reports"><i class="bi bi-download"></i>Open Reports</button>
         <button class="btn btn-primary btn-glow" data-nav="compress"><i class="bi bi-plus-lg"></i>New Compression</button>`)}

      <div class="stat-grid stagger">
        ${statCard('bi-archive-fill', '', 'Total Files Compressed', st.totalCompressed, `<span class="stat-trend up"><i class="bi bi-arrow-up-right"></i> Active</span>`)}
        ${statCard('bi-hdd-network-fill', 'green', 'Total Space Saved', formatBytes(saved), `<span class="stat-trend up"><i class="bi bi-graph-up-arrow"></i> ${avgRatio}% average</span>`)}
        ${statCard('bi-speedometer2', 'purple', 'Compression Ratio', avgRatio + '%', `<span class="stat-trend up"><i class="bi bi-lightning-charge"></i> Optimized</span>`)}
        ${statCard('bi-check2-circle', 'orange', 'Success Rate', successRate + '%', `<span class="stat-trend up"><i class="bi bi-shield-check"></i> Reliable</span>`)}
      </div>

      <div class="dash-grid">
        <div class="card-stack">
          <div class="glass-card hover-lift">
            <div class="section-head" style="margin-bottom:16px">
              <div class="st"><h3>Quick Actions</h3><p>Jump straight into a task</p></div>
            </div>
            <div class="quick-actions">
              ${quickAction('bi-file-earmark-zip-fill', 'Compress File', 'Shrink any file', 'compress')}
              ${quickAction('bi-box-arrow-up', 'Extract Archive', 'Unpack files', 'extract')}
              ${quickAction('bi-folder-plus', 'Create ZIP', 'Bundle files', 'compress')}
              ${quickAction('bi-file-earmark-bar-graph-fill', 'Open Reports', 'View reports', 'reports')}
            </div>
          </div>

          <div class="glass-card hover-lift">
            <div class="section-head" style="margin-bottom:8px">
              <div class="st"><h3>Recent Files</h3><p>Latest archives you created</p></div>
              <button class="btn btn-sm btn-ghost" data-nav="history">View all</button>
            </div>
            ${tableRows ? `<div class="table-wrap"><table class="data" id="dashTable">
              <thead><tr><th>File</th><th>Original</th><th>Compressed</th><th>Ratio</th><th>When</th><th>Status</th><th></th></tr></thead>
              <tbody>${tableRows}</tbody></table></div>`
              : emptyInline('No files yet', 'Compress your first file to see it here.')}
          </div>
        </div>

        <div class="card-stack">
          <div class="glass-card hover-lift text-center">
            <h3 class="mb-4">Compression Ratio</h3>
            ${ratioRing(avgRatio)}
            <div class="mt-4 text-muted fs-sm">Average across all archives</div>
          </div>
          <div class="glass-card hover-lift">
            <div class="section-head" style="margin-bottom:8px"><div class="st"><h3>Recent Activity</h3></div><span class="badge info"><span class="b-dot"></span>Live</span></div>
            <div class="activity-feed">${activityRows}</div>
          </div>
        </div>
      </div>

      <div class="status-bar">
        <div class="sb-group">
          <span class="sb-item"><span class="sb-dot ok"></span>Engine ready</span>
          <span class="sb-item"><i class="bi bi-cpu"></i>Huffman</span>
          <span class="sb-item"><i class="bi bi-hdd"></i>${st.totalCompressed} archives</span>
        </div>
        <div class="sb-group">
          <span class="sb-item"><i class="bi bi-graph-up-arrow"></i>${formatBytes(saved)} saved</span>
          <span class="sb-item"><i class="bi bi-clock"></i>${formatTime(Date.now())}</span>
          <span class="sb-item">HuffZip v1.0.0</span>
        </div>
      </div>`;
  }

  function buildActivity() {
    const s = Store.get();
    const items = [];
    s.archives.slice(0, 4).forEach((a) => items.push({
      icon: a.encrypted ? 'bi-shield-lock-fill' : 'bi-file-earmark-zip-fill',
      tone: 'info', title: `Compressed ${a.name}`, sub: `${Math.round(a.ratio * 100)}% saved`, at: a.createdAt,
    }));
    s.extractions.slice(0, 2).forEach((x) => items.push({
      icon: 'bi-box-arrow-up', tone: 'green', title: `Extracted ${x.name}`, sub: `${formatBytes(x.size)} restored`, at: x.createdAt,
    }));
    return items.sort((a, b) => b.at - a.at).slice(0, 6);
  }

  function activityRow(item) {
    return `<div class="activity-item">
      <div class="ai-ico ${item.tone}"><i class="bi ${item.icon}"></i></div>
      <div class="ai-body"><div class="ai-title">${escapeHtml(item.title)}</div><div class="ai-sub">${escapeHtml(item.sub)}</div></div>
      <div class="ai-time">${timeAgo(item.at)}</div>
    </div>`;
  }

  function statCard(icon, tone, label, value, trend = '') {
    return `<div class="stat-card">
      <div class="stat-icon ${tone}"><i class="bi ${icon}"></i></div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${trend}
    </div>`;
  }

  function quickAction(icon, title, sub, nav) {
    return `<a class="quick-action" data-nav="${nav}">
      <i class="bi ${icon}"></i>
      <div><div class="qa-title">${title}</div><div class="qa-sub">${sub}</div></div>
    </a>`;
  }

  function ratioRing(percent) {
    const r = 54, c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return `<div class="ratio-ring">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs>
        <circle class="ring-bg" cx="70" cy="70" r="${r}" stroke-width="12"/>
        <circle class="ring-fg" cx="70" cy="70" r="${r}" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-offset="${offset}"/>
      </svg>
      <div class="ring-val">${percent}%</div>
    </div>`;
  }

  function fileRow(a) {
    const pinned = Store.get().pinned.includes(a.id);
    return `<div class="file-row" data-archive="${a.id}">
      <div class="file-ico"><i class="bi ${iconForExt(a.ext)}"></i></div>
      <div class="file-info">
        <div class="file-name">${escapeHtml(a.name)} ${pinned ? '<i class="bi bi-pin-angle-fill" style="color:var(--warning);font-size:.75rem"></i>' : ''} ${a.encrypted ? '<i class="bi bi-lock-fill" style="color:var(--text-dim);font-size:.75rem"></i>' : ''}</div>
        <div class="file-sub">${formatBytes(a.originalSize)} → ${formatBytes(a.compressedSize)} · ${Math.round(a.ratio * 100)}% saved · ${timeAgo(a.createdAt)}</div>
      </div>
      <span class="badge success"><span class="b-dot"></span>${a.status}</span>
      <div class="file-actions">
        <button class="icon-btn" style="width:32px;height:32px" data-action="download" data-id="${a.id}" data-tooltip="Download"><i class="bi bi-download"></i></button>
        <button class="icon-btn" style="width:32px;height:32px" data-action="menu" data-id="${a.id}" data-tooltip="More"><i class="bi bi-three-dots-vertical"></i></button>
      </div>
    </div>`;
  }

  function emptyInline(title, sub) {
    return `<div class="empty-state" style="padding:32px 16px">
      <div class="es-illus" style="width:72px;height:72px;font-size:1.8rem"><i class="bi bi-inbox"></i></div>
      <h3>${title}</h3><p>${sub}</p>
    </div>`;
  }

  function compress() {
    const level = Store.settings().level;
    return `
      ${sectionHead('Compress', 'Drag files in or browse to shrink them with Huffman coding.',
        `<span class="badge info"><i class="bi bi-cpu"></i> Huffman Engine</span>`)}

      <div class="two-col" style="grid-template-columns: 1.6fr 1fr; align-items:start">
        <div class="card-stack">
          <div class="glass-card">
            <div class="dropzone" id="dropzone">
              <input type="file" class="file-input" id="fileInput" multiple />
              <input type="file" class="file-input" id="folderInput" webkitdirectory directory multiple />
              <div class="dz-icon"><i class="bi bi-cloud-arrow-up-fill"></i></div>
              <h3>Drop files or a folder here</h3>
              <p>or use the buttons below. Supports any file type — text compresses best.</p>
              <div class="dz-actions">
                <button class="btn btn-primary" id="browseBtn"><i class="bi bi-folder2-open"></i> Browse Files</button>
                <button class="btn btn-ghost" id="browseFolderBtn"><i class="bi bi-folder-plus"></i> Browse Folder</button>
              </div>
              <div class="dz-meta" id="dzMeta">
                <span class="badge muted"><i class="bi bi-files"></i> <b id="dzCount">0</b> files</span>
                <span class="badge muted"><i class="bi bi-hdd"></i> <b id="dzSize">0 B</b></span>
              </div>
            </div>

            <div class="selected-block hidden" id="selectedBlock">
              <div class="section-head" style="margin:var(--s-5) 0 var(--s-3)">
                <div class="st"><h3>Selected Files</h3><p><span id="selCount">0</span> file(s) queued</p></div>
                <button class="btn btn-sm btn-ghost" id="clearSelection"><i class="bi bi-x-circle"></i> Clear</button>
              </div>
              <div class="table-wrap files-table-wrap">
                <table class="data" id="selectedTable">
                  <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Status</th><th></th></tr></thead>
                  <tbody id="selectedBody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="glass-card hidden" id="progressCard">
            <div class="flex items-center justify-between mb-4">
              <h3><i class="bi bi-arrow-repeat spin-slow"></i> Compressing…</h3>
              <span class="badge info" id="progressPct">0%</span>
            </div>
            <div class="progress accent"><div class="bar" id="progressBar"></div></div>
            <div class="progress-meta" id="progressMeta">
              <div class="pm-cell"><span class="pm-k">Current file</span><span class="pm-v" id="pmFile">—</span></div>
              <div class="pm-cell"><span class="pm-k">Progress</span><span class="pm-v" id="pmCount">File 0 of 0</span></div>
              <div class="pm-cell"><span class="pm-k">Speed</span><span class="pm-v" id="pmSpeed">— MB/s</span></div>
              <div class="pm-cell"><span class="pm-k">Remaining</span><span class="pm-v" id="pmEta">— s</span></div>
            </div>
            <div class="queue-list" id="queueList"></div>
            <div class="flex justify-end mt-4">
              <button class="btn btn-sm btn-danger-ghost" id="cancelCompress"><i class="bi bi-stop-circle"></i> Cancel</button>
            </div>
            <div class="log-console mt-4" id="logConsole"></div>
          </div>
        </div>

        <div class="card-stack">
          <div class="glass-card">
            <h3 class="mb-4">Options</h3>
            <div class="field">
              <label>Compression Level</label>
              <div class="segmented w-full" id="levelSeg" style="display:flex">
                <button data-level="fast" class="${level === 'fast' ? 'active' : ''}" style="flex:1">Fast</button>
                <button data-level="balanced" class="${level === 'balanced' ? 'active' : ''}" style="flex:1">Balanced</button>
                <button data-level="maximum" class="${level === 'maximum' ? 'active' : ''}" style="flex:1">Max</button>
              </div>
              <div class="level-hint" id="levelHint"></div>
            </div>
            <div class="field">
              <label>Archive Name</label>
              <input class="input" id="archiveName" placeholder="my-archive.huff" />
            </div>
            <div class="field">
              <label>Password (optional)</label>
              <div class="input-group">
                <input class="input" id="passwordInput" type="password" placeholder="Encrypt with AES…" />
                <button class="toggle-eye" id="toggleEye" type="button"><i class="bi bi-eye"></i></button>
              </div>
            </div>
            <button class="btn btn-accent btn-block btn-glow" id="startCompress" disabled><i class="bi bi-lightning-charge-fill"></i> Compress Now</button>
          </div>

          <div class="glass-card">
            <h3 class="mb-4">Compression Info</h3>
            <div class="stat-inline"><span class="si-label">Files selected</span><span class="si-val" id="estFiles">0</span></div>
            <div class="stat-inline"><span class="si-label">Total size</span><span class="si-val" id="estSize">0 B</span></div>
            <div class="stat-inline"><span class="si-label">Est. ratio</span><span class="si-val" id="estRatio">0%</span></div>
            <div class="stat-inline"><span class="si-label">Est. compressed</span><span class="si-val" id="estCompressed">0 B</span></div>
            <div class="stat-inline"><span class="si-label">Est. saved</span><span class="si-val text-accent" id="estSaved">0%</span></div>
          </div>
        </div>
      </div>`;
  }

  function extract() {
    const encrypted = Store.get().archives.filter((a) => a.encrypted);
    return `
      ${sectionHead('Extract', 'Restore your original files from a HuffZip archive.', '')}
      <div class="two-col" style="grid-template-columns:1.6fr 1fr;align-items:start">
        <div class="glass-card">
          <div class="dropzone" id="extractZone">
            <input type="file" class="file-input" id="extractInput" accept=".huff,.hz,.zip" />
            <div class="dz-icon" style="background:var(--grad-accent)"><i class="bi bi-box-arrow-up"></i></div>
            <h3>Drop an archive to extract</h3>
            <p>Accepts .huff, .hz and .zip archives. Encrypted archives will ask for a password.</p>
            <button class="btn btn-accent" id="browseExtract"><i class="bi bi-folder2-open"></i> Select Archive</button>
          </div>
          <div class="selected-list" id="extractList"></div>
        </div>
        <div class="glass-card">
          <h3 class="mb-4">Your Archives</h3>
          <div class="list-clean">
            ${Store.get().archives.slice(0, 6).map((a) => `
              <div class="file-row" data-extract-archive="${a.id}">
                <div class="file-ico"><i class="bi ${iconForExt(a.ext)}"></i></div>
                <div class="file-info"><div class="file-name">${escapeHtml(a.name)}</div><div class="file-sub">${formatBytes(a.compressedSize)} · ${a.encrypted ? 'Encrypted' : 'Open'}</div></div>
                <button class="btn btn-sm btn-ghost" data-do-extract="${a.id}"><i class="bi bi-box-arrow-up"></i></button>
              </div>`).join('') || emptyInline('No archives', 'Compress a file first.')}
          </div>
          ${encrypted.length ? `<div class="mt-4"><span class="badge warn"><i class="bi bi-shield-lock"></i> ${encrypted.length} encrypted</span></div>` : ''}
        </div>
      </div>`;
  }

  function history() {
    const s = Store.get();
    const rows = s.archives.map((a) => `
      <tr data-row-archive="${a.id}">
        <td><div class="t-file"><i class="bi ${iconForExt(a.ext)}"></i>${escapeHtml(a.name)}</div></td>
        <td class="mono">${formatBytes(a.originalSize)}</td>
        <td class="mono">${formatBytes(a.compressedSize)}</td>
        <td><span class="badge success">${Math.round(a.ratio * 100)}%</span></td>
        <td>${formatDate(a.createdAt)}</td>
        <td>${a.encrypted ? '<span class="badge warn"><i class="bi bi-lock-fill"></i></span>' : '<span class="badge muted">—</span>'}</td>
        <td>
          <button class="icon-btn" style="width:30px;height:30px" data-action="download" data-id="${a.id}"><i class="bi bi-download"></i></button>
          <button class="icon-btn" style="width:30px;height:30px" data-action="menu" data-id="${a.id}"><i class="bi bi-three-dots"></i></button>
        </td>
      </tr>`).join('');

    return `
      ${sectionHead('History', 'Every archive you have created, searchable and manageable.',
        `<button class="btn btn-ghost" id="clearHistoryBtn"><i class="bi bi-trash3"></i> Clear</button>`)}
      <div class="glass-card">
        <div class="flex items-center justify-between mb-4 wrap gap-3">
          <div class="segmented" id="historyFilter">
            <button class="active" data-filter="all">All</button>
            <button data-filter="encrypted">Encrypted</button>
            <button data-filter="pinned">Pinned</button>
          </div>
          <div class="topbar-search" style="max-width:260px;margin:0">
            <i class="bi bi-search"></i><input id="historySearch" placeholder="Search archives…" />
          </div>
        </div>
        ${s.archives.length ? `<div class="table-wrap"><table class="data" id="historyTable">
          <thead><tr><th>File</th><th>Original</th><th>Compressed</th><th>Ratio</th><th>Date</th><th>Secure</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>` : emptyState('bi-clock-history', 'No history yet', 'Compressed archives will appear here.', 'compress', 'Compress a file')}
      </div>`;
  }

  function reports() {
    const s = Store.get();
    const cards = s.reports.slice(0, 8).map((r) => `
      <div class="glass-card hover-lift" style="padding:20px">
        <div class="flex items-center gap-3 mb-4">
          <div class="file-ico"><i class="bi ${iconForExt(fileExt(r.fileName))}"></i></div>
          <div class="flex-1"><div class="file-name">${escapeHtml(r.fileName)}</div><div class="file-sub">${formatDate(r.createdAt)} · ${formatTime(r.createdAt)}</div></div>
          <span class="badge success">${Math.round(r.ratio * 100)}%</span>
        </div>
        <div class="stat-inline"><span class="si-label">Original</span><span class="si-val">${formatBytes(r.originalSize)}</span></div>
        <div class="stat-inline"><span class="si-label">Compressed</span><span class="si-val">${formatBytes(r.compressedSize)}</span></div>
        <div class="stat-inline"><span class="si-label">Time</span><span class="si-val">${r.timeMs} ms</span></div>
        <button class="btn btn-sm btn-ghost btn-block mt-4" data-export-report="${r.id}"><i class="bi bi-file-earmark-text"></i> Export TXT</button>
      </div>`).join('');

    return `
      ${sectionHead('Reports', 'Detailed compression reports, exportable as TXT.',
        `<button class="btn btn-primary" id="exportAllReports"><i class="bi bi-download"></i> Export All</button>`)}
      ${s.reports.length ? `<div class="stat-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${cards}</div>`
        : emptyState('bi-file-earmark-bar-graph', 'No reports', 'Compress files to generate reports.', 'compress', 'Start compressing')}`;
  }

  function settings() {
    const st = Store.settings();
    return `
      ${sectionHead('Settings', 'Tune HuffZip to match how you work.', '')}
      <div class="two-col" style="align-items:start">
        <div class="card-stack">
          <div class="glass-card">
            <h3 class="mb-4">Compression</h3>
            <div class="field">
              <label>Default Level</label>
              <div class="segmented w-full" id="setLevel" style="display:flex">
                <button data-level="fast" class="${st.level === 'fast' ? 'active' : ''}" style="flex:1">Fast</button>
                <button data-level="balanced" class="${st.level === 'balanced' ? 'active' : ''}" style="flex:1">Balanced</button>
                <button data-level="maximum" class="${st.level === 'maximum' ? 'active' : ''}" style="flex:1">Maximum</button>
              </div>
            </div>
            <div class="field">
              <label>Default Output Folder</label>
              <input class="input" id="setOutput" value="${escapeHtml(st.outputFolder)}" />
            </div>
          </div>
          <div class="glass-card">
            <h3 class="mb-4">Appearance</h3>
            <div class="stat-inline"><span class="si-label">Theme</span>
              <div class="segmented" id="setTheme">
                <button data-theme="dark" class="${st.theme === 'dark' ? 'active' : ''}">Dark</button>
                <button data-theme="light" class="${st.theme === 'light' ? 'active' : ''}">Light</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-stack">
          <div class="glass-card">
            <h3 class="mb-4">Automation</h3>
            ${toggleRow('Auto overwrite existing files', 'autoOverwrite', st.autoOverwrite)}
            ${toggleRow('Auto delete temporary files', 'autoDeleteTemp', st.autoDeleteTemp)}
            ${toggleRow('Enable notifications', 'notifications', st.notifications)}
          </div>
          <div class="glass-card">
            <h3 class="mb-4">Data</h3>
            <p class="mb-4">Clear stored history and reset statistics. This cannot be undone.</p>
            <button class="btn btn-danger btn-block" id="resetData"><i class="bi bi-arrow-counterclockwise"></i> Reset All Data</button>
          </div>
        </div>
      </div>`;
  }

  function toggleRow(label, key, checked) {
    return `<div class="stat-inline"><span class="si-label">${label}</span>
      <label class="switch"><input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''}><span class="slider"></span></label></div>`;
  }

  function about() {
    return `
      ${sectionHead('About', 'The story and tech behind HuffZip.', '')}
      <div class="two-col" style="grid-template-columns:1.4fr 1fr;align-items:start">
        <div class="glass-card gradient-border">
          <div class="flex items-center gap-4 mb-4">
            <div class="brand-logo" style="width:60px;height:60px;font-size:1.8rem"><i class="bi bi-file-zip-fill"></i></div>
            <div><h2 style="margin:0">HuffZip</h2><p>Smart File Compression Utility · v1.0.0</p></div>
          </div>
          <p class="mb-4">HuffZip is a modern file compression workspace built on classic <strong>Huffman coding</strong>. It brings a premium, WinRAR-style experience to the browser and desktop — compress, extract, encrypt, and track everything from one polished dashboard.</p>
          <div class="pill-group mb-4">
            <span class="badge info"><i class="bi bi-filetype-html"></i> HTML5</span>
            <span class="badge info"><i class="bi bi-filetype-css"></i> CSS3</span>
            <span class="badge info"><i class="bi bi-filetype-js"></i> Vanilla JS</span>
            <span class="badge success"><i class="bi bi-cup-hot-fill"></i> Java + Spring Boot</span>
          </div>
          <div class="three-col">
            ${aboutStat('bi-lightning-charge-fill', 'Fast', 'Huffman engine')}
            ${aboutStat('bi-shield-lock-fill', 'Secure', 'AES + checksum')}
            ${aboutStat('bi-phone-fill', 'Responsive', 'Any device')}
          </div>
        </div>
        <div class="card-stack">
          <div class="glass-card">
            <h3 class="mb-4">Keyboard Shortcuts</h3>
            ${kbdRow('Focus search', ['/'])}
            ${kbdRow('New compression', ['C'])}
            ${kbdRow('Go to extract', ['E'])}
            ${kbdRow('Toggle theme', ['T'])}
            ${kbdRow('Close dialog', ['Esc'])}
          </div>
          <div class="glass-card">
            <h3 class="mb-4">Author</h3>
            <div class="flex items-center gap-3">
              <span class="avatar" style="width:44px;height:44px;font-size:1rem">AL</span>
              <div><div class="fw-700">Aryan Lade</div><div class="text-dim fs-sm">CS Student · Developer</div></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function aboutStat(icon, title, sub) {
    return `<div class="text-center" style="padding:12px;background:var(--card);border-radius:var(--r-md);border:1px solid var(--border)">
      <i class="bi ${icon}" style="font-size:1.4rem;color:var(--primary)"></i>
      <div class="fw-700 mt-2">${title}</div><div class="text-dim" style="font-size:.72rem">${sub}</div></div>`;
  }
  function kbdRow(label, keys) {
    return `<div class="kbd-row"><span class="text-muted fs-sm">${label}</span><div class="kbd-combo">${keys.map((k) => `<kbd>${k}</kbd>`).join('')}</div></div>`;
  }

  function emptyState(icon, title, sub, nav, cta) {
    return `<div class="empty-state">
      <div class="es-illus"><i class="bi ${icon}"></i></div>
      <h3>${title}</h3><p>${sub}</p>
      ${nav ? `<button class="btn btn-primary" data-nav="${nav}"><i class="bi bi-arrow-right"></i> ${cta}</button>` : ''}
    </div>`;
  }

  return { dashboard, compress, extract, history, reports, settings, about, fileRow, ratioRing };
})();
