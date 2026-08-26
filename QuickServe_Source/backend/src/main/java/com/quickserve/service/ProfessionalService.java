package com.quickserve.service;

import com.quickserve.entity.AvailabilityStatus;
import com.quickserve.entity.ProfessionalProfile;
import com.quickserve.entity.VerificationStatus;
import com.quickserve.repository.ProfessionalProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfessionalService {

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    public ProfessionalProfile getProfileByUserId(Long userId) {
        return professionalProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Professional profile not found for user: " + userId));
    }

    public List<ProfessionalProfile> getAllProfessionals() {
        return professionalProfileRepository.findAll();
    }

    @Transactional
    public ProfessionalProfile updateProfile(Long userId, ProfessionalProfile profileDetails) {
        ProfessionalProfile profile = getProfileByUserId(userId);
        profile.setSpecialization(profileDetails.getSpecialization());
        profile.setExperienceYears(profileDetails.getExperienceYears());
        profile.setBio(profileDetails.getBio());
        profile.setCity(profileDetails.getCity());
        profile.setServiceArea(profileDetails.getServiceArea());
        return professionalProfileRepository.save(profile);
    }

    @Transactional
    public ProfessionalProfile toggleAvailability(Long userId) {
        ProfessionalProfile profile = getProfileByUserId(userId);
        if (profile.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE) {
            profile.setAvailabilityStatus(AvailabilityStatus.UNAVAILABLE);
        } else {
            profile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        }
        return professionalProfileRepository.save(profile);
    }

    @Transactional
    public ProfessionalProfile verifyProfessional(Long profileId, VerificationStatus status) {
        ProfessionalProfile profile = professionalProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + profileId));
        profile.setVerificationStatus(status);
        return professionalProfileRepository.save(profile);
    }
}
