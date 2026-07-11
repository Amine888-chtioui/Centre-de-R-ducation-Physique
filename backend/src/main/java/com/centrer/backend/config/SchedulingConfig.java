package com.centrer.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Active @Scheduled (utilisé par ReminderScheduler pour les rappels de rendez-vous). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
