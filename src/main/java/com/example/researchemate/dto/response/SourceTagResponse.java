// SourceTagsResponse.java (dto/response)
package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

@Getter
@Builder
@AllArgsConstructor
public class SourceTagResponse {
    private Long sourceId;
    private Set<String> tags;
}