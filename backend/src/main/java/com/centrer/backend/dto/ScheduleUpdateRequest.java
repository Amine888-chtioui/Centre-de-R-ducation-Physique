package com.centrer.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleUpdateRequest {

    @NotEmpty(message = "Le planning ne peut pas être vide")
    @Valid
    private List<ScheduleSlotUpdateDto> slots;
}
