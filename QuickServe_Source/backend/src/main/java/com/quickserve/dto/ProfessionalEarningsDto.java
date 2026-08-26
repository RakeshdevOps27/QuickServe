package com.quickserve.dto;

import com.quickserve.entity.Booking;
import com.quickserve.entity.Review;
import java.util.List;

public class ProfessionalEarningsDto {
    private int completedJobsCount;
    private double totalEarnings;
    private double averageRating;
    private List<Booking> completedBookings;
    private List<Review> reviews;

    public ProfessionalEarningsDto() {}

    public ProfessionalEarningsDto(int completedJobsCount, double totalEarnings, double averageRating, List<Booking> completedBookings, List<Review> reviews) {
        this.completedJobsCount = completedJobsCount;
        this.totalEarnings = totalEarnings;
        this.averageRating = averageRating;
        this.completedBookings = completedBookings;
        this.reviews = reviews;
    }

    public static ProfessionalEarningsDtoBuilder builder() {
        return new ProfessionalEarningsDtoBuilder();
    }

    // Getters and Setters
    public int getCompletedJobsCount() { return completedJobsCount; }
    public void setCompletedJobsCount(int completedJobsCount) { this.completedJobsCount = completedJobsCount; }

    public double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public List<Booking> getCompletedBookings() { return completedBookings; }
    public void setCompletedBookings(List<Booking> completedBookings) { this.completedBookings = completedBookings; }

    public List<Review> getReviews() { return reviews; }
    public void setReviews(List<Review> reviews) { this.reviews = reviews; }

    // Builder
    public static class ProfessionalEarningsDtoBuilder {
        private int completedJobsCount;
        private double totalEarnings;
        private double averageRating;
        private List<Booking> completedBookings;
        private List<Review> reviews;

        public ProfessionalEarningsDtoBuilder completedJobsCount(int completedJobsCount) { this.completedJobsCount = completedJobsCount; return this; }
        public ProfessionalEarningsDtoBuilder totalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; return this; }
        public ProfessionalEarningsDtoBuilder averageRating(double averageRating) { this.averageRating = averageRating; return this; }
        public ProfessionalEarningsDtoBuilder completedBookings(List<Booking> completedBookings) { this.completedBookings = completedBookings; return this; }
        public ProfessionalEarningsDtoBuilder reviews(List<Review> reviews) { this.reviews = reviews; return this; }

        public ProfessionalEarningsDto build() {
            return new ProfessionalEarningsDto(completedJobsCount, totalEarnings, averageRating, completedBookings, reviews);
        }
    }
}
