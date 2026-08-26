package com.quickserve.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "addresses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String streetAddress;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String zipCode;

    private String landmark;

    private boolean isDefault = false;

    @Column(nullable = false)
    private boolean active = true;

    public Address() {}

    public Address(Long id, User user, String streetAddress, String city, String state, String zipCode, String landmark, boolean isDefault) {
        this.id = id;
        this.user = user;
        this.streetAddress = streetAddress;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.landmark = landmark;
        this.isDefault = isDefault;
        this.active = true;
    }

    public static AddressBuilder builder() {
        return new AddressBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean isDefault) { this.isDefault = isDefault; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    // Builder
    public static class AddressBuilder {
        private Long id;
        private User user;
        private String streetAddress;
        private String city;
        private String state;
        private String zipCode;
        private String landmark;
        private boolean isDefault;

        public AddressBuilder id(Long id) { this.id = id; return this; }
        public AddressBuilder user(User user) { this.user = user; return this; }
        public AddressBuilder streetAddress(String streetAddress) { this.streetAddress = streetAddress; return this; }
        public AddressBuilder city(String city) { this.city = city; return this; }
        public AddressBuilder state(String state) { this.state = state; return this; }
        public AddressBuilder zipCode(String zipCode) { this.zipCode = zipCode; return this; }
        public AddressBuilder landmark(String landmark) { this.landmark = landmark; return this; }
        public AddressBuilder isDefault(boolean isDefault) { this.isDefault = isDefault; return this; }

        public Address build() {
            return new Address(id, user, streetAddress, city, state, zipCode, landmark, isDefault);
        }
    }
}
