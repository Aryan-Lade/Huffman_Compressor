package com.huffzip.util;

import com.huffzip.model.HuffmanNode;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class HuffmanCoder {

    private static final int MAGIC = 0x48555A31;

    public byte[] compress(byte[] data) throws IOException {
        if (data == null || data.length == 0) {
            return emptyArchive();
        }

        long[] frequencies = countFrequencies(data);
        HuffmanNode root = buildTree(frequencies);
        Map<Integer, String> codes = new HashMap<>();
        buildCodes(root, "", codes);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        DataOutputStream writer = new DataOutputStream(out);

        writer.writeInt(MAGIC);
        writer.writeInt(data.length);

        int distinct = 0;
        for (long f : frequencies) if (f > 0) distinct++;
        writer.writeInt(distinct);
        for (int symbol = 0; symbol < 256; symbol++) {
            if (frequencies[symbol] > 0) {
                writer.writeByte(symbol);
                writer.writeInt((int) frequencies[symbol]);
            }
        }

        BitWriter bits = new BitWriter(out);
        for (byte b : data) {
            String code = codes.get(b & 0xFF);
            for (int i = 0; i < code.length(); i++) {
                bits.writeBit(code.charAt(i) == '1');
            }
        }
        bits.flush();

        return out.toByteArray();
    }

    public byte[] decompress(byte[] archive) throws IOException {
        DataInputStream reader = new DataInputStream(new ByteArrayInputStream(archive));

        int magic = reader.readInt();
        if (magic != MAGIC) {
            throw new IOException("Not a valid HuffZip archive");
        }

        int originalLength = reader.readInt();
        if (originalLength == 0) {
            return new byte[0];
        }

        int distinct = reader.readInt();
        long[] frequencies = new long[256];
        for (int i = 0; i < distinct; i++) {
            int symbol = reader.readUnsignedByte();
            frequencies[symbol] = reader.readInt();
        }

        HuffmanNode root = buildTree(frequencies);
        byte[] result = new byte[originalLength];

        int headerBytes = 12 + distinct * 5;
        BitReader bits = new BitReader(archive, headerBytes);
        HuffmanNode node = root;
        int produced = 0;

        while (produced < originalLength) {
            if (root.isLeaf()) {
                result[produced++] = (byte) root.symbol;
                continue;
            }
            boolean bit = bits.readBit();
            node = bit ? node.right : node.left;
            if (node.isLeaf()) {
                result[produced++] = (byte) node.symbol;
                node = root;
            }
        }

        return result;
    }

    public long[] countFrequencies(byte[] data) {
        long[] freq = new long[256];
        for (byte b : data) {
            freq[b & 0xFF]++;
        }
        return freq;
    }

    public HuffmanNode buildTree(long[] frequencies) {
        PriorityQueue<HuffmanNode> queue = new PriorityQueue<>();
        for (int symbol = 0; symbol < 256; symbol++) {
            if (frequencies[symbol] > 0) {
                queue.add(new HuffmanNode(symbol, frequencies[symbol]));
            }
        }
        if (queue.isEmpty()) {
            return new HuffmanNode(0, 0);
        }
        if (queue.size() == 1) {
            HuffmanNode only = queue.poll();
            return new HuffmanNode(-1, only.frequency, only, null);
        }
        while (queue.size() > 1) {
            HuffmanNode left = queue.poll();
            HuffmanNode right = queue.poll();
            queue.add(new HuffmanNode(-1, left.frequency + right.frequency, left, right));
        }
        return queue.poll();
    }

    private void buildCodes(HuffmanNode node, String prefix, Map<Integer, String> codes) {
        if (node == null) return;
        if (node.isLeaf()) {
            codes.put(node.symbol, prefix.isEmpty() ? "0" : prefix);
            return;
        }
        buildCodes(node.left, prefix + "0", codes);
        buildCodes(node.right, prefix + "1", codes);
    }

    private byte[] emptyArchive() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        DataOutputStream writer = new DataOutputStream(out);
        writer.writeInt(MAGIC);
        writer.writeInt(0);
        writer.writeInt(0);
        return out.toByteArray();
    }

    private static final class BitWriter {
        private final ByteArrayOutputStream out;
        private int buffer;
        private int count;

        BitWriter(ByteArrayOutputStream out) {
            this.out = out;
        }

        void writeBit(boolean bit) {
            buffer = (buffer << 1) | (bit ? 1 : 0);
            count++;
            if (count == 8) {
                out.write(buffer);
                buffer = 0;
                count = 0;
            }
        }

        void flush() {
            if (count > 0) {
                buffer = buffer << (8 - count);
                out.write(buffer);
                buffer = 0;
                count = 0;
            }
        }
    }

    private static final class BitReader {
        private final byte[] data;
        private int bytePos;
        private int bitPos;

        BitReader(byte[] data, int offset) {
            this.data = data;
            this.bytePos = offset;
        }

        boolean readBit() throws IOException {
            if (bytePos >= data.length) {
                throw new IOException("Unexpected end of archive");
            }
            int bit = (data[bytePos] >> (7 - bitPos)) & 1;
            bitPos++;
            if (bitPos == 8) {
                bitPos = 0;
                bytePos++;
            }
            return bit == 1;
        }
    }
}
