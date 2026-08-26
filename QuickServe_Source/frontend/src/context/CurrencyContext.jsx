import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('currency') || 'INR';
  });
  const [exchangeRate, setExchangeRate] = useState(0.012); // Fallback USD rate

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await api.get('/api/currency/rate?target=USD');
      if (response.data && response.data.rate) {
        setExchangeRate(response.data.rate);
      }
    } catch (err) {
      console.warn('Failed to fetch exchange rate from API. Using local fallback (0.012).', err);
    }
  };

  const setCurrency = (newCurrency) => {
    localStorage.setItem('currency', newCurrency);
    setCurrencyState(newCurrency);
  };

  const convert = (amountInINR) => {
    if (!amountInINR) return 0;
    if (currency === 'INR') {
      return amountInINR;
    }
    return amountInINR * exchangeRate;
  };

  const format = (amountInINR) => {
    if (amountInINR === undefined || amountInINR === null) return '';
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amountInINR);
    } else {
      const converted = amountInINR * exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(converted);
    }
  };

  // Safe historical formatter that uses snapshotted rate/currency from database entries
  const formatHistorical = (amountInINR, txnCurrency, txnRate) => {
    if (amountInINR === undefined || amountInINR === null) return '';
    const activeCurrency = txnCurrency || 'INR';
    const rate = txnRate || 1.0;
    
    if (activeCurrency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amountInINR);
    } else {
      const converted = amountInINR * rate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(converted);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, convert, format, formatHistorical }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
