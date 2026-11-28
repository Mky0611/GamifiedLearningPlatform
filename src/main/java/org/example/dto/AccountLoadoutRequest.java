package org.example.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountLoadoutRequest {
    private Long userId;

    @NotBlank
    @JsonAlias({"selectedUnitCode"})
    private String unitCode;

    @NotBlank
    @JsonAlias({"selectedAvatarKey"})
    private String avatarCode;
}
