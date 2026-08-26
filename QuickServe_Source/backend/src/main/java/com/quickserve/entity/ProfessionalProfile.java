package com.quickserve.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "professional_profiles")
public class ProfessionalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private Specialization specialization;

    private int experienceYears;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String city;

    private String serviceArea;

    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    private double rating = 0.0;

    private int totalRatings = 0;

    private String idType;

    private String idNumber;

    public ProfessionalProfile() {}

    public ProfessionalProfile(Long id, User user, Specialization specialization, int experienceYears, String bio,
                               String city, String serviceArea, VerificationStatus verificationStatus,
                               AvailabilityStatus availabilityStatus, double rating, int totalRatings) {
        this(id, user, specialization, experienceYears, bio, city, serviceArea, verificationStatus,
                availabilityStatus, rating, totalRatings, null, null);
    }

    public ProfessionalProfile(Long id, User user, Specialization specialization, int experienceYears, String bio,
                               String city, String serviceArea, VerificationStatus verificationStatus,
                               AvailabilityStatus availabilityStatus, double rating, int totalRatings,
                               String idType, String idNumber) {
        this.id = id;
        this.user = user;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.bio = bio;
        this.city = city;
        this.serviceArea = serviceArea;
        this.verificationStatus = verificationStatus != null ? verificationStatus : VerificationStatus.PENDING;
        this.availabilityStatus = availabilityStatus != null ? availabilityStatus : AvailabilityStatus.AVAILABLE;
        this.rating = rating;
        this.totalRatings = totalRatings;
        this.idType = idType;
        this.idNumber = idNumber;
    }

    public static ProfessionalProfileBuilder builder() {
        return new ProfessionalProfileBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Specialization getSpecialization() { return specialization; }
    public void setSpecialization(Specialization specialization) { this.specialization = specialization; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getServiceArea() { return serviceArea; }
    public void setServiceArea(String serviceArea) { this.serviceArea = serviceArea; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public AvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getTotalRatings() { return totalRatings; }
    public void setTotalRatings(int totalRatings) { this.totalRatings = totalRatings; }

    public String getIdType() { return idType; }
    public void setIdType(String idType) { this.idType = idType; }

    public String getIdNumber() { return idNumber; }
    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }

    // Builder Pattern
    public static class ProfessionalProfileBuilder {
        private Long id;
        private User user;
        private Specialization specialization;
        private int experienceYears;
        private String bio;
        private String city;
        private String serviceArea;
        private VerificationStatus verificationStatus;
        private AvailabilityStatus availabilityStatus;
        private double rating;
        private int totalRatings;
        private String idType;
        private String idNumber;

        public ProfessionalProfileBuilder id(Long id) { this.id = id; return this; }
        public ProfessionalProfileBuilder user(User user) { this.user = user; return this; }
        public ProfessionalProfileBuilder specialization(Specialization specialization) { this.specialization = specialization; return this; }
        public ProfessionalProfileBuilder experienceYears(int experienceYears) { this.experienceYears = experienceYears; return this; }
        public ProfessionalProfileBuilder bio(String bio) { this.bio = bio; return this; }
        public ProfessionalProfileBuilder city(String city) { this.city = city; return this; }
        public ProfessionalProfileBuilder serviceArea(String serviceArea) { this.serviceArea = serviceArea; return this; }
        public ProfessionalProfileBuilder verificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; return this; }
        public ProfessionalProfileBuilder availabilityStatus(AvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; return this; }
        public ProfessionalProfileBuilder rating(double rating) { this.rating = rating; return this; }
        public ProfessionalProfileBuilder totalRatings(int totalRatings) { this.totalRatings = totalRatings; return this; }
        public ProfessionalProfileBuilder idType(String idType) { this.idType = idType; return this; }
        public ProfessionalProfileBuilder idNumber(String idNumber) { this.idNumber = idNumber; return this; }

        public ProfessionalProfile build() {
            return new ProfessionalProfile(id, user, specialization, experienceYears, bio, city, serviceArea,
                    verificationStatus, availabilityStatus, rating, totalRatings, idType, idNumber);
        }
    }
}
