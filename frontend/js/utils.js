const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv));
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0 || bytes == null) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
};

const uid = () => 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fileExt = (name) => {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const iconForExt = (ext) => {
  const map = {
    pdf: 'bi-file-earmark-pdf', doc: 'bi-file-earmark-word', docx: 'bi-file-earmark-word',
    xls: 'bi-file-earmark-excel', xlsx: 'bi-file-earmark-excel', ppt: 'bi-file-earmark-ppt', pptx: 'bi-file-earmark-ppt',
    png: 'bi-file-earmark-image', jpg: 'bi-file-earmark-image', jpeg: 'bi-file-earmark-image', gif: 'bi-file-earmark-image', svg: 'bi-file-earmark-image', webp: 'bi-file-earmark-image',
    mp3: 'bi-file-earmark-music', wav: 'bi-file-earmark-music', flac: 'bi-file-earmark-music',
    mp4: 'bi-file-earmark-play', mov: 'bi-file-earmark-play', avi: 'bi-file-earmark-play', mkv: 'bi-file-earmark-play',
    zip: 'bi-file-earmark-zip', rar: 'bi-file-earmark-zip', huff: 'bi-file-earmark-zip', hz: 'bi-file-earmark-zip',
    txt: 'bi-file-earmark-text', md: 'bi-file-earmark-text', log: 'bi-file-earmark-text', csv: 'bi-file-earmark-spreadsheet',
    js: 'bi-file-earmark-code', ts: 'bi-file-earmark-code', java: 'bi-file-earmark-code', py: 'bi-file-earmark-code', html: 'bi-file-earmark-code', css: 'bi-file-earmark-code', json: 'bi-file-earmark-code',
  };
  return map[ext] || 'bi-file-earmark';
};

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const download = (filename, content, mime = 'text/plain') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const simpleChecksum = (str) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};
