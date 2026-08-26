package com.quickserve.controller;

import com.quickserve.service.CurrencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/currency")
public class CurrencyController {

    @Autowired
    private CurrencyService currencyService;

    @GetMapping("/rate")
    public ResponseEntity<Map<String, Object>> getExchangeRate(@RequestParam(defaultValue = "USD") String target) {
        BigDecimal rate = currencyService.getRate(target);
        Map<String, Object> response = new HashMap<>();
        response.put("base", "INR");
        response.put("target", target.toUpperCase());
        response.put("rate", rate);
        return ResponseEntity.ok(response);
    }
}
