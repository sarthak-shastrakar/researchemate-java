package com.example.researchemate.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String name;
    private String currentPassword;
    private String newPassword;
}
