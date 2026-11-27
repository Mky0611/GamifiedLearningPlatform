package org.example.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.example.entity.UserProgressionWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserProgressionWalletRepository extends JpaRepository<UserProgressionWallet, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select w from UserProgressionWallet w where w.userId = :userId")
    Optional<UserProgressionWallet> findByUserIdForUpdate(@Param("userId") Long userId);
}
