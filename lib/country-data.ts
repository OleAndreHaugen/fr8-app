// Country data with flags, codes, and phone codes
export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
}

export const countries: Country[] = [
  { code: "NO", name: "Norway", flag: "🇳🇴", phoneCode: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phoneCode: "+45" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phoneCode: "+46" },
  { code: "FI", name: "Finland", flag: "🇫🇮", phoneCode: "+358" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44" },
  { code: "DE", name: "Germany", flag: "🇩🇪", phoneCode: "+49" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phoneCode: "+31" },
  { code: "FR", name: "France", flag: "🇫🇷", phoneCode: "+33" },
  { code: "ES", name: "Spain", flag: "🇪🇸", phoneCode: "+34" },
  { code: "IT", name: "Italy", flag: "🇮🇹", phoneCode: "+39" },
  { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", phoneCode: "+65" },
  { code: "JP", name: "Japan", flag: "🇯🇵", phoneCode: "+81" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", phoneCode: "+82" },
  { code: "CN", name: "China", flag: "🇨🇳", phoneCode: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", phoneCode: "+55" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return countries.find(country => country.phoneCode === phoneCode);
}

export function formatPhoneNumber(countryCode: string, phoneNumber: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) return phoneNumber;
  
  // Remove any existing country code from the phone number
  const cleanNumber = phoneNumber.replace(/^\+?\d{1,4}/, '');
  return `${country.phoneCode}${cleanNumber}`;
}

export function parsePhoneNumber(fullPhoneNumber: string): { countryCode: string; phoneNumber: string } {
  for (const country of countries) {
    if (fullPhoneNumber.startsWith(country.phoneCode)) {
      return {
        countryCode: country.code,
        phoneNumber: fullPhoneNumber.substring(country.phoneCode.length)
      };
    }
  }
  
  // Default to Norway if no match found
  return {
    countryCode: "NO",
    phoneNumber: fullPhoneNumber
  };
}
