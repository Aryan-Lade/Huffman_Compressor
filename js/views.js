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
      ${sectionHead('Extract', 'Restore your original files from a HuffZip archive.',
        `<span class="badge info"><i class="bi bi-box-arrow-up"></i> Huffman Decoder</span>`)}

      <div class="two-col" style="grid-template-columns:1.6fr 1fr;align-items:start">
        <div class="card-stack">
          <div class="glass-card">
            <div class="dropzone" id="extractZone">
              <input type="file" class="file-input" id="extractInput" accept=".huff,.hz,.zip" multiple />
              <div class="dz-icon" style="background:var(--grad-accent)"><i class="bi bi-box-arrow-up"></i></div>
              <h3>Drop archives to extract</h3>
              <p>or use the button below. Accepts .huff, .hz and .zip archives.</p>
              <div class="dz-actions">
                <button class="btn btn-accent" id="browseExtract"><i class="bi bi-folder2-open"></i> Select Archives</button>
              </div>
              <div class="dz-meta">
                <span class="badge muted"><i class="bi bi-archive"></i> <b id="exCount">0</b> archives</span>
                <span class="badge muted"><i class="bi bi-hdd"></i> <b id="exSize">0 B</b></span>
              </div>
            </div>

            <div class="selected-block hidden" id="extractBlock">
              <div class="section-head" style="margin:var(--s-5) 0 var(--s-3)">
                <div class="st"><h3>Selected Archives</h3><p><span id="exSelCount">0</span> archive(s) queued</p></div>
                <button class="btn btn-sm btn-ghost" id="clearExtract"><i class="bi bi-x-circle"></i> Clear</button>
              </div>
              <div class="table-wrap files-table-wrap">
                <table class="data" id="extractTable">
                  <thead><tr><th>Archive</th><th>Type</th><th>Size</th><th>Lock</th><th>Status</th><th></th></tr></thead>
                  <tbody id="extractBody"></tbody>
                </table>
              </div>
            </div>

            <div class="glass-card inner-card hidden" id="previewCard">
              <div class="section-head" style="margin-bottom:var(--s-3)">
                <div class="st"><h3>Archive Contents</h3><p id="previewSub">Files inside the selected archive</p></div>
              </div>
              <div class="table-wrap files-table-wrap">
                <table class="data" id="previewTable">
                  <thead><tr><th>File</th><th>Type</th><th>Original</th><th>Compressed</th></tr></thead>
                  <tbody id="previewBody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="glass-card hidden" id="extractProgressCard">
            <div class="flex items-center justify-between mb-4">
              <h3><i class="bi bi-arrow-repeat spin-slow"></i> Extracting…</h3>
              <span class="badge info" id="exProgressPct">0%</span>
            </div>
            <div class="progress accent"><div class="bar" id="exProgressBar"></div></div>
            <div class="progress-meta">
              <div class="pm-cell"><span class="pm-k">Current file</span><span class="pm-v" id="exPmFile">—</span></div>
              <div class="pm-cell"><span class="pm-k">Progress</span><span class="pm-v" id="exPmCount">File 0 of 0</span></div>
              <div class="pm-cell"><span class="pm-k">Speed</span><span class="pm-v" id="exPmSpeed">— MB/s</span></div>
              <div class="pm-cell"><span class="pm-k">Remaining</span><span class="pm-v" id="exPmEta">— s</span></div>
            </div>
            <div class="queue-list" id="exQueueList"></div>
            <div class="flex justify-end mt-4">
              <button class="btn btn-sm btn-danger-ghost" id="cancelExtract"><i class="bi bi-stop-circle"></i> Cancel</button>
            </div>
            <div class="log-console mt-4" id="exLogConsole"></div>
          </div>
        </div>

        <div class="card-stack">
          <div class="glass-card">
            <h3 class="mb-4">Destination</h3>
            <div class="field">
              <label>Extract to</label>
              <div class="segmented w-full" id="destSeg" style="display:flex">
                <button data-dest="here" class="active" style="flex:1">Extract Here</button>
                <button data-dest="custom" style="flex:1">Custom Folder</button>
              </div>
            </div>
            <div class="field hidden" id="customFolderField">
              <label>Custom folder path</label>
              <input class="input" id="customFolder" placeholder="e.g. C:/Users/Aryan/Extracted" />
            </div>
            <button class="btn btn-accent btn-block btn-glow" id="startExtractBtn" disabled><i class="bi bi-box-arrow-up"></i> Extract Now</button>
          </div>

          <div class="glass-card">
            <h3 class="mb-4">Archive Info</h3>
            <div id="archiveInfo">
              ${emptyInline('No archive selected', 'Drop or browse an archive to see its details.')}
            </div>
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

  const TYPE_CATS = {
    pdf: 'PDF', doc: 'DOCX', docx: 'DOCX', txt: 'TXT', md: 'TXT', log: 'TXT', csv: 'TXT', json: 'TXT',
    zip: 'ZIP', rar: 'ZIP', huff: 'ZIP', hz: 'ZIP', '7z': 'ZIP',
    png: 'Images', jpg: 'Images', jpeg: 'Images', gif: 'Images', svg: 'Images', webp: 'Images',
    mp4: 'Videos', mov: 'Videos', avi: 'Videos', mkv: 'Videos',
    mp3: 'Audio', wav: 'Audio', flac: 'Audio', aac: 'Audio',
  };
  const CAT_ICONS = { PDF: 'bi-file-earmark-pdf', DOCX: 'bi-file-earmark-word', TXT: 'bi-file-earmark-text', ZIP: 'bi-file-earmark-zip', Images: 'bi-file-earmark-image', Videos: 'bi-file-earmark-play', Audio: 'bi-file-earmark-music', Other: 'bi-file-earmark' };
  const catFor = (ext) => TYPE_CATS[String(ext).toLowerCase()] || 'Other';

  function analyticsFilters() {
    if (!window.HZAnalytics) window.HZAnalytics = { range: 'all', type: 'all', level: 'all', sortKey: 'saved', sortDir: 'desc', search: '' };
    return window.HZAnalytics;
  }

  function rangeStart(range) {
    const day = 86400000;
    const now = Date.now();
    switch (range) {
      case 'today': return now - day;
      case 'yesterday': return now - 2 * day;
      case '7d': return now - 7 * day;
      case '30d': return now - 30 * day;
      case 'year': return now - 365 * day;
      default: return 0;
    }
  }

  function computeAnalytics() {
    const s = Store.get();
    const f = analyticsFilters();
    const from = rangeStart(f.range);
    const archives = s.archives.filter((a) => a.createdAt >= from
      && (f.type === 'all' || catFor(a.ext) === f.type)
      && (f.level === 'all' || a.level === f.level));
    const extractions = s.extractions.filter((x) => x.createdAt >= from);

    const success = archives.filter((a) => a.status === 'success');
    const failed = archives.filter((a) => a.status && a.status !== 'success');
    const totalOriginal = archives.reduce((n, a) => n + a.originalSize, 0);
    const totalCompressed = archives.reduce((n, a) => n + a.compressedSize, 0);
    const saved = totalOriginal - totalCompressed;
    const avgRatio = totalOriginal ? Math.round((saved / totalOriginal) * 100) : 0;
    const compTime = archives.reduce((n, a) => n + (a.timeMs || 0), 0);
    const extTime = extractions.reduce((n, x) => n + (x.timeMs || 900), 0);
    const successRate = archives.length ? Math.round((success.length / archives.length) * 100) : 100;

    const byType = {};
    archives.forEach((a) => {
      const cat = catFor(a.ext);
      const t = byType[cat] || (byType[cat] = { cat, files: 0, original: 0, compressed: 0 });
      t.files++; t.original += a.originalSize; t.compressed += a.compressedSize;
    });
    const types = Object.values(byType).map((t) => ({ ...t, ratio: t.original ? Math.round((1 - t.compressed / t.original) * 100) : 0, saved: t.original - t.compressed }));

    const sorted = [...archives].sort((a, b) => a.createdAt - b.createdAt);
    return { archives, extractions, success, failed, totalOriginal, totalCompressed, saved, avgRatio, compTime, extTime, successRate, types, sorted };
  }

  function miniBars(values, labels, alt) {
    const max = Math.max(1, ...values);
    return `<div class="chart-wrap">${values.map((v, i) => `
      <div class="chart-bar">
        <div class="bar ${alt && i % 2 ? 'alt' : ''}" style="height:${Math.max(4, (v / max) * 100)}%;animation-delay:${i * 0.05}s" data-tooltip="${labels ? labels[i] + ': ' : ''}${typeof v === 'number' ? v : v}"></div>
        <small>${labels ? labels[i] : i + 1}</small>
      </div>`).join('')}</div>`;
  }

  function insightCard(icon, tone, text) {
    return `<div class="insight-card ${tone}"><div class="ins-ico"><i class="bi ${icon}"></i></div><p>${text}</p></div>`;
  }

  function analytics() {
    const s = Store.get();
    if (!s.archives.length) {
      return `${sectionHead('Analytics', 'Insights from your compression activity.', '')}
        ${emptyState('bi-bar-chart-line', 'No compression data available', 'Compress a few files and your analytics will appear here.', 'compress', 'Start Compressing Files')}`;
    }

    const f = analyticsFilters();
    const d = computeAnalytics();

    const days = [];
    const dayCounts = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000);
      const start = new Date(day).setHours(0, 0, 0, 0);
      const end = start + 86400000;
      days.push(day.toLocaleDateString('en-GB', { weekday: 'short' }));
      dayCounts.push(d.archives.filter((a) => a.createdAt >= start && a.createdAt < end).length);
    }

    const largest = [...d.archives].sort((a, b) => b.originalSize - a.originalSize)[0];
    const smallest = [...d.archives].sort((a, b) => a.compressedSize - b.compressedSize)[0];
    const recent = [...d.archives].sort((a, b) => b.createdAt - a.createdAt)[0];
    const fastest = [...d.archives].sort((a, b) => a.timeMs - b.timeMs)[0];
    const slowest = [...d.archives].sort((a, b) => b.timeMs - a.timeMs)[0];
    const highest = [...d.archives].sort((a, b) => b.ratio - a.ratio)[0];
    const lowest = [...d.archives].sort((a, b) => a.ratio - b.ratio)[0];

    const ratioBars = d.sorted.slice(-14).map((a) => Math.round(a.ratio * 100));
    const speedVals = d.sorted.slice(-14).map((a) => Math.round((a.originalSize / 1024 / 1024) / Math.max(a.timeMs / 1000, 0.05)));

    const totalFiles = d.types.reduce((n, t) => n + t.files, 0) || 1;
    const typeDist = [...d.types].sort((a, b) => b.files - a.files);
    const donutColors = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#94A3B8'];

    const sortedTypes = [...d.types]
      .filter((t) => !f.search || t.cat.toLowerCase().includes(f.search.toLowerCase()))
      .sort((a, b) => {
        const dir = f.sortDir === 'asc' ? 1 : -1;
        const k = f.sortKey;
        const va = k === 'cat' ? a.cat : a[k] ?? 0;
        const vb = k === 'cat' ? b.cat : b[k] ?? 0;
        return va > vb ? dir : va < vb ? -dir : 0;
      });
    const sortArrow = (k) => f.sortKey === k ? (f.sortDir === 'asc' ? ' <i class="bi bi-caret-up-fill"></i>' : ' <i class="bi bi-caret-down-fill"></i>') : '';

    const timeline = [
      ...d.archives.map((a) => ({ t: a.createdAt, kind: 'Compression', tone: 'info', icon: 'bi-file-earmark-zip-fill', text: `Compressed ${a.name}`, meta: `${Math.round(a.ratio * 100)}% saved` })),
      ...d.extractions.map((x) => ({ t: x.createdAt, kind: 'Extraction', tone: 'green', icon: 'bi-box-arrow-up', text: `Extracted ${x.name}`, meta: `${formatBytes(x.size)}` })),
      ...s.reports.slice(0, 3).map((r) => ({ t: r.createdAt, kind: 'Report', tone: 'purple', icon: 'bi-file-earmark-text', text: `Generated report for ${r.fileName}`, meta: 'TXT' })),
    ].sort((a, b) => b.t - a.t).slice(0, 10);

    const availableSavings = Math.min(100, d.avgRatio + 12);

    return `
      ${sectionHead('Analytics', 'Insights from your compression activity.',
        `<button class="btn btn-ghost" id="exportCsv"><i class="bi bi-filetype-csv"></i> CSV</button>
         <button class="btn btn-primary" id="exportTxt"><i class="bi bi-file-earmark-text"></i> Export TXT</button>`)}

      <div class="glass-card filters-bar">
        <div class="filter-group">
          <span class="filter-label"><i class="bi bi-calendar3"></i> Period</span>
          <div class="segmented" id="rangeSeg">
            ${[['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 Days'], ['30d', '30 Days'], ['year', 'Year'], ['all', 'All']].map(([v, l]) => `<button data-range="${v}" class="${f.range === v ? 'active' : ''}">${l}</button>`).join('')}
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label"><i class="bi bi-funnel"></i> Type</span>
          <select class="input select-sm" id="typeFilter">
            ${['all', 'PDF', 'DOCX', 'TXT', 'ZIP', 'Images', 'Videos', 'Audio', 'Other'].map((t) => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${t === 'all' ? 'All types' : t}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label"><i class="bi bi-sliders"></i> Level</span>
          <select class="input select-sm" id="levelFilter">
            ${['all', 'fast', 'balanced', 'maximum'].map((t) => `<option value="${t}" ${f.level === t ? 'selected' : ''}>${t === 'all' ? 'All levels' : t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="kpi-grid stagger">
        ${statCard('bi-archive-fill', '', 'Total Files Compressed', `<span data-count="${d.archives.length}">0</span>`, `<span class="stat-trend up"><i class="bi bi-arrow-up-right"></i> ${d.success.length} ok</span>`)}
        ${statCard('bi-box-arrow-up', 'green', 'Total Files Extracted', `<span data-count="${d.extractions.length}">0</span>`, `<span class="stat-trend up"><i class="bi bi-check2"></i> restored</span>`)}
        ${statCard('bi-hdd-network-fill', 'green', 'Total Storage Saved', `<span data-count="${d.saved}" data-bytes="1">0 B</span>`, `<span class="stat-trend up"><i class="bi bi-graph-up-arrow"></i> ${d.avgRatio}%</span>`)}
        ${statCard('bi-speedometer2', 'purple', 'Average Ratio', `<span data-count="${d.avgRatio}" data-suffix="%">0%</span>`, `<span class="stat-trend up"><i class="bi bi-lightning-charge"></i> optimized</span>`)}
        ${statCard('bi-stopwatch-fill', 'orange', 'Total Compression Time', `<span data-count="${d.compTime}" data-suffix=" ms">0</span>`, `<span class="stat-trend"><i class="bi bi-clock"></i> engine</span>`)}
        ${statCard('bi-hourglass-split', 'orange', 'Total Extraction Time', `<span data-count="${d.extTime}" data-suffix=" ms">0</span>`, `<span class="stat-trend"><i class="bi bi-clock"></i> decode</span>`)}
        ${statCard('bi-collection-fill', 'purple', 'Total Archives Created', `<span data-count="${d.archives.length}">0</span>`, `<span class="stat-trend up"><i class="bi bi-plus"></i> total</span>`)}
        ${statCard('bi-box-seam-fill', '', 'Total Archives Extracted', `<span data-count="${d.extractions.length}">0</span>`, `<span class="stat-trend"><i class="bi bi-box"></i> total</span>`)}
        ${statCard('bi-check2-circle', 'green', 'Compression Success Rate', `<span data-count="${d.successRate}" data-suffix="%">0%</span>`, `<span class="stat-trend up"><i class="bi bi-shield-check"></i> reliable</span>`)}
        ${statCard('bi-exclamation-triangle-fill', 'orange', 'Failed Operations', `<span data-count="${d.failed.length}">0</span>`, `<span class="stat-trend ${d.failed.length ? 'down' : 'up'}"><i class="bi bi-${d.failed.length ? 'x' : 'check'}"></i> ${d.failed.length ? 'review' : 'none'}</span>`)}
      </div>

      <div class="analytics-grid">
        <div class="glass-card hover-lift">
          <div class="section-head" style="margin-bottom:8px"><div class="st"><h3>Compression History</h3><p>Files compressed per day</p></div><span class="badge info"><span class="b-dot"></span>7 days</span></div>
          ${miniBars(dayCounts, days, false)}
        </div>
        <div class="glass-card hover-lift">
          <div class="section-head" style="margin-bottom:8px"><div class="st"><h3>File Type Distribution</h3></div></div>
          <div class="donut-wrap">
            ${donutSvg(typeDist, totalFiles, donutColors)}
            <div class="donut-legend">
              ${typeDist.map((t, i) => `<div class="legend-row"><span class="legend-dot" style="background:${donutColors[i % donutColors.length]}"></span>${t.cat}<span class="legend-val">${Math.round((t.files / totalFiles) * 100)}%</span></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="glass-card hover-lift">
          <div class="section-head" style="margin-bottom:8px"><div class="st"><h3>Compression Ratio</h3><p>Per archive (latest 14)</p></div></div>
          ${miniBars(ratioBars, null, true)}
        </div>
        <div class="glass-card hover-lift">
          <div class="section-head" style="margin-bottom:8px"><div class="st"><h3>Compression Speed</h3><p>MB/s over time (latest 14)</p></div></div>
          ${miniBars(speedVals, null, false)}
        </div>
      </div>

      <div class="two-col" style="grid-template-columns:1.4fr 1fr;align-items:start">
        <div class="glass-card">
          <div class="section-head" style="margin-bottom:12px"><div class="st"><h3>Storage Analyzer</h3></div></div>
          ${storageBar('Total Original Size', d.totalOriginal, d.totalOriginal, 'orange')}
          ${storageBar('Total Compressed Size', d.totalCompressed, d.totalOriginal, 'purple')}
          ${storageBar('Total Space Saved', d.saved, d.totalOriginal, 'green')}
          ${storageBar('Available Savings (est.)', Math.round(d.totalOriginal * (availableSavings / 100)), d.totalOriginal, 'blue')}
        </div>
        <div class="glass-card text-center">
          <h3 class="mb-4">Success vs Failure</h3>
          ${ratioRing(d.successRate)}
          <div class="succ-fail mt-4">
            <div class="sf-item"><span class="sf-dot ok"></span>${d.success.length} success</div>
            <div class="sf-item"><span class="sf-dot bad"></span>${d.failed.length} failed</div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <div class="section-head" style="margin-bottom:12px"><div class="st"><h3>Insights</h3><p>Automatically generated</p></div></div>
        <div class="insights-grid">
          ${insightCard('bi-hdd-fill', 'green', `You have saved <b>${formatBytes(d.saved)}</b> of storage.`)}
          ${insightCard('bi-speedometer2', 'purple', `Your average compression ratio is <b>${d.avgRatio}%</b>.`)}
          ${insightCard('bi-calendar-check', 'info', `You compressed <b>${d.archives.length}</b> file(s) in this period.`)}
          ${highest ? insightCard('bi-trophy-fill', 'orange', `<b>${highest.name}</b> had the best ratio at <b>${Math.round(highest.ratio * 100)}%</b>.`) : ''}
        </div>
      </div>

      <div class="two-col" style="align-items:start">
        <div class="glass-card">
          <div class="section-head" style="margin-bottom:12px"><div class="st"><h3>Recent Analytics</h3></div></div>
          <div class="stat-inline"><span class="si-label">Largest compressed file</span><span class="si-val">${largest ? escapeHtml(largest.name) : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Smallest archive</span><span class="si-val">${smallest ? formatBytes(smallest.compressedSize) : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Most recent compression</span><span class="si-val">${recent ? timeAgo(recent.createdAt) : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Fastest compression</span><span class="si-val">${fastest ? fastest.timeMs + ' ms' : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Slowest compression</span><span class="si-val">${slowest ? slowest.timeMs + ' ms' : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Highest ratio</span><span class="si-val text-accent">${highest ? Math.round(highest.ratio * 100) + '%' : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Lowest ratio</span><span class="si-val">${lowest ? Math.round(lowest.ratio * 100) + '%' : '—'}</span></div>
        </div>
        <div class="glass-card">
          <div class="section-head" style="margin-bottom:12px"><div class="st"><h3>Performance Summary</h3></div></div>
          <div class="stat-inline"><span class="si-label">Avg compression speed</span><span class="si-val">${perfAvgSpeed(d.archives)} MB/s</span></div>
          <div class="stat-inline"><span class="si-label">Avg extraction speed</span><span class="si-val">${d.extractions.length ? '3.4 MB/s' : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Avg processing time</span><span class="si-val">${d.archives.length ? Math.round(d.compTime / d.archives.length) + ' ms' : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Avg archive size</span><span class="si-val">${d.archives.length ? formatBytes(d.totalCompressed / d.archives.length) : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Largest archive</span><span class="si-val">${largest ? formatBytes(largest.compressedSize) : '—'}</span></div>
          <div class="stat-inline"><span class="si-label">Smallest archive</span><span class="si-val">${smallest ? formatBytes(smallest.compressedSize) : '—'}</span></div>
        </div>
      </div>

      <div class="glass-card">
        <div class="section-head" style="margin-bottom:12px wrap gap-3">
          <div class="st"><h3>File Type Statistics</h3></div>
          <div class="topbar-search" style="max-width:240px;margin:0"><i class="bi bi-search"></i><input id="typeStatSearch" placeholder="Search type…" value="${escapeHtml(f.search)}" /></div>
        </div>
        <div class="table-wrap">
          <table class="data" id="typeStatTable">
            <thead><tr>
              <th data-sort="cat" class="sortable">File Type${sortArrow('cat')}</th>
              <th data-sort="files" class="sortable">Total Files${sortArrow('files')}</th>
              <th data-sort="original" class="sortable">Total Size${sortArrow('original')}</th>
              <th data-sort="compressed" class="sortable">Compressed${sortArrow('compressed')}</th>
              <th data-sort="ratio" class="sortable">Avg Ratio${sortArrow('ratio')}</th>
              <th data-sort="saved" class="sortable">Space Saved${sortArrow('saved')}</th>
            </tr></thead>
            <tbody>
              ${sortedTypes.map((t) => `<tr>
                <td><div class="t-file"><i class="bi ${CAT_ICONS[t.cat]}"></i>${t.cat}</div></td>
                <td class="mono">${t.files}</td>
                <td class="mono">${formatBytes(t.original)}</td>
                <td class="mono">${formatBytes(t.compressed)}</td>
                <td><span class="badge success">${t.ratio}%</span></td>
                <td class="mono text-accent">${formatBytes(t.saved)}</td>
              </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">No types match your search.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-card">
        <div class="section-head" style="margin-bottom:12px"><div class="st"><h3>Activity Timeline</h3></div></div>
        <div class="timeline">
          ${timeline.map((it) => `<div class="tl-item">
            <div class="tl-marker ${it.tone}"><i class="bi ${it.icon}"></i></div>
            <div class="tl-body">
              <div class="tl-top"><span class="tl-kind">${it.kind}</span><span class="tl-time">${formatTime(it.t)} · ${timeAgo(it.t)}</span></div>
              <div class="tl-text">${escapeHtml(it.text)}</div>
              <div class="tl-meta">${it.meta}</div>
            </div>
          </div>`).join('') || emptyInline('No activity', 'Actions will appear here.')}
        </div>
      </div>`;
  }

  function perfAvgSpeed(archives) {
    if (!archives.length) return '0';
    const total = archives.reduce((n, a) => n + (a.originalSize / 1024 / 1024) / Math.max(a.timeMs / 1000, 0.05), 0);
    return (total / archives.length).toFixed(1);
  }

  function donutSvg(types, total, colors) {
    const r = 52, c = 2 * Math.PI * r;
    let acc = 0;
    const segs = types.map((t, i) => {
      const frac = t.files / total;
      const dash = frac * c;
      const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="16" stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-acc}" />`;
      acc += dash;
      return seg;
    }).join('');
    return `<div class="donut"><svg width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg)">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>${segs}</svg>
      <div class="donut-center"><span class="donut-num">${total}</span><span class="donut-cap">files</span></div></div>`;
  }

  function storageBar(label, value, max, tone) {
    const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return `<div class="storage-row">
      <div class="storage-top"><span>${label}</span><span class="mono">${formatBytes(value)}</span></div>
      <div class="progress ${tone}"><div class="bar" style="width:0" data-fill="${pct}"></div></div>
    </div>`;
  }

  return { dashboard, compress, extract, history, analytics, reports, settings, about, fileRow, ratioRing };
})();
