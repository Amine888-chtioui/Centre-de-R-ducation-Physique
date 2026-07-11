package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ScheduleMatrixDto {

    private List<ScheduleDayDto> days;
    private int activeSlotsCount;
}
