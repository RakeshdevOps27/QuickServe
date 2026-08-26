package com.quickserve.service;

import com.quickserve.dto.BookingRequest;
import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CurrencyService currencyService;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public List<Booking> getBookingsForUser(Long userId, Role role) {
        if (role == Role.CUSTOMER) {
            return bookingRepository.findByCustomerId(userId);
        } else if (role == Role.PROFESSIONAL) {
            return bookingRepository.findByProfessionalId(userId);
        } else {
            return bookingRepository.findAll();
        }
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    @Transactional
    public Booking createBooking(Long customerId, BookingRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        com.quickserve.entity.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(customerId)) {
            throw new RuntimeException("Address does not belong to customer");
        }

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        String reqCurrency = request.getCurrency() != null ? request.getCurrency() : "INR";
        java.math.BigDecimal rate = currencyService.getRate(reqCurrency);

        BigDecimal basePrice = service.getPrice();
        BigDecimal visitCharge = "USD".equalsIgnoreCase(reqCurrency) ? new BigDecimal("5.00") : new BigDecimal("100.00");
        BigDecimal materialCharges = BigDecimal.ZERO;
        BigDecimal subtotal = basePrice.add(visitCharge);
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.18")).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal finalAmount = subtotal.add(tax).setScale(2, java.math.RoundingMode.HALF_UP);

        // Build base booking
        Booking booking = Booking.builder()
                .customer(customer)
                .service(service)
                .address(address)
                .bookingDate(request.getBookingDate())
                .timeSlot(timeSlot)
                .price(finalAmount)
                .notes(request.getNotes())
                .currency(reqCurrency)
                .exchangeRate(rate)
                .status(BookingStatus.PENDING)
                .basePrice(basePrice)
                .visitCharge(visitCharge)
                .materialCharges(materialCharges)
                .tax(tax)
                .finalAmount(finalAmount)
                .build();

        // Run smart assignment algorithm
        User professional = assignmentService.findBestProfessional(service, address, request.getBookingDate(), timeSlot);

        if (professional != null) {
            booking.setProfessional(professional);
            booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Send notifications
        notificationService.sendNotification(customer, "Booking Created", 
                "Your booking for " + service.getName() + " has been registered.");

        if (professional != null) {
            notificationService.sendNotification(professional, "New Job Request", 
                    "You have a new assignment request for " + service.getName() + " on " + request.getBookingDate());
        } else {
            notificationService.sendNotification(customer, "Professional Search in Progress", 
                    "We are looking for a service professional for your booking.");
        }

        // Notify Administrator of new booking and assignment status
        if (professional != null) {
            notifyAdmins("New Booking Auto-Assigned", 
                    "Booking #" + savedBooking.getId() + " for " + service.getName() + " has been auto-assigned to " + professional.getFullName() + ".");
        } else {
            notifyAdmins("Pending Assignment Required", 
                    "ACTION REQUIRED: Booking #" + savedBooking.getId() + " for " + service.getName() + " is PENDING. No matching professional was found. Please manually assign.");
        }

        return savedBooking;
    }

    @Transactional
    public Booking acceptBooking(Long professionalId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.PROFESSIONAL_ASSIGNED) {
            throw new RuntimeException("Booking cannot be accepted from state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Booking Accepted", 
                "Professional " + booking.getProfessional().getFullName() + " has accepted your booking.");

        return saved;
    }

    @Transactional
    public Booking rejectBooking(Long professionalId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.PROFESSIONAL_ASSIGNED) {
            throw new RuntimeException("Booking cannot be rejected from state: " + booking.getStatus());
        }

        // Reset assignment
        User oldProf = booking.getProfessional();
        booking.setProfessional(null);
        booking.setStatus(BookingStatus.REJECTED);

        Booking saved = bookingRepository.save(booking);

        // Try to re-assign right away if possible
        User newProf = assignmentService.findBestProfessional(booking.getService(), booking.getAddress(), booking.getBookingDate(), booking.getTimeSlot());
        if (newProf != null) {
            saved.setProfessional(newProf);
            saved.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
            saved = bookingRepository.save(saved);

            notificationService.sendNotification(newProf, "New Job Request (Reassigned)", 
                    "You have an assignment request for " + booking.getService().getName());
        } else {
            notificationService.sendNotification(booking.getCustomer(), "Professional Search in Progress", 
                    "We are re-assigning another professional for your service request.");
        }

        notificationService.sendNotification(oldProf, "Job Rejected", "You have rejected the job request.");

        return saved;
    }

    @Transactional
    public Booking markOnTheWay(Long professionalId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Booking cannot be marked on the way from state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.ON_THE_WAY);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Professional On The Way", 
                "Professional " + booking.getProfessional().getFullName() + " is on the way to your location.");

        return saved;
    }

    @Transactional
    public Booking markArrived(Long professionalId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.ON_THE_WAY) {
            throw new RuntimeException("Booking cannot be marked arrived from state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.ARRIVED);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Professional Arrived", 
                "Professional " + booking.getProfessional().getFullName() + " has arrived at your location.");

        return saved;
    }

    @Transactional
    public Booking startService(Long professionalId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.ARRIVED) {
            throw new RuntimeException("Booking cannot start from state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Service Started", 
                "Your service has started. Professional " + booking.getProfessional().getFullName() + " is on the job.");

        return saved;
    }

    @Transactional
    public Booking completeService(Long professionalId, Long bookingId) {
        return completeService(professionalId, bookingId, BigDecimal.ZERO, null);
    }

    @Transactional
    public Booking completeService(Long professionalId, Long bookingId, BigDecimal inputMaterialCharges, String workDetails) {
        Booking booking = getBookingById(bookingId);

        if (booking.getProfessional() == null || !booking.getProfessional().getId().equals(professionalId)) {
            throw new RuntimeException("Unauthorized action for this professional");
        }

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new RuntimeException("Booking cannot be completed from state: " + booking.getStatus());
        }

        BigDecimal materialCharges = inputMaterialCharges != null ? inputMaterialCharges : BigDecimal.ZERO;
        booking.setMaterialCharges(materialCharges);
        booking.setWorkDetails(workDetails);

        // Recalculate final totals
        BigDecimal subtotal = booking.getBasePrice().add(booking.getVisitCharge()).add(materialCharges);
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.18")).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal finalAmount = subtotal.add(tax).setScale(2, java.math.RoundingMode.HALF_UP);

        booking.setTax(tax);
        booking.setFinalAmount(finalAmount);
        booking.setPrice(finalAmount);

        booking.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Service Completed", 
                "Your service is completed! Please share your review and proceed with payment.");

        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long userId, Long bookingId) {
        Booking booking = getBookingById(bookingId);

        // Access control: only customer who booked, assigned professional, or admin
        boolean isCustomer = booking.getCustomer().getId().equals(userId);
        boolean isProfessional = booking.getProfessional() != null && booking.getProfessional().getId().equals(userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isProfessional && !isAdmin) {
            throw new RuntimeException("Unauthorized to cancel this booking");
        }

        // Rules: cannot cancel after IN_PROGRESS
        if (booking.getStatus() == BookingStatus.IN_PROGRESS || booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking cannot be cancelled in state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Refund process if paid
        paymentRepository.findByBookingId(bookingId).ifPresent(payment -> {
            if (payment.getPaymentStatus() == PaymentStatus.PAID) {
                payment.setPaymentStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
                notificationService.sendNotification(booking.getCustomer(), "Refund Processed", 
                        "A refund of " + booking.getCurrency() + " " + payment.getAmount() + " has been credited to your account.");
            }
        });

        notificationService.sendNotification(booking.getCustomer(), "Booking Cancelled", 
                "Booking for " + booking.getService().getName() + " has been cancelled.");

        if (booking.getProfessional() != null) {
            notificationService.sendNotification(booking.getProfessional(), "Job Cancelled", 
                    "The job for " + booking.getService().getName() + " has been cancelled.");
        }

        return saved;
    }

    @Transactional
    public Booking rescheduleBooking(Long userId, Long bookingId, LocalDate newDate, Long newSlotId) {
        Booking booking = getBookingById(bookingId);

        boolean isCustomer = booking.getCustomer().getId().equals(userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isAdmin) {
            throw new RuntimeException("Unauthorized to reschedule this booking");
        }

        if (booking.getStatus() == BookingStatus.IN_PROGRESS || booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking cannot be rescheduled in state: " + booking.getStatus());
        }

        TimeSlot timeSlot = timeSlotRepository.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        booking.setBookingDate(newDate);
        booking.setTimeSlot(timeSlot);
        booking.setStatus(BookingStatus.RESCHEDULED);

        // Check if current professional is still available at the new slot
        boolean currentProfAvailable = false;
        if (booking.getProfessional() != null) {
            List<BookingStatus> activeStatuses = List.of(
                    BookingStatus.CONFIRMED, BookingStatus.PROFESSIONAL_ASSIGNED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS
            );
            List<Booking> active = bookingRepository.findActiveBookingsByProfessionalAndDate(
                    booking.getProfessional().getId(), newDate, activeStatuses);
            
            currentProfAvailable = active.stream()
                    .noneMatch(b -> b.getTimeSlot().getId().equals(newSlotId) && !b.getId().equals(bookingId));
        }

        // If not available or no professional was assigned, re-run matching
        if (!currentProfAvailable) {
            User oldProf = booking.getProfessional();
            User newProf = assignmentService.findBestProfessional(booking.getService(), booking.getAddress(), newDate, timeSlot);
            booking.setProfessional(newProf);
            
            if (newProf != null) {
                booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
                notificationService.sendNotification(newProf, "New Job Request (Rescheduled)", 
                        "You have a rescheduled service request for " + booking.getService().getName());
            } else {
                booking.setStatus(BookingStatus.PENDING);
            }

            if (oldProf != null) {
                notificationService.sendNotification(oldProf, "Job Cancelled/Rescheduled", 
                        "A job previously assigned to you has been rescheduled and reassigned.");
            }
        } else {
            // Keep professional, prompt them to accept/reject new time
            booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
            notificationService.sendNotification(booking.getProfessional(), "Job Rescheduled", 
                    "Your assigned job for " + booking.getService().getName() + " was rescheduled. Please accept/reject the new slot.");
        }

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getCustomer(), "Booking Rescheduled", 
                "Your booking was successfully rescheduled to " + newDate + " " + timeSlot.getFormattedSlot());

        return saved;
    }

    @Transactional
    public Booking assignProfessional(Long bookingId, Long professionalId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot assign professional to completed or cancelled booking");
        }

        User professional = userRepository.findById(professionalId)
                .orElseThrow(() -> new RuntimeException("Professional not found"));

        if (professional.getRole() != Role.PROFESSIONAL) {
            throw new RuntimeException("Selected user is not a service professional");
        }

        ProfessionalProfile profile = professionalProfileRepository.findByUserId(professionalId)
                .orElseThrow(() -> new RuntimeException("Professional profile not found"));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new RuntimeException("Professional is not verified");
        }

        List<BookingStatus> activeStatuses = java.util.Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.PROFESSIONAL_ASSIGNED,
                BookingStatus.ACCEPTED,
                BookingStatus.IN_PROGRESS
        );

        List<Booking> active = bookingRepository.findActiveBookingsByProfessionalAndDate(
                professionalId, booking.getBookingDate(), activeStatuses);
        
        boolean hasOverlap = active.stream()
                .anyMatch(b -> b.getTimeSlot().getId().equals(booking.getTimeSlot().getId()) && !b.getId().equals(bookingId));

        if (hasOverlap) {
            throw new RuntimeException("Professional is already assigned to another active booking during this slot");
        }

        booking.setProfessional(professional);
        booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(professional, "New Assignment Request (Manual)",
                "Admin has assigned you a booking for " + booking.getService().getName() + " on " + booking.getBookingDate());

        notificationService.sendNotification(booking.getCustomer(), "Professional Assigned",
                "Admin has assigned " + professional.getFullName() + " for your service request.");

        return saved;
    }

    private void notifyAdmins(String title, String message) {
        try {
            java.util.List<User> admins = userRepository.findByRole(com.quickserve.entity.Role.ADMIN);
            for (User admin : admins) {
                notificationService.sendNotification(admin, title, message);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify admins: " + e.getMessage());
        }
    }
}
