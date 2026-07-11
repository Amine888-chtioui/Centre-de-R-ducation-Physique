package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WeeklyChartDayResponse {

    private String day;
    private long count;
}
