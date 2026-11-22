package org.example.repository;

import org.example.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select u
            from User u
            where lower(u.username) = lower(:keyword)
               or lower(u.email) = lower(:keyword)
            """)
    Optional<User> findByUsernameOrEmail(@Param("keyword") String keyword);

    List<User> findTop8ByStatusOrderByXpTotalDesc(String status);
}
