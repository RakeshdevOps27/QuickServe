package com.quickserve.controller;

import com.quickserve.dto.*;
import com.quickserve.entity.*;
import com.quickserve.repository.*;
import com.quickserve.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email is already taken!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        if (request.getRole() == Role.PROFESSIONAL) {
            ProfessionalProfile profile = ProfessionalProfile.builder()
                    .user(savedUser)
                    .specialization(request.getSpecialization())
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .bio(request.getBio())
                    .city(request.getCity())
                    .serviceArea(request.getServiceArea())
                    .verificationStatus(VerificationStatus.PENDING)
                    .availabilityStatus(AvailabilityStatus.AVAILABLE)
                    .rating(0.0)
                    .totalRatings(0)
                    .idType(request.getIdType())
                    .idNumber(request.getIdNumber())
                    .build();
            professionalProfileRepository.save(profile);
        }

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwt)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .id(user.getId())
                .build());
    }
}
