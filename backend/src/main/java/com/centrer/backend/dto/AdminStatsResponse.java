package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {

    private long totalPatients;
    private long appointmentsToday;
    private long newPatientsThisMonth;
    private long pendingAppointments;
}
