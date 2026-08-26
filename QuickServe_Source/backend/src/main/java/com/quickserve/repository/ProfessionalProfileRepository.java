package com.quickserve.repository;

import com.quickserve.entity.ProfessionalProfile;
import com.quickserve.entity.Specialization;
import com.quickserve.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfessionalProfileRepository extends JpaRepository<ProfessionalProfile, Long> {
    Optional<ProfessionalProfile> findByUserId(Long userId);
    List<ProfessionalProfile> findBySpecializationAndCityAndVerificationStatus(
            Specialization specialization, String city, VerificationStatus status);
}
