package com.quickserve.controller;

import com.quickserve.entity.Complaint;
import com.quickserve.entity.User;
import com.quickserve.repository.UserRepository;
import com.quickserve.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // --- Customer Complaints ---
    @GetMapping("/customer/complaints")
    public ResponseEntity<List<Complaint>> getCustomerComplaints() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(complaintService.getComplaintsForCustomer(user.getId()));
    }

    @PostMapping("/customer/bookings/{bookingId}/complaint")
    public ResponseEntity<Complaint> raiseComplaint(
            @PathVariable Long bookingId,
            @RequestParam String title,
            @RequestParam String description) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(complaintService.raiseComplaint(user.getId(), bookingId, title, description));
    }

    // --- Admin Complaints ---
    @GetMapping("/admin/complaints")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @PostMapping("/admin/complaints/{id}/resolve")
    public ResponseEntity<Complaint> resolveComplaint(
            @PathVariable Long id,
            @RequestParam String resolutionNotes) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, resolutionNotes));
    }
}
