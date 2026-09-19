package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummerizeRequest {

    @NotBlank(message = "Content is required")
    private String content;
}