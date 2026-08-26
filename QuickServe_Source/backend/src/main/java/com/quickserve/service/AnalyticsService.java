package com.quickserve.service;

import com.quickserve.dto.AdminAnalyticsDto;
import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public AdminAnalyticsDto getAdminAnalytics() {
        List<User> users = userRepository.findAll();
        long totalCustomers = users.stream().filter(u -> u.getRole() == Role.CUSTOMER).count();
        long totalProfessionals = users.stream().filter(u -> u.getRole() == Role.PROFESSIONAL).count();

        List<Booking> bookings = bookingRepository.findAll();
        long totalBookings = bookings.size();
        long completedBookings = bookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        long cancelledBookings = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
        long activeBookings = totalBookings - completedBookings - cancelledBookings;

        List<Payment> payments = paymentRepository.findAll();
        double totalRevenue = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .doubleValue();

        // Group monthly bookings: e.g. "January" -> 5
        Map<String, Long> monthlyBookings = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getBookingDate().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        return AdminAnalyticsDto.builder()
                .totalCustomers(totalCustomers)
                .totalProfessionals(totalProfessionals)
                .totalBookings(totalBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .activeBookings(activeBookings)
                .totalRevenue(totalRevenue)
                .monthlyBookings(monthlyBookings)
                .build();
    }
}
