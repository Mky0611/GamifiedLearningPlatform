package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuthLoginRequest {

    @NotBlank(message = "Username hoac email khong duoc de trong")
    private String usernameOrEmail;

    @NotBlank(message = "Password khong duoc de trong")
    @Size(min = 6, max = 100, message = "Password phai tu 6 den 100 ky tu")
    private String password;
}
