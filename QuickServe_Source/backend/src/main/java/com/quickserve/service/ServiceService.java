package com.quickserve.service;

import com.quickserve.entity.Category;
import com.quickserve.repository.CategoryRepository;
import com.quickserve.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<com.quickserve.entity.Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public List<com.quickserve.entity.Service> getServicesByCategory(Long categoryId) {
        return serviceRepository.findByCategoryId(categoryId);
    }

    public com.quickserve.entity.Service getServiceById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
    }

    public com.quickserve.entity.Service createService(Long categoryId, com.quickserve.entity.Service service) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        service.setCategory(category);
        return serviceRepository.save(service);
    }

    public com.quickserve.entity.Service updateService(Long id, com.quickserve.entity.Service serviceDetails) {
        com.quickserve.entity.Service service = getServiceById(id);
        service.setName(serviceDetails.getName());
        service.setDescription(serviceDetails.getDescription());
        service.setPrice(serviceDetails.getPrice());
        service.setDurationMinutes(serviceDetails.getDurationMinutes());
        if (serviceDetails.getImageUrl() != null) {
            service.setImageUrl(serviceDetails.getImageUrl());
        }
        return serviceRepository.save(service);
    }

    public void deleteService(Long id) {
        com.quickserve.entity.Service service = getServiceById(id);
        serviceRepository.delete(service);
    }
}
