package com.centrer.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "centre_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CentreSettings {

    @Id
    private Long id;

    @Column(nullable = false)
    private String centreName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String hours;
}
