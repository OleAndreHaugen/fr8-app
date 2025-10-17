"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries, type Country } from "@/lib/country-data";

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function CountryPhoneInput({ 
  value, 
  onChange, 
  error, 
  disabled = false,
  placeholder = "Phone number"
}: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Norway
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse the full phone number when value changes
  useEffect(() => {
    if (value) {
      for (const country of countries) {
        if (value.startsWith(country.phoneCode)) {
          setSelectedCountry(country);
          setPhoneNumber(value.substring(country.phoneCode.length));
          return;
        }
      }
      // If no country code found, assume it's just the number
      setPhoneNumber(value);
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const fullNumber = `${country.phoneCode}${phoneNumber}`;
      onChange(fullNumber);
    }
  };

  const handlePhoneChange = (number: string) => {
    setPhoneNumber(number);
    const fullNumber = `${selectedCountry.phoneCode}${number}`;
    onChange(fullNumber);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Mobile Phone</Label>
      <div className="flex gap-2">
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.phoneCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.phoneCode}</span>
                  <span className="text-xs text-muted-foreground ml-2">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id="phone"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
