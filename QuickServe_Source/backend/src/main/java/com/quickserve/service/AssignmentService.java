package com.quickserve.service;

import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public User findBestProfessional(com.quickserve.entity.Service service, Address address, LocalDate date, TimeSlot timeSlot) {
        Specialization spec = mapCategoryToSpecialization(service.getCategory().getName());
        if (spec == null) {
            return null; // Specialization mapping failed or category is not mapped
        }

        String city = address.getCity();
        
        // 1. Find all verified professionals matching specialization and city
        List<ProfessionalProfile> candidates = professionalProfileRepository
                .findBySpecializationAndCityAndVerificationStatus(spec, city, VerificationStatus.VERIFIED);

        // 2. Filter by availability status
        List<ProfessionalProfile> availableCandidates = candidates.stream()
                .filter(p -> p.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE)
                .collect(Collectors.toList());

        // 3. Filter by workload: Must not have overlapping active bookings at same date and slot
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.PROFESSIONAL_ASSIGNED,
                BookingStatus.ACCEPTED,
                BookingStatus.IN_PROGRESS
        );

        List<ProfessionalProfile> eligibleCandidates = new ArrayList<>();
        for (ProfessionalProfile candidate : availableCandidates) {
            List<Booking> dailyBookings = bookingRepository.findActiveBookingsByProfessionalAndDate(
                    candidate.getUser().getId(), date, activeStatuses);
            
            boolean hasOverlap = dailyBookings.stream()
                    .anyMatch(b -> b.getTimeSlot().getId().equals(timeSlot.getId()));
            
            if (!hasOverlap) {
                eligibleCandidates.add(candidate);
            }
        }

        if (eligibleCandidates.isEmpty()) {
            return null; // No available professionals matching criteria
        }

        // 4. Score and select the best candidate: Weighted Score = Rating * 2.0 - Workload * 1.0
        ProfessionalProfile selectedProfile = null;
        double bestScore = -Double.MAX_VALUE;

        for (ProfessionalProfile candidate : eligibleCandidates) {
            int workload = bookingRepository.findActiveBookingsByProfessionalAndDate(
                    candidate.getUser().getId(), date, activeStatuses).size();
            
            double score = (candidate.getRating() * 2.0) - (workload * 1.0);
            if (score > bestScore) {
                bestScore = score;
                selectedProfile = candidate;
            }
        }

        return selectedProfile != null ? selectedProfile.getUser() : null;
    }

    public Specialization mapCategoryToSpecialization(String categoryName) {
        if (categoryName == null) return null;
        String name = categoryName.toUpperCase().replaceAll("\\s+", "_");
        try {
            return Specialization.valueOf(name);
        } catch (IllegalArgumentException e) {
            // Fuzzy string matching fallbacks
            if (name.contains("PLUMB")) return Specialization.PLUMBING;
            if (name.contains("ELECT")) return Specialization.ELECTRICAL;
            if (name.contains("AC")) return Specialization.AC_REPAIR;
            if (name.contains("CLEAN")) return Specialization.HOME_CLEANING;
            if (name.contains("BEAUT")) return Specialization.BEAUTY;
            if (name.contains("APPLI")) return Specialization.APPLIANCE_REPAIR;
            if (name.contains("PAINT")) return Specialization.PAINTING;
            if (name.contains("PEST")) return Specialization.PEST_CONTROL;
            return null;
        }
    }
}
