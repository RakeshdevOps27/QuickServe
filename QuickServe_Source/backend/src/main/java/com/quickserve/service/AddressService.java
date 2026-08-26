package com.quickserve.service;

import com.quickserve.entity.Address;
import com.quickserve.entity.User;
import com.quickserve.repository.AddressRepository;
import com.quickserve.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Address> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdAndActiveTrue(userId);
    }

    public Address getAddressById(Long id) {
        return addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + id));
    }

    @Transactional
    public Address createAddress(Long userId, Address address) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        address.setUser(user);

        if (address.isDefault()) {
            resetDefaultAddress(userId);
        }

        // If this is the user's first address, make it default automatically
        List<Address> existing = addressRepository.findByUserIdAndActiveTrue(userId);
        if (existing.isEmpty()) {
            address.setDefault(true);
        }

        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(Long userId, Long addressId, Address addressDetails) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized address modification");
        }

        address.setStreetAddress(addressDetails.getStreetAddress());
        address.setCity(addressDetails.getCity());
        address.setState(addressDetails.getState());
        address.setZipCode(addressDetails.getZipCode());
        address.setLandmark(addressDetails.getLandmark());

        if (addressDetails.isDefault() && !address.isDefault()) {
            resetDefaultAddress(userId);
            address.setDefault(true);
        } else if (!addressDetails.isDefault() && address.isDefault()) {
            // Can't unset default unless another default is set, let's keep it default
            address.setDefault(true);
        }

        return addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized address deletion");
        }

        // Soft delete: toggle active status and reset default flag
        address.setActive(false);
        boolean wasDefault = address.isDefault();
        address.setDefault(false);
        addressRepository.save(address);

        // If we deleted the default address, make the first remaining active address default
        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdAndActiveTrue(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    private void resetDefaultAddress(Long userId) {
        List<Address> addresses = addressRepository.findByUserIdAndActiveTrue(userId);
        for (Address addr : addresses) {
            if (addr.isDefault()) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
