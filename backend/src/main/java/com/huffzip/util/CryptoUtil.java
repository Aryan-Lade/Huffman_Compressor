package com.huffzip.util;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;

public class CryptoUtil {

    private static final int IV_LENGTH = 16;
    private static final int SALT_LENGTH = 16;
    private static final int ITERATIONS = 65_536;
    private static final int KEY_BITS = 256;

    public byte[] encrypt(byte[] data, String password) throws Exception {
        byte[] salt = randomBytes(SALT_LENGTH);
        byte[] iv = randomBytes(IV_LENGTH);
        SecretKeySpec key = deriveKey(password, salt);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));
        byte[] encrypted = cipher.doFinal(data);

        byte[] output = new byte[salt.length + iv.length + encrypted.length];
        System.arraycopy(salt, 0, output, 0, salt.length);
        System.arraycopy(iv, 0, output, salt.length, iv.length);
        System.arraycopy(encrypted, 0, output, salt.length + iv.length, encrypted.length);
        return output;
    }

    public byte[] decrypt(byte[] payload, String password) throws Exception {
        byte[] salt = Arrays.copyOfRange(payload, 0, SALT_LENGTH);
        byte[] iv = Arrays.copyOfRange(payload, SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        byte[] encrypted = Arrays.copyOfRange(payload, SALT_LENGTH + IV_LENGTH, payload.length);

        SecretKeySpec key = deriveKey(password, salt);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
        return cipher.doFinal(encrypted);
    }

    public String checksum(byte[] data) {
        long hash = 0x811c9dc5L;
        for (byte b : data) {
            hash ^= (b & 0xFF);
            hash *= 0x01000193L;
            hash &= 0xFFFFFFFFL;
        }
        return String.format("%08x", hash);
    }

    private SecretKeySpec deriveKey(String password, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
        return new SecretKeySpec(factory.generateSecret(spec).getEncoded(), "AES");
    }

    private byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }
}
