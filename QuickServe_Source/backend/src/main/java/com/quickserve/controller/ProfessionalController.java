package com.quickserve.controller;

import com.quickserve.dto.ProfessionalEarningsDto;
import com.quickserve.entity.*;
import com.quickserve.repository.UserRepository;
import com.quickserve.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/professional")
public class ProfessionalController {

    @Autowired
    private ProfessionalService professionalService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // --- Profile ---
    @GetMapping("/profile")
    public ResponseEntity<ProfessionalProfile> getProfile() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(professionalService.getProfileByUserId(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfessionalProfile> updateProfile(@RequestBody ProfessionalProfile profileDetails) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(professionalService.updateProfile(user.getId(), profileDetails));
    }

    @PostMapping("/profile/availability")
    public ResponseEntity<ProfessionalProfile> toggleAvailability() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(professionalService.toggleAvailability(user.getId()));
    }

    // --- Bookings & Workflows ---
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getBookings() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.getBookingsForUser(user.getId(), Role.PROFESSIONAL));
    }

    @PostMapping("/bookings/{id}/accept")
    public ResponseEntity<Booking> acceptBooking(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.acceptBooking(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.rejectBooking(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/on-the-way")
    public ResponseEntity<Booking> markOnTheWay(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.markOnTheWay(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/arrive")
    public ResponseEntity<Booking> markArrived(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.markArrived(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/start")
    public ResponseEntity<Booking> startService(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.startService(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/complete")
    public ResponseEntity<Booking> completeService(
            @PathVariable Long id,
            @RequestParam(required = false) java.math.BigDecimal materialCharges,
            @RequestParam(required = false) String workDetails) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.completeService(user.getId(), id, materialCharges, workDetails));
    }

    @PostMapping("/bookings/{id}/confirm-payment")
    public ResponseEntity<Payment> confirmPayment(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Booking booking = bookingService.getBookingById(id);
        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(paymentService.confirmCodPayment(id));
    }

    // --- Earnings & Analytics ---
    @GetMapping("/earnings")
    public ResponseEntity<ProfessionalEarningsDto> getEarnings() {
        User user = getAuthenticatedUser();
        ProfessionalProfile profile = professionalService.getProfileByUserId(user.getId());

        List<Booking> allBookings = bookingService.getBookingsForUser(user.getId(), Role.PROFESSIONAL);
        List<Booking> completedBookings = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.toList());

        double totalEarnings = completedBookings.stream()
                .map(Booking::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .doubleValue();

        List<Review> reviews = reviewService.getReviewsForProfessional(user.getId());

        return ResponseEntity.ok(ProfessionalEarningsDto.builder()
                .completedJobsCount(completedBookings.size())
                .totalEarnings(totalEarnings)
                .averageRating(profile.getRating())
                .completedBookings(completedBookings)
                .reviews(reviews)
                .build());
    }

    // --- Notifications ---
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user.getId()));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok("Notification marked as read");
    }

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PutMapping("/profile-account")
    public ResponseEntity<?> updateAccountProfile(@RequestBody com.quickserve.dto.RegisterRequest profileDetails) {
        User user = getAuthenticatedUser();
        if (profileDetails.getFullName() != null && !profileDetails.getFullName().trim().isEmpty()) {
            user.setFullName(profileDetails.getFullName());
        }
        if (profileDetails.getPhoneNumber() != null && !profileDetails.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(profileDetails.getPhoneNumber());
        }
        if (profileDetails.getPassword() != null && !profileDetails.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(profileDetails.getPassword()));
        }
        User updated = userRepository.save(user);
        return ResponseEntity.ok(updated);
    }
}
