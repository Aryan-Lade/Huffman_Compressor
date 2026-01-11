package com.huffzip.model;

public class CompressionResult {

    private String fileName;
    private long originalSize;
    private long compressedSize;
    private double ratio;
    private long timeMs;
    private int symbols;
    private boolean encrypted;
    private String checksum;
    private String status;

    public CompressionResult() {
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public long getOriginalSize() { return originalSize; }
    public void setOriginalSize(long originalSize) { this.originalSize = originalSize; }

    public long getCompressedSize() { return compressedSize; }
    public void setCompressedSize(long compressedSize) { this.compressedSize = compressedSize; }

    public double getRatio() { return ratio; }
    public void setRatio(double ratio) { this.ratio = ratio; }

    public long getTimeMs() { return timeMs; }
    public void setTimeMs(long timeMs) { this.timeMs = timeMs; }

    public int getSymbols() { return symbols; }
    public void setSymbols(int symbols) { this.symbols = symbols; }

    public boolean isEncrypted() { return encrypted; }
    public void setEncrypted(boolean encrypted) { this.encrypted = encrypted; }

    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
