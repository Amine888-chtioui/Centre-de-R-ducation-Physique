package com.centrer.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;

@Entity
@Table(
        name = "schedule_slots",
        uniqueConstraints = @UniqueConstraint(columnNames = {"day_of_week", "hour"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private int hour;

    @Column(nullable = false)
    private boolean active;
}
