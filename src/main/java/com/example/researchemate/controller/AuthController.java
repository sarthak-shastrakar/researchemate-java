package com.example.researchemate.controller;

import com.example.researchemate.Repository.UserRepository;
import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.LoginRequest;
import com.example.researchemate.dto.request.RefreshTokenRequest;
import com.example.researchemate.dto.request.RegisterRequest;
import com.example.researchemate.dto.request.UpdateProfileRequest;
import com.example.researchemate.dto.response.AuthResponse;
import com.example.researchemate.model.User;
import com.example.researchemate.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.aspectj.weaver.ast.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .plainPassword(request.getPassword())
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);

        AuthResponse response = AuthResponse.builder()
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .token(token)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user);

        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .token(token)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    // ── GET /api/auth/me ───────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .token(null)
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Profile fetched", response));
    }

    // ── PUT /api/auth/profile ──────────────────────────────────────────────────
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @RequestBody UpdateProfileRequest request, Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        // Update name if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null ||
                    !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setPlainPassword(request.getNewPassword());
        }

        User saved = userRepository.save(user);
        String newToken = jwtService.generateToken(saved);

        AuthResponse response = AuthResponse.builder()
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .token(newToken)
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String email = jwtService.extractEmail(request.getRefreshToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getRefreshToken().equals(user.getRefreshToken())) {
            throw new IllegalArgumentException("Invalid or revoked refresh token");
        }

        String newAccessToken = jwtService.generateToken(user);

        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .token(newAccessToken)
                .refreshToken(request.getRefreshToken())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        String email = jwtService.extractEmail(request.getRefreshToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setRefreshToken(null); // refresh token invalidate kar do
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

}