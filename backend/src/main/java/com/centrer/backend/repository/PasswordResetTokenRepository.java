package com.centrer.backend.repository;

import com.centrer.backend.entity.PasswordResetToken;
import com.centrer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByUser(User user);

    void deleteByUser(User user);
}
