package com.centrer.backend.controller;

import com.centrer.backend.dto.*;
import com.centrer.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/appointments/today")
    public ResponseEntity<List<AppointmentAdminResponse>> getTodayAppointments() {
        return ResponseEntity.ok(adminService.getTodayAppointments());
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentAdminResponse>> getAllAppointments() {
        return ResponseEntity.ok(adminService.getAllAppointments());
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentAdminResponse> updateStatusPatch(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {
        return ResponseEntity.ok(adminService.updateAppointmentStatus(id, request));
    }

    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentAdminResponse> updateStatusPut(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {
        return ResponseEntity.ok(adminService.updateAppointmentStatus(id, request));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponse>> getPatients(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getPatients(search));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityItemResponse>> getActivity() {
        return ResponseEntity.ok(adminService.getRecentActivity());
    }

    @GetMapping("/chart/weekly")
    public ResponseEntity<List<WeeklyChartDayResponse>> getWeeklyChart() {
        return ResponseEntity.ok(adminService.getWeeklyChart());
    }

    @GetMapping("/settings")
    public ResponseEntity<CentreSettingsDto> getSettings() {
        return ResponseEntity.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<CentreSettingsDto> updateSettings(
            @Valid @RequestBody CentreSettingsDto dto) {
        return ResponseEntity.ok(adminService.updateSettings(dto));
    }

    @GetMapping("/schedule")
    public ResponseEntity<ScheduleMatrixDto> getSchedule() {
        return ResponseEntity.ok(adminService.getSchedule());
    }

    @PutMapping("/schedule")
    public ResponseEntity<ScheduleMatrixDto> updateSchedule(
            @Valid @RequestBody ScheduleUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateSchedule(request));
    }
}
