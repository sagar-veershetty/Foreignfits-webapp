package com.foreignfits.controller;

import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.User;
import com.foreignfits.service.BarcodeHistoryService;
import com.foreignfits.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BarcodeHistoryControllerTest {
    @Test
    void restrictsWarehouseScopeAndRejectsUnboundedRequests() {
        var history = mock(BarcodeHistoryService.class);
        var users = mock(UserService.class);
        var auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("warehouse");
        var user = new UserDto();
        user.setRole(User.UserRole.WAREHOUSE);
        user.setLocationId(5L);
        when(users.getUserByEmail("warehouse")).thenReturn(Optional.of(user));
        var controller = new BarcodeHistoryController(history, users);
        controller.getBarcodeHistory(auth, null, 99L, null, null, null, 0, 100);
        verify(history).getHistoryPage(null, null, 5L, null, null, 0, 100);
        assertEquals(400, controller.getBarcodeHistory(auth, null, null, null, null, null, 0, 10000).getStatusCode().value());
        user.setLocationId(null);
        assertEquals(403, controller.getBarcodeHistory(auth, null, null, null, null, null, 0, 100).getStatusCode().value());
        verifyNoMoreInteractions(history);
    }
}
