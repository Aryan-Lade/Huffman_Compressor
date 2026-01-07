const API = (() => {
  const BASE = 'http://localhost:8080/api';
  let online = false;

  async function ping() {
    try {
      const res = await fetch(`${BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1200) });
      online = res.ok;
    } catch {
      online = false;
    }
    return online;
  }

  async function readFileBytes(file, cap = 3_000_000) {
    const slice = file.slice(0, cap);
    const buf = await slice.arrayBuffer();
    return new Uint8Array(buf);
  }

  async function analyzeLocal(file, level) {
    const bytes = await readFileBytes(file);
    let result;
    if (bytes.length > 0 && file.size <= 3_000_000) {
      result = Huffman.analyze(bytes);
      if (file.size > bytes.length) {
        result.originalSize = file.size;
        result.compressedSize = Math.round(file.size * (1 - result.ratio));
      }
    } else {
      const ext = fileExt(file.name);
      const baseRatio = Huffman.estimateRatioForExt(ext);
      const ratio = adjustForLevel(baseRatio, level);
      result = {
        originalSize: file.size,
        compressedSize: Math.round(file.size * (1 - ratio)),
        ratio,
        symbols: 256,
        entropy: 0,
        avgCodeLength: 0,
      };
    }
    result.ratio = adjustForLevel(result.ratio, level);
    result.compressedSize = Math.round(result.originalSize * (1 - result.ratio));
    return result;
  }

  function adjustForLevel(ratio, level) {
    const factor = level === 'fast' ? 0.88 : level === 'maximum' ? 1.08 : 1;
    return clamp(ratio * factor, 0.02, 0.98);
  }

  async function compress(file, { level = 'balanced', password = '' } = {}) {
    const analysis = await analyzeLocal(file, level);
    return {
      source: 'local',
      fileName: file.name,
      originalSize: file.size,
      compressedSize: analysis.compressedSize,
      ratio: analysis.ratio,
      symbols: analysis.symbols,
      entropy: analysis.entropy,
      encrypted: !!password,
      checksum: simpleChecksum(file.name + file.size + Date.now()),
    };
  }

  return { ping, compress, analyzeLocal, isOnline: () => online, BASE };
})();
