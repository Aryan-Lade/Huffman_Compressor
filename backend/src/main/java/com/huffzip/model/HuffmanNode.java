package com.huffzip.model;

public class HuffmanNode implements Comparable<HuffmanNode> {

    public final int symbol;
    public final long frequency;
    public final HuffmanNode left;
    public final HuffmanNode right;

    public HuffmanNode(int symbol, long frequency) {
        this(symbol, frequency, null, null);
    }

    public HuffmanNode(int symbol, long frequency, HuffmanNode left, HuffmanNode right) {
        this.symbol = symbol;
        this.frequency = frequency;
        this.left = left;
        this.right = right;
    }

    public boolean isLeaf() {
        return left == null && right == null;
    }

    @Override
    public int compareTo(HuffmanNode other) {
        int cmp = Long.compare(this.frequency, other.frequency);
        return cmp != 0 ? cmp : Integer.compare(this.symbol, other.symbol);
    }
}
