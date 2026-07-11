package com.centrer.backend.dto;

import com.centrer.backend.entity.Notification;
import com.centrer.backend.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String icon;
    private String targetTab;
    private Long appointmentId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .icon(n.getIcon())
                .targetTab(n.getTargetTab())
                .appointmentId(n.getAppointmentId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
