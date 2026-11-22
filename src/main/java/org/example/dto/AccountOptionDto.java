package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountOptionDto {
    private String code;
    private String name;
    private String imageUrl;
    private String role;
    private String note;
}
