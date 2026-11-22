package org.example.service;

import org.example.dto.AccountCatalogDto;
import org.example.dto.AccountLoadoutDto;
import org.example.dto.AccountLoadoutRequest;

public interface AccountService {
    AccountCatalogDto getCatalog();
    AccountLoadoutDto getLoadout(Long userId);
    AccountLoadoutDto saveLoadout(AccountLoadoutRequest request);
}
