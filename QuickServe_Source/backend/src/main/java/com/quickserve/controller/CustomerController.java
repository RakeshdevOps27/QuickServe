package com.quickserve.controller;

import com.quickserve.dto.BookingRequest;
import com.quickserve.entity.*;
import com.quickserve.repository.UserRepository;
import com.quickserve.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private AddressService addressService;

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

    @Autowired
    private com.quickserve.repository.TimeSlotRepository timeSlotRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/time-slots")
    public ResponseEntity<List<TimeSlot>> getTimeSlots() {
        return ResponseEntity.ok(timeSlotRepository.findAll());
    }

    // --- Categories & Services ---
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/categories/{categoryId}/services")
    public ResponseEntity<List<com.quickserve.entity.Service>> getServicesByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(serviceService.getServicesByCategory(categoryId));
    }

    @GetMapping("/services")
    public ResponseEntity<List<com.quickserve.entity.Service>> getAllServices() {
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    // --- Addresses ---
    @GetMapping("/addresses")
    public ResponseEntity<List<Address>> getAddresses() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(addressService.getAddressesByUserId(user.getId()));
    }

    @PostMapping("/addresses")
    public ResponseEntity<Address> createAddress(@RequestBody Address address) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(addressService.createAddress(user.getId(), address));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<Address> updateAddress(@PathVariable Long id, @RequestBody Address address) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(addressService.updateAddress(user.getId(), id, address));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        addressService.deleteAddress(user.getId(), id);
        return ResponseEntity.ok("Address deleted successfully");
    }

    // --- Bookings ---
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getBookings() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.getBookingsForUser(user.getId(), Role.CUSTOMER));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Booking booking = bookingService.getBookingById(id);
        if (!booking.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/bookings")
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.createBooking(user.getId(), request));
    }

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(bookingService.cancelBooking(user.getId(), id));
    }

    @PostMapping("/bookings/{id}/reschedule")
    public ResponseEntity<Booking> rescheduleBooking(
            @PathVariable Long id,
            @RequestParam String date,
            @RequestParam Long timeSlotId) {
        User user = getAuthenticatedUser();
        LocalDate localDate = LocalDate.parse(date);
        return ResponseEntity.ok(bookingService.rescheduleBooking(user.getId(), id, localDate, timeSlotId));
    }

    // --- Payments ---
    @PostMapping("/bookings/{id}/pay")
    public ResponseEntity<Payment> payBooking(
            @PathVariable Long id,
            @RequestParam PaymentMethod method) {
        User user = getAuthenticatedUser();
        Booking booking = bookingService.getBookingById(id);
        if (!booking.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(paymentService.processPayment(id, method));
    }

    // --- Reviews ---
    @PostMapping("/bookings/{id}/review")
    public ResponseEntity<Review> submitReview(
            @PathVariable Long id,
            @RequestParam int rating,
            @RequestParam String comment) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(reviewService.submitReview(user.getId(), id, rating, comment));
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

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        User user = getAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok("All notifications marked as read");
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.quickserve.dto.RegisterRequest profileDetails) {
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
