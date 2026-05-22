package com.centrer.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleSlotUpdateDto {

    @NotBlank(message = "Le jour est obligatoire")
    private String dayOfWeek;

    @NotNull
    @Min(8)
    @Max(19)
    private Integer hour;

    @NotNull
    private Boolean active;
}
