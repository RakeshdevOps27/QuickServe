package com.quickserve.repository;

import com.quickserve.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProfessionalId(Long professionalId);
    List<Review> findByServiceId(Long serviceId);
}
