package com.taskmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    public static class SignupRequest {
        @NotBlank @Size(min = 2, max = 100)
        private String name;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6, max = 100)
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String name;
        private String email;
    }
}
