package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityItemResponse {

    /** NEW_PATIENT ou APPOINTMENT */
    private String kind;
    private String icon;
    private String patientName;
    private String detail;
    /** EN_ATTENTE, CONFIRME, ANNULE — null pour inscription */
    private String status;
    private LocalDateTime at;
}
