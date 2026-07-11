package com.centrer.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Active @Async (utilisé par EmailService pour ne pas bloquer la requête HTTP sur l'envoi SMTP). */
@Configuration
@EnableAsync
public class AsyncConfig {
}
