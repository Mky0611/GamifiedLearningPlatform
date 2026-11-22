package org.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuthRegisterRequest {

    @NotBlank(message = "Username khong duoc de trong")
    @Size(min = 4, max = 50, message = "Username phai tu 4 den 50 ky tu")
    private String username;

    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    @Size(max = 120, message = "Email toi da 120 ky tu")
    private String email;

    @NotBlank(message = "Password khong duoc de trong")
    @Size(min = 6, max = 100, message = "Password phai tu 6 den 100 ky tu")
    private String password;

    @NotBlank(message = "Display name khong duoc de trong")
    @Size(min = 2, max = 100, message = "Display name phai tu 2 den 100 ky tu")
    private String displayName;
}
