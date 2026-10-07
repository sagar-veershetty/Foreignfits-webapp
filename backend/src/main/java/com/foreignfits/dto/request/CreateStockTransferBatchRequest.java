package com.foreignfits.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CreateStockTransferBatchRequest {
    @NotEmpty
    @Size(max = 250)
    private List<@jakarta.validation.constraints.NotNull @Valid CreateStockTransferRequest> items;
}
