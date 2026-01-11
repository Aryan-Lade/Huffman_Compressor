package com.huffzip.controller;

import com.huffzip.model.CompressionResult;
import com.huffzip.service.CompressionService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CompressionController {

    private final CompressionService service;

    public CompressionController(CompressionService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "engine", "huffman", "version", "1.0.0");
    }

    @PostMapping("/analyze")
    public CompressionResult analyze(@RequestParam("file") MultipartFile file) throws Exception {
        return service.analyze(file.getOriginalFilename(), file.getBytes());
    }

    @PostMapping("/compress")
    public CompressionResult compress(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) throws Exception {
        return service.compress(file.getOriginalFilename(), file.getBytes(), password);
    }

    @PostMapping("/compress/download")
    public ResponseEntity<Resource> compressAndDownload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) throws Exception {
        byte[] compressed = service.compressToBytes(file.getBytes(), password);
        String name = stripExtension(file.getOriginalFilename()) + ".huff";
        return fileResponse(name, compressed);
    }

    @PostMapping("/extract/download")
    public ResponseEntity<Resource> extract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("originalName") String originalName,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "checksum", required = false) String checksum) throws Exception {
        byte[] restored = service.decompress(file.getBytes(), password, checksum);
        return fileResponse(originalName, restored);
    }

    private ResponseEntity<Resource> fileResponse(String name, byte[] data) {
        ByteArrayResource resource = new ByteArrayResource(data);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(resource);
    }

    private String stripExtension(String name) {
        if (name == null) return "archive";
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }
}
