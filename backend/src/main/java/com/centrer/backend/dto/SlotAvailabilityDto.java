package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SlotAvailabilityDto {

    private String time;
    private boolean available;
}
