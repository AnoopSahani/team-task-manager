package com.taskmanager.service;

import com.taskmanager.dto.AuthDtos.*;
import com.taskmanager.entity.User;
import com.taskmanager.exception.ApiException;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = User.builder()
                .name(req.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .build();
        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
