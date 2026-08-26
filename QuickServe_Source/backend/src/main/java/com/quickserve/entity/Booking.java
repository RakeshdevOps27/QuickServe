package com.quickserve.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "professional_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User professional;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Service service;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "address_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Address address;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "time_slot_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(nullable = false)
    private BigDecimal price;

    private String notes;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(nullable = false)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal visitCharge = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal materialCharges = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String workDetails;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("booking")
    private Payment payment;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("booking")
    private Review review;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Booking() {}

    public Booking(Long id, User customer, User professional, Service service, Address address,
                   LocalDate bookingDate, TimeSlot timeSlot, BookingStatus status, BigDecimal price, String notes,
                   String currency, BigDecimal exchangeRate, BigDecimal basePrice, BigDecimal visitCharge,
                   BigDecimal materialCharges, BigDecimal tax, BigDecimal finalAmount, String workDetails) {
        this.id = id;
        this.customer = customer;
        this.professional = professional;
        this.service = service;
        this.address = address;
        this.bookingDate = bookingDate;
        this.timeSlot = timeSlot;
        this.status = status != null ? status : BookingStatus.PENDING;
        this.price = price;
        this.notes = notes;
        this.currency = currency != null ? currency : "INR";
        this.exchangeRate = exchangeRate != null ? exchangeRate : BigDecimal.ONE;
        this.basePrice = basePrice != null ? basePrice : BigDecimal.ZERO;
        this.visitCharge = visitCharge != null ? visitCharge : BigDecimal.ZERO;
        this.materialCharges = materialCharges != null ? materialCharges : BigDecimal.ZERO;
        this.tax = tax != null ? tax : BigDecimal.ZERO;
        this.finalAmount = finalAmount != null ? finalAmount : BigDecimal.ZERO;
        this.workDetails = workDetails;
    }

    public static BookingBuilder builder() {
        return new BookingBuilder();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public User getProfessional() { return professional; }
    public void setProfessional(User professional) { this.professional = professional; }

    public Service getService() { return service; }
    public void setService(Service service) { this.service = service; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }

    public TimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getVisitCharge() { return visitCharge; }
    public void setVisitCharge(BigDecimal visitCharge) { this.visitCharge = visitCharge; }

    public BigDecimal getMaterialCharges() { return materialCharges; }
    public void setMaterialCharges(BigDecimal materialCharges) { this.materialCharges = materialCharges; }

    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }

    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    public String getWorkDetails() { return workDetails; }
    public void setWorkDetails(String workDetails) { this.workDetails = workDetails; }

    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }

    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Simple Builder Pattern
    public static class BookingBuilder {
        private Long id;
        private User customer;
        private User professional;
        private Service service;
        private Address address;
        private LocalDate bookingDate;
        private TimeSlot timeSlot;
        private BookingStatus status;
        private BigDecimal price;
        private String notes;
        private String currency;
        private BigDecimal exchangeRate;
        private BigDecimal basePrice;
        private BigDecimal visitCharge;
        private BigDecimal materialCharges;
        private BigDecimal tax;
        private BigDecimal finalAmount;
        private String workDetails;

        public BookingBuilder id(Long id) { this.id = id; return this; }
        public BookingBuilder customer(User customer) { this.customer = customer; return this; }
        public BookingBuilder professional(User professional) { this.professional = professional; return this; }
        public BookingBuilder service(Service service) { this.service = service; return this; }
        public BookingBuilder address(Address address) { this.address = address; return this; }
        public BookingBuilder bookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; return this; }
        public BookingBuilder timeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; return this; }
        public BookingBuilder status(BookingStatus status) { this.status = status; return this; }
        public BookingBuilder price(BigDecimal price) { this.price = price; return this; }
        public BookingBuilder notes(String notes) { this.notes = notes; return this; }
        public BookingBuilder currency(String currency) { this.currency = currency; return this; }
        public BookingBuilder exchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; return this; }
        public BookingBuilder basePrice(BigDecimal basePrice) { this.basePrice = basePrice; return this; }
        public BookingBuilder visitCharge(BigDecimal visitCharge) { this.visitCharge = visitCharge; return this; }
        public BookingBuilder materialCharges(BigDecimal materialCharges) { this.materialCharges = materialCharges; return this; }
        public BookingBuilder tax(BigDecimal tax) { this.tax = tax; return this; }
        public BookingBuilder finalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; return this; }
        public BookingBuilder workDetails(String workDetails) { this.workDetails = workDetails; return this; }

        public Booking build() {
            return new Booking(id, customer, professional, service, address, bookingDate, timeSlot, status, price, notes, currency, exchangeRate, basePrice, visitCharge, materialCharges, tax, finalAmount, workDetails);
        }
    }
}
