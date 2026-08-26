package com.quickserve.controller;

import com.quickserve.dto.AdminAnalyticsDto;
import com.quickserve.entity.*;
import com.quickserve.repository.UserRepository;
import com.quickserve.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private ProfessionalService professionalService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    // --- Analytics ---
    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }

    // --- Users & Profiles ---
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/professionals")
    public ResponseEntity<List<ProfessionalProfile>> getAllProfessionals() {
        return ResponseEntity.ok(professionalService.getAllProfessionals());
    }

    @PostMapping("/professionals/{id}/verify")
    public ResponseEntity<ProfessionalProfile> verifyProfessional(
            @PathVariable Long id,
            @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(professionalService.verifyProfessional(id, status));
    }

    // --- Categories CRUD ---
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.updateCategory(id, category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully");
    }

    // --- Services CRUD ---
    @PostMapping("/categories/{categoryId}/services")
    public ResponseEntity<com.quickserve.entity.Service> createService(
            @PathVariable Long categoryId,
            @RequestBody com.quickserve.entity.Service service) {
        return ResponseEntity.ok(serviceService.createService(categoryId, service));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<com.quickserve.entity.Service> updateService(
            @PathVariable Long id,
            @RequestBody com.quickserve.entity.Service service) {
        return ResponseEntity.ok(serviceService.updateService(id, service));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.ok("Service deleted successfully");
    }

    // --- Bookings ---
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getBookingsForUser(null, Role.ADMIN));
    }

    @PostMapping("/bookings/{bookingId}/assign/{professionalId}")
    public ResponseEntity<Booking> assignProfessional(
            @PathVariable Long bookingId,
            @PathVariable Long professionalId) {
        return ResponseEntity.ok(bookingService.assignProfessional(bookingId, professionalId));
    }

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.quickserve.service.NotificationService notificationService;

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated admin not found"));
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

    @GetMapping("/notifications")
    public ResponseEntity<List<com.quickserve.entity.Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user.getId()));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User user = getAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
