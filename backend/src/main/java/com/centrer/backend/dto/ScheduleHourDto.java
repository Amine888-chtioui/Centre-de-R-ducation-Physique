package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScheduleHourDto {

    private int hour;
    private String time;
    private boolean active;
}
