package com.quickserve.controller;

import com.quickserve.entity.Booking;
import com.quickserve.entity.User;
import com.quickserve.repository.UserRepository;
import com.quickserve.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InvoiceController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/customer/bookings/{id}/invoice")
    public ResponseEntity<String> getInvoice(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Booking booking = bookingService.getBookingById(id);

        // Security check: Customer can only view their own booking invoices, admin can view all
        if (!booking.getCustomer().getId().equals(user.getId()) && user.getRole() != com.quickserve.entity.Role.ADMIN) {
            return ResponseEntity.status(403).body("Unauthorized to access this invoice");
        }

        // Generate print-friendly HTML
        String customerName = booking.getCustomer().getFullName();
        String customerEmail = booking.getCustomer().getEmail();
        String partnerName = booking.getProfessional() != null ? booking.getProfessional().getFullName() : "N/A";
        String serviceName = booking.getService().getName();
        String date = booking.getBookingDate().toString();
        String slot = booking.getTimeSlot().getFormattedSlot();
        String currency = booking.getCurrency();

        java.math.BigDecimal basePrice = booking.getBasePrice();
        java.math.BigDecimal visitCharge = booking.getVisitCharge();
        java.math.BigDecimal materialCharges = booking.getMaterialCharges();
        java.math.BigDecimal tax = booking.getTax();
        java.math.BigDecimal finalAmount = booking.getFinalAmount();

        String paymentMethod = booking.getPayment() != null ? booking.getPayment().getPaymentMethod().toString() : "PENDING";
        String paymentStatus = booking.getPayment() != null ? booking.getPayment().getPaymentStatus().toString() : "PENDING";
        String transactionId = booking.getPayment() != null && booking.getPayment().getTransactionId() != null 
                ? booking.getPayment().getTransactionId() : "N/A";

        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>Invoice #" + booking.getId() + "</title>\n" +
                "    <style>\n" +
                "        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }\n" +
                "        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); border-radius: 8px; }\n" +
                "        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }\n" +
                "        .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }\n" +
                "        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }\n" +
                "        .details h3 { margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #eee; padding-bottom: 4px; }\n" +
                "        .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }\n" +
                "        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }\n" +
                "        .table th { background-color: #f8fafc; color: #475569; }\n" +
                "        .table .right { text-align: right; }\n" +
                "        .total-box { width: 50%; margin-left: auto; margin-top: 20px; }\n" +
                "        .total-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 14px; }\n" +
                "        .total-row.final { font-size: 18px; font-weight: bold; color: #3b82f6; border-top: 2px solid #3b82f6; margin-top: 8px; padding-top: 12px; }\n" +
                "        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"invoice-box\">\n" +
                "        <div class=\"header\">\n" +
                "            <div class=\"logo\">🛠️ QuickServe</div>\n" +
                "            <div style=\"text-align: right;\">\n" +
                "                <h2 style=\"margin: 0; color: #1e293b;\">INVOICE</h2>\n" +
                "                <span style=\"color: #64748b;\">Booking ID: #" + booking.getId() + "</span><br>\n" +
                "                <span style=\"color: #64748b;\">Date: " + date + "</span>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        \n" +
                "        <div class=\"details\">\n" +
                "            <div>\n" +
                "                <h3>Customer details</h3>\n" +
                "                <strong>Name:</strong> " + customerName + "<br>\n" +
                "                <strong>Email:</strong> " + customerEmail + "<br>\n" +
                "                <strong>Service Date:</strong> " + date + " " + slot + "\n" +
                "            </div>\n" +
                "            <div>\n" +
                "                <h3>Assigned Professional</h3>\n" +
                "                <strong>Name:</strong> " + partnerName + "<br>\n" +
                "                <strong>Category:</strong> " + booking.getService().getCategory().getName() + "<br>\n" +
                "                <strong>Address:</strong> " + booking.getAddress().getStreetAddress() + ", " + booking.getAddress().getCity() + "\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        \n" +
                "        <table class=\"table\">\n" +
                "            <thead>\n" +
                "                <tr>\n" +
                "                    <th>Service item / Description</th>\n" +
                "                    <th class=\"right\">Rate</th>\n" +
                "                </tr>\n" +
                "            </thead>\n" +
                "            <tbody>\n" +
                "                <tr>\n" +
                "                    <td>" + serviceName + " (Base Charges)</td>\n" +
                "                    <td class=\"right\">" + currency + " " + basePrice + "</td>\n" +
                "                </tr>\n" +
                "                <tr>\n" +
                "                    <td>Standard Visiting & Consulting Fee</td>\n" +
                "                    <td class=\"right\">" + currency + " " + visitCharge + "</td>\n" +
                "                </tr>\n" +
                "                <tr>\n" +
                "                    <td>Additional Material / Accessory Charges</td>\n" +
                "                    <td class=\"right\">" + currency + " " + materialCharges + "</td>\n" +
                "                </tr>\n" +
                "            </tbody>\n" +
                "        </table>\n" +
                "        \n" +
                "        <div class=\"total-box\">\n" +
                "            <div class=\"total-row\">\n" +
                "                <span>Subtotal:</span>\n" +
                "                <span>" + currency + " " + basePrice.add(visitCharge).add(materialCharges) + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"total-row\">\n" +
                "                <span>Tax (GST 18%):</span>\n" +
                "                <span>" + currency + " " + tax + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"total-row final\">\n" +
                "                <span>Total Amount:</span>\n" +
                "                <span>" + currency + " " + finalAmount + "</span>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        \n" +
                "        <div style=\"margin-top: 40px; border-top: 1px dashed #eee; padding-top: 20px;\">\n" +
                "            <h3>Payment details</h3>\n" +
                "            <strong>Payment Method:</strong> " + paymentMethod + "<br>\n" +
                "            <strong>Payment Status:</strong> " + paymentStatus + "<br>\n" +
                "            <strong>Transaction Reference ID:</strong> " + transactionId + "\n" +
                "        </div>\n" +
                "        \n" +
                "        <div class=\"footer\">\n" +
                "            Thank you for choosing QuickServe! For complaints or support tickets, visit the customer dashboard panel.<br>\n" +
                "            &copy; 2026 QuickServe Services. All rights reserved.\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        return ResponseEntity.ok().headers(headers).body(html);
    }
}
