package com.quickserve.service;

import com.quickserve.entity.*;
import com.quickserve.repository.BookingRepository;
import com.quickserve.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Payment processPayment(Long bookingId, PaymentMethod method) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            throw new RuntimeException("Payment already initiated/processed for this booking");
        }

        PaymentStatus status = (method == PaymentMethod.COD) ? PaymentStatus.PENDING : PaymentStatus.PAID;
        String transactionId = (method == PaymentMethod.COD) ? null : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getPrice())
                .paymentMethod(method)
                .paymentStatus(status)
                .transactionId(transactionId)
                .currency(booking.getCurrency())
                .exchangeRate(booking.getExchangeRate())
                .build();

        Payment saved = paymentRepository.save(payment);

        java.math.BigDecimal convertedAmount = booking.getPrice().multiply(booking.getExchangeRate()).setScale(2, java.math.RoundingMode.HALF_UP);
        notificationService.sendNotification(booking.getCustomer(), "Payment Update", 
                "Payment of " + booking.getCurrency() + " " + convertedAmount + " processed using " + method + ". Status: " + status);

        return saved;
    }

    @Transactional
    public Payment confirmCodPayment(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        if (payment.getPaymentMethod() != PaymentMethod.COD) {
            throw new RuntimeException("Payment method is not Cash on Delivery");
        }

        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setTransactionId("COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        return paymentRepository.save(payment);
    }
}
