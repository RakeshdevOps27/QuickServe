package com.quickserve.service;

import com.quickserve.entity.Booking;
import com.quickserve.entity.Complaint;
import com.quickserve.entity.User;
import com.quickserve.repository.BookingRepository;
import com.quickserve.repository.ComplaintRepository;
import com.quickserve.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public List<Complaint> getComplaintsForCustomer(Long customerId) {
        return complaintRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Complaint raiseComplaint(Long customerId, Long bookingId, String title, String description) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: Only the customer who booked can raise a complaint");
        }

        Complaint complaint = Complaint.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .title(title)
                .description(description)
                .status("PENDING")
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // Notify Professional
        if (booking.getProfessional() != null) {
            notificationService.sendNotification(booking.getProfessional(), "Complaint Raised on Job",
                    "A complaint has been raised regarding the service booking for " + booking.getService().getName());
        }

        return saved;
    }

    @Transactional
    public Complaint resolveComplaint(Long complaintId, String resolutionNotes) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus("RESOLVED");
        complaint.setResolutionNotes(resolutionNotes);

        Complaint saved = complaintRepository.save(complaint);

        // Notify Customer
        notificationService.sendNotification(complaint.getCustomer(), "Complaint Resolved",
                "Your complaint ticket #" + complaintId + " has been marked as RESOLVED by Support.");

        return saved;
    }

    @Transactional
    public Complaint updateComplaintStatus(Long complaintId, String status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus(status);
        return complaintRepository.save(complaint);
    }
}
