package com.quickserve.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private int durationMinutes = 60;

    private String imageUrl;

    public Service() {}

    public Service(Long id, Category category, String name, String description, BigDecimal price, int durationMinutes, String imageUrl) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.imageUrl = imageUrl;
    }

    public static ServiceBuilder builder() {
        return new ServiceBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    // Builder
    public static class ServiceBuilder {
        private Long id;
        private Category category;
        private String name;
        private String description;
        private BigDecimal price;
        private int durationMinutes = 60;
        private String imageUrl;

        public ServiceBuilder id(Long id) { this.id = id; return this; }
        public ServiceBuilder category(Category category) { this.category = category; return this; }
        public ServiceBuilder name(String name) { this.name = name; return this; }
        public ServiceBuilder description(String description) { this.description = description; return this; }
        public ServiceBuilder price(BigDecimal price) { this.price = price; return this; }
        public ServiceBuilder durationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public ServiceBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }

        public Service build() {
            return new Service(id, category, name, description, price, durationMinutes, imageUrl);
        }
    }
}
