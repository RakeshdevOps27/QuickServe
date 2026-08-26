package com.quickserve.dto;

import java.util.Map;

public class AdminAnalyticsDto {
    private long totalCustomers;
    private long totalProfessionals;
    private long totalBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long activeBookings;
    private double totalRevenue;
    private Map<String, Long> monthlyBookings;

    public AdminAnalyticsDto() {}

    public AdminAnalyticsDto(long totalCustomers, long totalProfessionals, long totalBookings, long completedBookings,
                             long cancelledBookings, long activeBookings, double totalRevenue, Map<String, Long> monthlyBookings) {
        this.totalCustomers = totalCustomers;
        this.totalProfessionals = totalProfessionals;
        this.totalBookings = totalBookings;
        this.completedBookings = completedBookings;
        this.cancelledBookings = cancelledBookings;
        this.activeBookings = activeBookings;
        this.totalRevenue = totalRevenue;
        this.monthlyBookings = monthlyBookings;
    }

    public static AdminAnalyticsDtoBuilder builder() {
        return new AdminAnalyticsDtoBuilder();
    }

    // Getters and Setters
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getTotalProfessionals() { return totalProfessionals; }
    public void setTotalProfessionals(long totalProfessionals) { this.totalProfessionals = totalProfessionals; }

    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }

    public long getCompletedBookings() { return completedBookings; }
    public void setCompletedBookings(long completedBookings) { this.completedBookings = completedBookings; }

    public long getCancelledBookings() { return cancelledBookings; }
    public void setCancelledBookings(long cancelledBookings) { this.cancelledBookings = cancelledBookings; }

    public long getActiveBookings() { return activeBookings; }
    public void setActiveBookings(long activeBookings) { this.activeBookings = activeBookings; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public Map<String, Long> getMonthlyBookings() { return monthlyBookings; }
    public void setMonthlyBookings(Map<String, Long> monthlyBookings) { this.monthlyBookings = monthlyBookings; }

    // Builder
    public static class AdminAnalyticsDtoBuilder {
        private long totalCustomers;
        private long totalProfessionals;
        private long totalBookings;
        private long completedBookings;
        private long cancelledBookings;
        private long activeBookings;
        private double totalRevenue;
        private Map<String, Long> monthlyBookings;

        public AdminAnalyticsDtoBuilder totalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; return this; }
        public AdminAnalyticsDtoBuilder totalProfessionals(long totalProfessionals) { this.totalProfessionals = totalProfessionals; return this; }
        public AdminAnalyticsDtoBuilder totalBookings(long totalBookings) { this.totalBookings = totalBookings; return this; }
        public AdminAnalyticsDtoBuilder completedBookings(long completedBookings) { this.completedBookings = completedBookings; return this; }
        public AdminAnalyticsDtoBuilder cancelledBookings(long cancelledBookings) { this.cancelledBookings = cancelledBookings; return this; }
        public AdminAnalyticsDtoBuilder activeBookings(long activeBookings) { this.activeBookings = activeBookings; return this; }
        public AdminAnalyticsDtoBuilder totalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; return this; }
        public AdminAnalyticsDtoBuilder monthlyBookings(Map<String, Long> monthlyBookings) { this.monthlyBookings = monthlyBookings; return this; }

        public AdminAnalyticsDto build() {
            return new AdminAnalyticsDto(totalCustomers, totalProfessionals, totalBookings, completedBookings,
                    cancelledBookings, activeBookings, totalRevenue, monthlyBookings);
        }
    }
}
