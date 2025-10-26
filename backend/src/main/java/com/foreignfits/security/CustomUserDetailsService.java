package com.foreignfits.security;

import com.foreignfits.entity.User;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final RolePermissionMapper rolePermissionMapper;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is disabled");
        }
        
        // Get all permissions for this user's role
        Set<String> permissions = rolePermissionMapper.getPermissionsForRole(user.getRole());
        
        // Create authorities list with both role and permissions
        List<GrantedAuthority> authorities = new ArrayList<>();
        // Add role authority (for backward compatibility if needed)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        // Add all permission authorities
        permissions.forEach(permission -> 
            authorities.add(new SimpleGrantedAuthority(permission))
        );
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }
}