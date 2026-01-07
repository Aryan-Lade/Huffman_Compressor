const Huffman = (() => {
  class Node {
    constructor(byte, freq, left = null, right = null) {
      this.byte = byte;
      this.freq = freq;
      this.left = left;
      this.right = right;
    }
    get isLeaf() { return this.left === null && this.right === null; }
  }

  function buildFrequency(bytes) {
    const freq = new Map();
    for (const b of bytes) freq.set(b, (freq.get(b) || 0) + 1);
    return freq;
  }

  function buildTree(freq) {
    const nodes = [...freq.entries()].map(([byte, f]) => new Node(byte, f));
    if (nodes.length === 1) {
      const only = nodes[0];
      return new Node(null, only.freq, only, null);
    }
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.freq - b.freq || (a.byte ?? -1) - (b.byte ?? -1));
      const left = nodes.shift();
      const right = nodes.shift();
      nodes.push(new Node(null, left.freq + right.freq, left, right));
    }
    return nodes[0] || null;
  }

  function buildCodes(root) {
    const codes = {};
    if (!root) return codes;
    const walk = (node, prefix) => {
      if (node.isLeaf) { codes[node.byte] = prefix || '0'; return; }
      if (node.left) walk(node.left, prefix + '0');
      if (node.right) walk(node.right, prefix + '1');
    };
    walk(root, '');
    return codes;
  }

  function encode(bytes) {
    const freq = buildFrequency(bytes);
    const tree = buildTree(freq);
    const codes = buildCodes(tree);
    let bitLength = 0;
    for (const b of bytes) bitLength += codes[b].length;
    const encodedBytes = Math.ceil(bitLength / 8);
    const tableBytes = freq.size * 5 + 8;
    const compressedSize = encodedBytes + tableBytes;
    return { codes, freq, originalSize: bytes.length, compressedSize, bitLength, symbols: freq.size };
  }

  function analyze(bytes) {
    if (!bytes || bytes.length === 0) {
      return { originalSize: 0, compressedSize: 0, ratio: 0, symbols: 0, entropy: 0, avgCodeLength: 0 };
    }
    const result = encode(bytes);
    const overheadFloor = Math.max(result.compressedSize, Math.round(result.originalSize * 0.02) + 12);
    const compressedSize = Math.min(overheadFloor, result.originalSize);
    const ratio = 1 - compressedSize / result.originalSize;

    let entropy = 0;
    for (const f of result.freq.values()) {
      const p = f / result.originalSize;
      entropy -= p * Math.log2(p);
    }
    const avgCodeLength = result.bitLength / result.originalSize;

    return {
      originalSize: result.originalSize,
      compressedSize,
      ratio: clamp(ratio, 0, 0.98),
      symbols: result.symbols,
      entropy: +entropy.toFixed(3),
      avgCodeLength: +avgCodeLength.toFixed(3),
    };
  }

  function estimateRatioForExt(ext) {
    const already = { zip: 0.06, rar: 0.05, mp3: 0.08, mp4: 0.06, jpg: 0.07, jpeg: 0.07, png: 0.12, gif: 0.1, mov: 0.06, mkv: 0.05, flac: 0.14, webp: 0.06 };
    const textLike = { txt: 0.62, log: 0.66, csv: 0.7, json: 0.68, xml: 0.66, html: 0.6, css: 0.58, js: 0.57, md: 0.6, java: 0.58, py: 0.57 };
    if (ext in already) return already[ext];
    if (ext in textLike) return textLike[ext];
    return 0.38;
  }

  return { analyze, encode, estimateRatioForExt, buildTree, buildCodes, buildFrequency };
})();
