package com.quickserve.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CurrencyService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String API_URL = "https://open.er-api.com/v6/latest/INR";
    private static final BigDecimal FALLBACK_USD_RATE = new BigDecimal("0.012");

    private BigDecimal cachedUsdRate = null;
    private LocalDateTime cacheExpiry = null;

    public synchronized BigDecimal getRate(String targetCurrency) {
        if (targetCurrency == null || "INR".equalsIgnoreCase(targetCurrency)) {
            return BigDecimal.ONE;
        }
        if (!"USD".equalsIgnoreCase(targetCurrency)) {
            throw new IllegalArgumentException("Unsupported currency: " + targetCurrency);
        }

        // Check cache validity
        if (cachedUsdRate != null && cacheExpiry != null && LocalDateTime.now().isBefore(cacheExpiry)) {
            return cachedUsdRate;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(API_URL, Map.class);
            if (response != null && "success".equals(response.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) response.get("rates");
                if (rates != null && rates.containsKey("USD")) {
                    Number usdNumber = (Number) rates.get("USD");
                    BigDecimal liveRate = new BigDecimal(usdNumber.toString());
                    
                    // Update cache for 1 hour
                    cachedUsdRate = liveRate;
                    cacheExpiry = LocalDateTime.now().plusHours(1);
                    System.out.println("Live exchange rate fetched successfully: " + liveRate);
                    return liveRate;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch live exchange rate from API. Using fallback: " + e.getMessage());
        }

        // Return fallback and cache it for 5 minutes in case of api failure (to avoid hammering)
        cachedUsdRate = FALLBACK_USD_RATE;
        cacheExpiry = LocalDateTime.now().plusMinutes(5);
        return FALLBACK_USD_RATE;
    }

    public BigDecimal convert(BigDecimal amountInInr, String targetCurrency) {
        BigDecimal rate = getRate(targetCurrency);
        return amountInInr.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
}
