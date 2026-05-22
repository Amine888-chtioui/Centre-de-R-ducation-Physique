package com.centrer.backend.repository;

import com.centrer.backend.entity.ScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {

    List<ScheduleSlot> findAllByOrderByDayOfWeekAscHourAsc();

    Optional<ScheduleSlot> findByDayOfWeekAndHour(DayOfWeek dayOfWeek, int hour);

    long count();
}
