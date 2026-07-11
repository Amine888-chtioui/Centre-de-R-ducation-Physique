package com.centrer.backend.controller;

import com.centrer.backend.dto.CentreSettingsDto;
import com.centrer.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class PublicSettingsController {

    private final AdminService adminService;

    @GetMapping("/public")
    public ResponseEntity<CentreSettingsDto> getPublicSettings() {
        return ResponseEntity.ok(adminService.getPublicSettings());
    }
}
