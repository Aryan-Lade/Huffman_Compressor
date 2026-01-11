package com.huffzip.service;

import com.huffzip.model.CompressionResult;
import com.huffzip.util.CryptoUtil;
import com.huffzip.util.HuffmanCoder;
import org.springframework.stereotype.Service;

@Service
public class CompressionService {

    private final HuffmanCoder coder = new HuffmanCoder();
    private final CryptoUtil crypto = new CryptoUtil();

    public CompressionResult compress(String fileName, byte[] data, String password) throws Exception {
        long start = System.currentTimeMillis();

        long[] frequencies = coder.countFrequencies(data);
        int symbols = 0;
        for (long f : frequencies) if (f > 0) symbols++;

        byte[] compressed = coder.compress(data);
        boolean encrypted = password != null && !password.isEmpty();
        if (encrypted) {
            compressed = crypto.encrypt(compressed, password);
        }

        CompressionResult result = new CompressionResult();
        result.setFileName(fileName);
        result.setOriginalSize(data.length);
        result.setCompressedSize(compressed.length);
        result.setRatio(data.length == 0 ? 0 : 1.0 - ((double) compressed.length / data.length));
        result.setTimeMs(System.currentTimeMillis() - start);
        result.setSymbols(symbols);
        result.setEncrypted(encrypted);
        result.setChecksum(crypto.checksum(data));
        result.setStatus("success");
        return result;
    }

    public byte[] compressToBytes(byte[] data, String password) throws Exception {
        byte[] compressed = coder.compress(data);
        if (password != null && !password.isEmpty()) {
            compressed = crypto.encrypt(compressed, password);
        }
        return compressed;
    }

    public byte[] decompress(byte[] archive, String password, String expectedChecksum) throws Exception {
        byte[] payload = archive;
        if (password != null && !password.isEmpty()) {
            payload = crypto.decrypt(archive, password);
        }
        byte[] restored = coder.decompress(payload);

        if (expectedChecksum != null && !expectedChecksum.isEmpty()) {
            String actual = crypto.checksum(restored);
            if (!actual.equals(expectedChecksum)) {
                throw new IllegalStateException("Checksum mismatch: archive may be corrupted");
            }
        }
        return restored;
    }

    public CompressionResult analyze(String fileName, byte[] data) {
        long[] frequencies = coder.countFrequencies(data);
        int symbols = 0;
        long total = data.length;
        double entropy = 0;
        for (long f : frequencies) {
            if (f > 0) {
                symbols++;
                double p = (double) f / total;
                entropy -= p * (Math.log(p) / Math.log(2));
            }
        }
        long estimatedBits = 0;
        try {
            estimatedBits = (long) coder.compress(data).length * 8;
        } catch (Exception ignored) {
        }

        CompressionResult result = new CompressionResult();
        result.setFileName(fileName);
        result.setOriginalSize(total);
        result.setCompressedSize(estimatedBits / 8);
        result.setRatio(total == 0 ? 0 : 1.0 - ((double) (estimatedBits / 8) / total));
        result.setSymbols(symbols);
        result.setStatus("analyzed");
        return result;
    }
}
