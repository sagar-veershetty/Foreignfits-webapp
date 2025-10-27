package com.foreignfits.security;

/**
 * System-wide permissions for role-based access control
 */
public enum Permission {
    // Product & Inventory Management
    VIEW_PRODUCTS("view:products"),
    ADD_PRODUCT("add:product"),
    EDIT_PRODUCT("edit:product"),
    DELETE_PRODUCT("delete:product"),
    APPROVE_PRODUCT("approve:product"), // Approve/reject pending products
    MANAGE_INVENTORY("manage:inventory"),
    VIEW_INVENTORY("view:inventory"), // View location-based inventory
    
    // Sales Management
    VIEW_SALES("view:sales"),
    CREATE_SALE("create:sale"),
    VIEW_SALES_HISTORY("view:sales_history"),
    VIEW_SALES_ANALYTICS("view:sales_analytics"),
    
    // Stock Movement & Transfer
    VIEW_STOCK_MOVEMENTS("view:stock_movements"),
    CREATE_STOCK_MOVEMENT("create:stock_movement"),
    APPROVE_STOCK_MOVEMENT("approve:stock_movement"), // Approve/reject stock movements
    ADJUST_STOCK("adjust:stock"), // Admin-only: adjust stock quantities
    REQUEST_STOCK_TRANSFER("request:stock_transfer"),
    APPROVE_STOCK_TRANSFER("approve:stock_transfer"),
    COMPLETE_STOCK_TRANSFER("complete:stock_transfer"),
    CANCEL_STOCK_TRANSFER("cancel:stock_transfer"),
    VIEW_STOCK_TRANSFERS("view:stock_transfers"),
    
    // User Management
    VIEW_USERS("view:users"),
    CREATE_USER("create:user"),
    EDIT_USER("edit:user"),
    DELETE_USER("delete:user"),
    APPROVE_USERS("approve:users"), // Admin-only: approve/reject pending user registrations
    
    // Location Management
    VIEW_LOCATIONS("view:locations"),
    MANAGE_LOCATIONS("manage:locations"),
    CROSS_LOCATION_ACCESS("cross:location_access"), // Admin-only: access data across all locations
    
    // Reports & Analytics
    VIEW_REPORTS("view:reports"),
    EXPORT_DATA("export:data"),
    
    // Loyalty Program
    VIEW_LOYALTY("view:loyalty"),
    MANAGE_LOYALTY("manage:loyalty"),
    EARN_LOYALTY_POINTS("earn:loyalty_points"),
    REDEEM_LOYALTY_POINTS("redeem:loyalty_points"),
    
    // System Settings
    MANAGE_SETTINGS("manage:settings");
    
    private final String permission;
    
    Permission(String permission) {
        this.permission = permission;
    }
    
    public String getPermission() {
        return permission;
    }
    
    @Override
    public String toString() {
        return permission;
    }
}
