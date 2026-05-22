package com.centrer.backend.service;

import com.centrer.backend.dto.*;
import com.centrer.backend.entity.ScheduleSlot;
import com.centrer.backend.repository.ScheduleSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

    public static final int OPEN_HOUR = 8;
    public static final int CLOSE_HOUR = 19;

    private static final List<DayOfWeek> WEEK_ORDER = List.of(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
            DayOfWeek.SATURDAY,
            DayOfWeek.SUNDAY
    );

    private final ScheduleSlotRepository scheduleSlotRepository;

    public ScheduleMatrixDto getMatrix() {
        ensureDefaultSchedule();
        Map<String, Boolean> activeMap = loadActiveMap();

        List<ScheduleDayDto> days = new ArrayList<>();
        int activeCount = 0;

        for (DayOfWeek dow : WEEK_ORDER) {
            List<ScheduleHourDto> hours = new ArrayList<>();
            for (int hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
                boolean active = activeMap.getOrDefault(key(dow, hour), false);
                if (active) activeCount++;
                hours.add(ScheduleHourDto.builder()
                        .hour(hour)
                        .time(String.format("%02d:00", hour))
                        .active(active)
                        .build());
            }
            days.add(ScheduleDayDto.builder()
                    .dayOfWeek(dow.name())
                    .label(dayLabel(dow))
                    .hours(hours)
                    .build());
        }

        return ScheduleMatrixDto.builder()
                .days(days)
                .activeSlotsCount(activeCount)
                .build();
    }

    public ScheduleMatrixDto updateSchedule(ScheduleUpdateRequest request) {
        ensureDefaultSchedule();

        for (ScheduleSlotUpdateDto update : request.getSlots()) {
            DayOfWeek dow = DayOfWeek.valueOf(update.getDayOfWeek().trim().toUpperCase());
            int hour = update.getHour();
            if (hour < OPEN_HOUR || hour > CLOSE_HOUR) {
                throw new RuntimeException("Heure hors plage autorisée (8h-19h)");
            }

            ScheduleSlot slot = scheduleSlotRepository.findByDayOfWeekAndHour(dow, hour)
                    .orElse(ScheduleSlot.builder().dayOfWeek(dow).hour(hour).build());
            slot.setActive(Boolean.TRUE.equals(update.getActive()));
            scheduleSlotRepository.save(slot);
        }

        return getMatrix();
    }

    public boolean isSlotActive(LocalDate date, int hour) {
        ensureDefaultSchedule();
        return scheduleSlotRepository.findByDayOfWeekAndHour(date.getDayOfWeek(), hour)
                .map(ScheduleSlot::isActive)
                .orElse(false);
    }

    public boolean hasActiveHourOnDay(DayOfWeek dayOfWeek) {
        ensureDefaultSchedule();
        for (int hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
            if (isSlotActive(dayOfWeek, hour)) {
                return true;
            }
        }
        return false;
    }

    public List<Integer> getActiveHours(DayOfWeek dayOfWeek) {
        ensureDefaultSchedule();
        List<Integer> hours = new ArrayList<>();
        for (int hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
            if (isSlotActive(dayOfWeek, hour)) {
                hours.add(hour);
            }
        }
        return hours;
    }

    private boolean isSlotActive(DayOfWeek dayOfWeek, int hour) {
        return scheduleSlotRepository.findByDayOfWeekAndHour(dayOfWeek, hour)
                .map(ScheduleSlot::isActive)
                .orElse(false);
    }

    private void ensureDefaultSchedule() {
        if (scheduleSlotRepository.count() > 0) {
            return;
        }
        for (DayOfWeek dow : WEEK_ORDER) {
            boolean dayActive = dow != DayOfWeek.SUNDAY;
            for (int hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
                scheduleSlotRepository.save(ScheduleSlot.builder()
                        .dayOfWeek(dow)
                        .hour(hour)
                        .active(dayActive)
                        .build());
            }
        }
    }

    private Map<String, Boolean> loadActiveMap() {
        return scheduleSlotRepository.findAllByOrderByDayOfWeekAscHourAsc().stream()
                .collect(Collectors.toMap(
                        s -> key(s.getDayOfWeek(), s.getHour()),
                        ScheduleSlot::isActive,
                        (a, b) -> b
                ));
    }

    private String key(DayOfWeek dow, int hour) {
        return dow.name() + "-" + hour;
    }

    private String dayLabel(DayOfWeek dow) {
        String label = dow.getDisplayName(TextStyle.SHORT, Locale.FRENCH);
        return label.substring(0, 1).toUpperCase() + label.substring(1);
    }
}
