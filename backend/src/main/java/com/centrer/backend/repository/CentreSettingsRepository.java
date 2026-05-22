package com.centrer.backend.repository;

import com.centrer.backend.entity.CentreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CentreSettingsRepository extends JpaRepository<CentreSettings, Long> {
}
