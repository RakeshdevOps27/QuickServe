package com.quickserve.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    public TimeSlot() {}

    public TimeSlot(Long id, LocalTime startTime, LocalTime endTime) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public static TimeSlotBuilder builder() {
        return new TimeSlotBuilder();
    }

    public String getFormattedSlot() {
        return startTime.toString() + " - " + endTime.toString();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    // Builder
    public static class TimeSlotBuilder {
        private Long id;
        private LocalTime startTime;
        private LocalTime endTime;

        public TimeSlotBuilder id(Long id) { this.id = id; return this; }
        public TimeSlotBuilder startTime(LocalTime startTime) { this.startTime = startTime; return this; }
        public TimeSlotBuilder endTime(LocalTime endTime) { this.endTime = endTime; return this; }

        public TimeSlot build() {
            return new TimeSlot(id, startTime, endTime);
        }
    }
}
