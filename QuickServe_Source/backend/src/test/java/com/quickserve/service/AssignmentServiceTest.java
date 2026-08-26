package com.quickserve.service;

import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssignmentServiceTest {

    @InjectMocks
    private AssignmentService assignmentService;

    @Mock
    private ProfessionalProfileRepository professionalProfileRepository;

    @Mock
    private BookingRepository bookingRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testFindBestProfessional_Success() {
        // Mock Category & Service
        Category category = new Category(1L, "Plumbing", "Plumbing description", null);
        com.quickserve.entity.Service service = new com.quickserve.entity.Service(
                1L, category, "Leaky pipe fix", "Fix leaking pipes", BigDecimal.valueOf(50), 60, null);

        // Mock Address
        Address address = new Address(1L, null, "123 Street", "New York", "NY", "10001", null, true);

        // Mock TimeSlot & Date
        TimeSlot slot = new TimeSlot(1L, LocalTime.of(9, 0), LocalTime.of(11, 0));
        LocalDate date = LocalDate.now().plusDays(1);

        // Mock Professionals
        User profUser = new User(2L, "prof@quickserve.com", "pass", "John Pro", "123", Role.PROFESSIONAL, true);
        ProfessionalProfile profile = new ProfessionalProfile(
                1L, profUser, Specialization.PLUMBING, 5, "Bio", "New York", "Area",
                VerificationStatus.VERIFIED, AvailabilityStatus.AVAILABLE, 4.8, 10);

        when(professionalProfileRepository.findBySpecializationAndCityAndVerificationStatus(
                Specialization.PLUMBING, "New York", VerificationStatus.VERIFIED))
                .thenReturn(Collections.singletonList(profile));

        // Workload mock: no overlapping bookings
        when(bookingRepository.findActiveBookingsByProfessionalAndDate(eq(2L), eq(date), anyList()))
                .thenReturn(new ArrayList<>());

        // Execute matching
        User selected = assignmentService.findBestProfessional(service, address, date, slot);

        // Assertions
        assertNotNull(selected);
        assertEquals("prof@quickserve.com", selected.getEmail());
    }
}
