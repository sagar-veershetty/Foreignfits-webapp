package com.foreignfits.security;

import com.foreignfits.entity.User;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Maps user roles to their permissions
 */
@Component
public class RolePermissionMapper {
    
    /**
     * Get all permissions for a given role
     */
    public Set<String> getPermissionsForRole(User.UserRole role) {
        return switch (role) {
            case ADMIN -> getAdminPermissions();
            case WAREHOUSE -> getWarehousePermissions();
            case SALES -> getSalesPermissions();
        };
    }
    
    /**
     * Admin has full access to system management but cannot create sales (sales-only operation)
     * Has cross-location access to view all data
     */
    private Set<String> getAdminPermissions() {
        return Set.of(
            // Products
            Permission.VIEW_PRODUCTS.getPermission(),
            Permission.ADD_PRODUCT.getPermission(),
            Permission.EDIT_PRODUCT.getPermission(),
            Permission.DELETE_PRODUCT.getPermission(),
            Permission.APPROVE_PRODUCT.getPermission(), // Admin can approve products
            Permission.MANAGE_INVENTORY.getPermission(),
            
            // Sales (view only, cannot create)
            Permission.VIEW_SALES.getPermission(),
            Permission.VIEW_SALES_HISTORY.getPermission(),
            Permission.VIEW_SALES_ANALYTICS.getPermission(),
            
            // Stock movements (create, view, and approve)
            Permission.VIEW_STOCK_MOVEMENTS.getPermission(),
            Permission.CREATE_STOCK_MOVEMENT.getPermission(), // Admin can create stock movements
            Permission.APPROVE_STOCK_MOVEMENT.getPermission(), // Admin can approve stock movements
            
            // Stock transfers (full access)
            Permission.REQUEST_STOCK_TRANSFER.getPermission(), // Admin can create transfers
            Permission.APPROVE_STOCK_TRANSFER.getPermission(), // Admin can approve transfers
            Permission.COMPLETE_STOCK_TRANSFER.getPermission(), // Admin can complete transfers
            Permission.CANCEL_STOCK_TRANSFER.getPermission(), // Admin can cancel transfers
            Permission.VIEW_STOCK_TRANSFERS.getPermission(), // Admin can view transfers
            
            // User management
            Permission.VIEW_USERS.getPermission(),
            Permission.CREATE_USER.getPermission(),
            Permission.EDIT_USER.getPermission(),
            Permission.DELETE_USER.getPermission(),
            Permission.APPROVE_USERS.getPermission(), // Admin can approve user registrations
            
            // Location management
            Permission.VIEW_LOCATIONS.getPermission(),
            Permission.MANAGE_LOCATIONS.getPermission(),
            Permission.CROSS_LOCATION_ACCESS.getPermission(),
            
            // Reports & System
            Permission.VIEW_REPORTS.getPermission(),
            Permission.EXPORT_DATA.getPermission(),
            Permission.MANAGE_SETTINGS.getPermission()
        );
    }
    
    /**
     * Warehouse manager can manage inventory, handle stock transfers, view products
     * Restricted to their assigned location
     * Note: ADD_PRODUCT is admin-only
     */
    private Set<String> getWarehousePermissions() {
        return Set.of(
            // Products (view and edit only, no add)
            Permission.VIEW_PRODUCTS.getPermission(),
            Permission.EDIT_PRODUCT.getPermission(),
            Permission.APPROVE_PRODUCT.getPermission(),
            
            // Inventory
            Permission.MANAGE_INVENTORY.getPermission(),
            Permission.VIEW_INVENTORY.getPermission(),
            
            // Stock movements
            Permission.VIEW_STOCK_MOVEMENTS.getPermission(),
            Permission.CREATE_STOCK_MOVEMENT.getPermission(),
            Permission.APPROVE_STOCK_MOVEMENT.getPermission(), // Warehouse can approve stock movements
            
            // Stock transfers
            Permission.REQUEST_STOCK_TRANSFER.getPermission(),
            Permission.APPROVE_STOCK_TRANSFER.getPermission(),
            Permission.COMPLETE_STOCK_TRANSFER.getPermission(),
            Permission.CANCEL_STOCK_TRANSFER.getPermission(),
            Permission.VIEW_STOCK_TRANSFERS.getPermission(),
            
            // Locations (view only)
            Permission.VIEW_LOCATIONS.getPermission()
        );
    }
    
    /**
     * Sales staff can create sales, view products, view sales history
     * Restricted to their assigned store location
     */
    private Set<String> getSalesPermissions() {
        return Set.of(
            // Products (read-only)
            Permission.VIEW_PRODUCTS.getPermission(),
            Permission.VIEW_INVENTORY.getPermission(),
            
            // Sales
            Permission.VIEW_SALES.getPermission(),
            Permission.CREATE_SALE.getPermission(),
            Permission.VIEW_SALES_HISTORY.getPermission(),
            Permission.VIEW_SALES_ANALYTICS.getPermission(),
            
            // Stock movements and transfers
            Permission.VIEW_STOCK_MOVEMENTS.getPermission(),
            Permission.CREATE_STOCK_MOVEMENT.getPermission(),
            Permission.REQUEST_STOCK_TRANSFER.getPermission(),
            
            // Locations (view only)
            Permission.VIEW_LOCATIONS.getPermission()
        );
    }
    
    /**
     * Check if a role has a specific permission
     */
    public boolean hasPermission(User.UserRole role, String permission) {
        return getPermissionsForRole(role).contains(permission);
    }
    
    /**
     * Check if a role has cross-location access (Admin only)
     */
    public boolean hasCrossLocationAccess(User.UserRole role) {
        return role == User.UserRole.ADMIN;
    }
}
