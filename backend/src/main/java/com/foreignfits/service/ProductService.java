package com.foreignfits.service;

import org.springframework.beans.factory.annotation.Autowired;
import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.request.CreateProductRequest;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public Optional<ProductDto> getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::convertToDto);
    }
    
    public Optional<ProductDto> getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::convertToDto);
    }
    
    public Optional<ProductDto> getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .map(this::convertToDto);
    }
    
    public List<ProductDto> getProductsByCategory(Product.ProductCategory category) {
        return productRepository.findByCategory(category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> getProductsByLocation(Long locationId) {
        return productRepository.findByLocationId(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> searchProducts(String searchTerm) {
        return productRepository.findBySearchTerm(searchTerm).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public ProductDto createProduct(CreateProductRequest request) {
        // Validate SKU uniqueness
        if (productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }
        
        // Validate barcode uniqueness if provided
        if (request.getBarcode() != null && productRepository.existsByBarcode(request.getBarcode())) {
            throw new RuntimeException("Product with barcode " + request.getBarcode() + " already exists");
        }
        
        // Get location
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
        
        Product product = new Product();
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setWholesaleMinQuantity(request.getWholesaleMinQuantity());
        product.setStock(request.getStock());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setImageUrls(request.getImageUrls());
        product.setLocation(location);
        
        Product savedProduct = productRepository.save(product);
        return convertToDto(savedProduct);
    }
    
    public ProductDto updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        // Validate SKU uniqueness (excluding current product)
        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }
        
        // Validate barcode uniqueness if provided (excluding current product)
        if (request.getBarcode() != null && 
            !request.getBarcode().equals(product.getBarcode()) && 
            productRepository.existsByBarcode(request.getBarcode())) {
            throw new RuntimeException("Product with barcode " + request.getBarcode() + " already exists");
        }
        
        // Get location if changed
        if (!product.getLocation().getId().equals(request.getLocationId())) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
            product.setLocation(location);
        }
        
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setWholesaleMinQuantity(request.getWholesaleMinQuantity());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setImageUrls(request.getImageUrls());
        
        Product savedProduct = productRepository.save(product);
        return convertToDto(savedProduct);
    }
    
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
    
    public ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setSize(product.getSize());
        dto.setColor(product.getColor());
        dto.setPrice(product.getPrice());
        dto.setCost(product.getCost());
        dto.setWholesalePrice(product.getWholesalePrice());
        dto.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
        dto.setStock(product.getStock());
        dto.setMinStock(product.getMinStock());
        dto.setSku(product.getSku());
        dto.setDescription(product.getDescription());
        dto.setBarcode(product.getBarcode());
        dto.setImageUrls(product.getImageUrls());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        
        // Convert location
        if (product.getLocation() != null) {
            LocationDto locationDto = new LocationDto();
            locationDto.setId(product.getLocation().getId());
            locationDto.setName(product.getLocation().getName());
            locationDto.setType(product.getLocation().getType());
            locationDto.setAddress(product.getLocation().getAddress());
            locationDto.setCity(product.getLocation().getCity());
            locationDto.setState(product.getLocation().getState());
            locationDto.setZipCode(product.getLocation().getZipCode());
            locationDto.setPhone(product.getLocation().getPhone());
            locationDto.setManager(product.getLocation().getManager());
            locationDto.setCapacity(product.getLocation().getCapacity());
            locationDto.setIsActive(product.getLocation().getIsActive());
            dto.setLocation(locationDto);
        }
        
        return dto;
    }
}