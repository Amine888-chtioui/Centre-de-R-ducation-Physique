package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DayAvailabilityDto {

    private String date;
    private String label;
    private boolean available;
}
