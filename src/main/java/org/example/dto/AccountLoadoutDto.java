package org.example.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountLoadoutDto {
    private Long userId;
    private String unitCode;
    private String avatarCode;

    @JsonProperty("selectedUnitCode")
    public String getSelectedUnitCode() {
        return unitCode;
    }

    @JsonProperty("selectedAvatarKey")
    public String getSelectedAvatarKey() {
        return avatarCode;
    }
}
