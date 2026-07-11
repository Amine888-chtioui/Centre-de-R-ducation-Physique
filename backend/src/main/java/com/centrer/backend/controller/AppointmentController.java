package com.centrer.backend.controller;

import com.centrer.backend.dto.AppointmentRequest;
import com.centrer.backend.dto.AppointmentResponse;
import com.centrer.backend.dto.DayAvailabilityDto;
import com.centrer.backend.dto.RescheduleRequest;
import com.centrer.backend.dto.SlotAvailabilityDto;
import com.centrer.backend.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        return ResponseEntity.ok(appointmentService.getMyAppointments());
    }

    @GetMapping("/me/next")
    public ResponseEntity<AppointmentResponse> getMyNextAppointment() {
        AppointmentResponse next = appointmentService.getMyNextAppointment();
        if (next == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(next);
    }

    @GetMapping("/availability/days")
    public ResponseEntity<List<DayAvailabilityDto>> getAvailableDays(
            @RequestParam(required = false) String start,
            @RequestParam(defaultValue = "21") int days) {
        LocalDate startDate = (start != null && !start.isBlank()) ? LocalDate.parse(start) : null;
        return ResponseEntity.ok(appointmentService.getAvailableDays(startDate, days));
    }

    @GetMapping("/availability/slots")
    public ResponseEntity<List<SlotAvailabilityDto>> getAvailableSlots(
            @RequestParam String date) {
        return ResponseEntity.ok(
                appointmentService.getAvailableSlots(LocalDate.parse(date))
        );
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(201).body(appointmentService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        appointmentService.cancel(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request) {
        return ResponseEntity.ok(appointmentService.reschedule(id, request));
    }
}
