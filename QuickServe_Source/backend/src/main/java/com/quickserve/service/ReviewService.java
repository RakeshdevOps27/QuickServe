package com.quickserve.service;

import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Review> getReviewsForProfessional(Long professionalId) {
        return reviewRepository.findByProfessionalId(professionalId);
    }

    @Transactional
    public Review submitReview(Long customerId, Long bookingId, int rating, String comment) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: Only the customer who booked can review");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot review a booking that is not completed");
        }

        if (booking.getProfessional() == null) {
            throw new RuntimeException("No professional assigned to this booking to review");
        }

        Review review = Review.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .professional(booking.getProfessional())
                .service(booking.getService())
                .rating(rating)
                .comment(comment)
                .build();

        Review saved = reviewRepository.save(review);

        // Update professional rating stats
        updateProfessionalRating(booking.getProfessional().getId());

        // Notify professional
        notificationService.sendNotification(booking.getProfessional(), "New Review Received", 
                "You received a new rating of " + rating + " stars from " + booking.getCustomer().getFullName());

        return saved;
    }

    private void updateProfessionalRating(Long professionalId) {
        ProfessionalProfile profile = professionalProfileRepository.findByUserId(professionalId)
                .orElseThrow(() -> new RuntimeException("Professional profile not found"));

        List<Review> reviews = reviewRepository.findByProfessionalId(professionalId);
        int totalReviews = reviews.size();
        double sum = reviews.stream().mapToDouble(Review::getRating).sum();
        double averageRating = totalReviews > 0 ? sum / totalReviews : 0.0;

        profile.setRating(Math.round(averageRating * 10.0) / 10.0); // Round to 1 decimal place
        profile.setTotalRatings(totalReviews);
        professionalProfileRepository.save(profile);
    }
}
