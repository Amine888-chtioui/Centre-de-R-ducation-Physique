package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ScheduleDayDto {

    private String dayOfWeek;
    private String label;
    private List<ScheduleHourDto> hours;
}
