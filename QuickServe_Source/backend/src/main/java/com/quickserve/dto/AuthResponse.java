package com.quickserve.dto;

import com.quickserve.entity.Role;

public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private Role role;
    private Long id;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String fullName, Role role, Long id) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.id = id;
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    // Builder
    public static class AuthResponseBuilder {
        private String token;
        private String email;
        private String fullName;
        private Role role;
        private Long id;

        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder email(String email) { this.email = email; return this; }
        public AuthResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public AuthResponseBuilder role(Role role) { this.role = role; return this; }
        public AuthResponseBuilder id(Long id) { this.id = id; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, email, fullName, role, id);
        }
    }
}
