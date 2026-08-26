package com.quickserve.repository;

import com.quickserve.entity.Booking;
import com.quickserve.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByProfessionalId(Long professionalId);
    
    @Query("SELECT b FROM Booking b WHERE b.professional.id = :professionalId AND b.bookingDate = :date AND b.status IN :activeStatuses")
    List<Booking> findActiveBookingsByProfessionalAndDate(
            @Param("professionalId") Long professionalId,
            @Param("date") LocalDate date,
            @Param("activeStatuses") List<BookingStatus> activeStatuses);
}
