"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortsDialog } from "@/components/ui/ports-dialog";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Calculator,
  Fuel,
  MapPin,
  Calendar,
  Save,
  X,
  FileText,
  Search
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/types/database";
import { calculateFreightRate } from "@/lib/freight-calculator";
import { RichTextEditor } from "@/components/ui/rich-text-editor-wrapper";

type RouteData = Database['public']['Tables']['routes']['Insert'];

interface FormData {
  rate: number;

  rates: {
    rate0: number;
    rate1: number;
    rate2: number;
    rate3: number;
    rate4: number;
    rate5: number;
    rate6: number;
    rate7: number;
    rate8: number;
    rate9: number;
    rate10: number;
    rate11: number;
  };

  // General Section
  customer: string;
  route: string;
  stemSize: string;
  intakeTolerance: string;
  intake: string;
  totalDuration: string;
  bunkerPort: string;
  difference: string;
  fob: string;

  // Port Section
  loadPort: string;
  dischargePort: string;
  loadRate: string;
  dischargeRate: string;
  loadTerms: string;
  dischargeTerms: string;

  // Calculation Section
  totalVlsfoConsumption: string;
  totalLsmgoConsumption: string;
  totalPda: string;
  totalMisc: string;
  commission: string;
  addressCommission: string;

  // Seasonal Differences
  seasonalDifferences: {
    jan: { value: string; unit: string };
    feb: { value: string; unit: string };
    mar: { value: string; unit: string };
    apr: { value: string; unit: string };
    may: { value: string; unit: string };
    jun: { value: string; unit: string };
    jul: { value: string; unit: string };
    aug: { value: string; unit: string };
    sep: { value: string; unit: string };
    oct: { value: string; unit: string };
    nov: { value: string; unit: string };
    dec: { value: string; unit: string };
  };

  // Terms & Conditions
  termsConditions: string;
}

const MONTHS = [
  { key: 'jan', label: 'January' },
  { key: 'feb', label: 'February' },
  { key: 'mar', label: 'March' },
  { key: 'apr', label: 'April' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'June' },
  { key: 'jul', label: 'July' },
  { key: 'aug', label: 'August' },
  { key: 'sep', label: 'September' },
  { key: 'oct', label: 'October' },
  { key: 'nov', label: 'November' },
  { key: 'dec', label: 'December' },
];

const TERMS_OPTIONS = ['daps', 'fhinc', 'fshex', 'hours', 'satpm', 'satsx', 'shex', 'shinc', 'sshex', 'Thurs12/Sun0800'];

export default function NewCalculationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('id');
  const isEditMode = !!routeId;
  const [formData, setFormData] = useState<FormData>({
    rate: 0,
    rates: {
      rate0: 0,
      rate1: 0,
      rate2: 0,
      rate3: 0,
      rate4: 0,
      rate5: 0,
      rate6: 0,
      rate7: 0,
      rate8: 0,
      rate9: 0,
      rate10: 0,
      rate11: 0,
    },
    customer: '',
    route: '',
    stemSize: '',
    intakeTolerance: '10%',
    intake: '',
    totalDuration: '',
    bunkerPort: '',
    difference: '',
    fob: '',
    loadPort: '',
    dischargePort: '',
    loadRate: '',
    dischargeRate: '',
    loadTerms: '',
    dischargeTerms: '',
    totalVlsfoConsumption: '',
    totalLsmgoConsumption: '',
    totalPda: '',
    totalMisc: '',
    commission: '',
    addressCommission: '',
    seasonalDifferences: {
      jan: { value: '', unit: 'USD' },
      feb: { value: '', unit: 'USD' },
      mar: { value: '', unit: 'USD' },
      apr: { value: '', unit: 'USD' },
      may: { value: '', unit: 'USD' },
      jun: { value: '', unit: 'USD' },
      jul: { value: '', unit: 'USD' },
      aug: { value: '', unit: 'USD' },
      sep: { value: '', unit: 'USD' },
      oct: { value: '', unit: 'USD' },
      nov: { value: '', unit: 'USD' },
      dec: { value: '', unit: 'USD' },
    },
    termsConditions: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seasonalExpanded, setSeasonalExpanded] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [ffaContracts, setFfaContracts] = useState<string[]>([]);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [fuelNames, setFuelNames] = useState<string[]>([]);
  const [bunkerSearchTerm, setBunkerSearchTerm] = useState('');
  const [showBunkerDropdown, setShowBunkerDropdown] = useState(false);
  const [showLoadPortDialog, setShowLoadPortDialog] = useState(false);
  const [showDischargePortDialog, setShowDischargePortDialog] = useState(false);
  const [selectedLoadPort, setSelectedLoadPort] = useState<{ id: string; name: string; country: string } | null>(null);
  const [selectedDischargePort, setSelectedDischargePort] = useState<{ id: string; name: string; country: string } | null>(null);

  // Request deduplication
  const [isLoadingFfa, setIsLoadingFfa] = useState(false);
  const [isLoadingFuel, setIsLoadingFuel] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { profile } = useUserProfile();
  const { toast } = useToast();

  // Fetch FFA contracts
  const fetchFfaContracts = async () => {
    if (isLoadingFfa || ffaContracts.length > 0) return; // Skip if already loading or loaded

    setIsLoadingFfa(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ffa')
        .select('contract')
        .order('contract');

      if (error) throw error;

      const contracts = data?.map(item => item.contract) || [];
      setFfaContracts(contracts);
    } catch (error) {
      console.error('Error fetching FFA contracts:', error);
    } finally {
      setIsLoadingFfa(false);
    }
  };

  // Fetch fuel names
  const fetchFuelNames = async () => {
    if (isLoadingFuel || fuelNames.length > 0) return; // Skip if already loading or loaded

    setIsLoadingFuel(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fuel')
        .select('product')
        .order('product');

      if (error) throw error;

      // Get unique product values
      const uniqueProducts = [...new Set(data?.map(item => item.product) || [])];
      setFuelNames(uniqueProducts);
    } catch (error) {
      console.error('Error fetching fuel names:', error);
    } finally {
      setIsLoadingFuel(false);
    }
  };

  // Fetch port data by ID - DEPRECATED: Ports now stored as names
  // const fetchPortById = async (portId: string) => {
  //   // This function is no longer needed since we store port names directly
  // };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (isEditMode && routeId) {
        // In edit mode, load everything together
        await Promise.all([
          fetchFfaContracts(),
          fetchFuelNames()
        ]);

        // Then load route data
        await loadRouteData();
      } else {
        // In create mode, just load dropdown data
        await Promise.all([
          fetchFfaContracts(),
          fetchFuelNames()
        ]);
      }
    };

    loadInitialData();
  }, [isEditMode, routeId]);

  // Load existing route data if in edit mode
  const loadRouteData = async () => {
    if (!routeId) return;

    try {
      const supabase = createClient();
      const { data: routeData, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (error) {
        console.error('Error fetching route data:', error);
        setErrors({ submit: 'Failed to load calculation data' });
        return;
      }

      if (routeData) {
        // Ports are now stored as names, not IDs
        // Set selected ports if we have port names
        if (routeData.port_load) {
          setSelectedLoadPort({
            id: '', // No longer needed
            name: routeData.port_load,
            country: '' // We don't have country info from the route data
          });
        }

        if (routeData.port_disch) {
          setSelectedDischargePort({
            id: '', // No longer needed
            name: routeData.port_disch,
            country: '' // We don't have country info from the route data
          });
        }

        // Populate form data
        setFormData({
          rate: routeData.rate || 0,
          rates: routeData.rates || {},
          customer: routeData.customer || '',
          route: routeData.route || '',
          stemSize: routeData.stemsize?.toString() || '',
          intakeTolerance: routeData.intake_tolerance || '10%',
          intake: routeData.intake?.toString() || '',
          totalDuration: routeData.duration?.toString() || '',
          bunkerPort: routeData.fuel || '',
          difference: routeData.difference?.toString() || '',
          fob: routeData.fobid || '',
          loadPort: routeData.port_load || '',
          dischargePort: routeData.port_disch || '',
          loadRate: routeData.rate_load?.toString() || '',
          dischargeRate: routeData.rate_disch?.toString() || '',
          loadTerms: routeData.terms_load || '',
          dischargeTerms: routeData.terms_disch || '',
          totalVlsfoConsumption: routeData.total_vlsfo?.toString() || '',
          totalLsmgoConsumption: routeData.total_lsmgo?.toString() || '',
          totalPda: routeData.total_pda?.toString() || '',
          totalMisc: routeData.total_misc?.toString() || '',
          commission: routeData.commission?.toString() || '',
          addressCommission: routeData.commission_adress?.toString() || '',
          seasonalDifferences: {
            jan: { value: routeData.diff_jan?.toString() || '', unit: routeData.diff_jan_unit || 'USD' },
            feb: { value: routeData.diff_feb?.toString() || '', unit: routeData.diff_feb_unit || 'USD' },
            mar: { value: routeData.diff_mar?.toString() || '', unit: routeData.diff_mar_unit || 'USD' },
            apr: { value: routeData.diff_apr?.toString() || '', unit: routeData.diff_apr_unit || 'USD' },
            may: { value: routeData.diff_may?.toString() || '', unit: routeData.diff_may_unit || 'USD' },
            jun: { value: routeData.diff_jun?.toString() || '', unit: routeData.diff_jun_unit || 'USD' },
            jul: { value: routeData.diff_jul?.toString() || '', unit: routeData.diff_jul_unit || 'USD' },
            aug: { value: routeData.diff_aug?.toString() || '', unit: routeData.diff_aug_unit || 'USD' },
            sep: { value: routeData.diff_sep?.toString() || '', unit: routeData.diff_sep_unit || 'USD' },
            oct: { value: routeData.diff_oct?.toString() || '', unit: routeData.diff_oct_unit || 'USD' },
            nov: { value: routeData.diff_nov?.toString() || '', unit: routeData.diff_nov_unit || 'USD' },
            dec: { value: routeData.diff_dec?.toString() || '', unit: routeData.diff_dec_unit || 'USD' },
          },
          termsConditions: routeData.terms || '',
        });

        // Set search terms for dropdowns
        setRouteSearchTerm(routeData.route || '');
        setBunkerSearchTerm(routeData.fuel || '');

      }
    } catch (error) {
      console.error('Error loading route data:', error);
      setErrors({ submit: 'Failed to load calculation data' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.route-dropdown-container')) {
        setShowRouteDropdown(false);
      }
      if (!target.closest('.bunker-dropdown-container')) {
        setShowBunkerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate freight rate using API - only for new calculations (not edit mode)
  useEffect(() => {
    const performCalculation = async () => {
      // Skip calculation entirely if we're in edit mode
      if (isEditMode) return;

      // Only calculate if we have the required fields
      if (!formData.totalDuration ||
        !formData.route ||
        !formData.bunkerPort) {
        return;
      }

      // Skip if already calculating
      if (isCalculating) return;

      setIsCalculating(true);
      setCalculationLoading(true);

      try {
        const routeData = {
          id: routeId || '', // Include the route ID for the calculation
          total_vlsfo: parseFloat(formData.totalVlsfoConsumption),
          total_lsmgo: parseFloat(formData.totalLsmgoConsumption),
          total_pda: parseFloat(formData.totalPda),
          total_misc: parseFloat(formData.totalMisc),
          intake: parseFloat(formData.intake),
          stemsize: parseFloat(formData.stemSize),
          duration: parseFloat(formData.totalDuration),
          route: formData.route,
          fuel: formData.bunkerPort,
          difference: parseFloat(formData.difference),
          commission: parseFloat(formData.commission),
          commission_adress: parseFloat(formData.addressCommission),
          calcMonth: null,
        };        

        const result = await calculateFreightRate(routeData);
        setFormData(prev => ({
          ...prev,
          rate: result.freightRate,
          rates: result.freightRates || prev.rates
        }));
      } catch (error) {
        console.error('Calculation error:', error);
        // Keep existing values on error
      } finally {
        setCalculationLoading(false);
        setIsCalculating(false);
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(performCalculation, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.loadRate,
    formData.dischargeRate,
    formData.totalVlsfoConsumption,
    formData.totalLsmgoConsumption,
    formData.totalPda,
    formData.totalMisc,
    formData.intake,
    formData.stemSize,
    formData.totalDuration,
    formData.route,
    formData.bunkerPort,
    formData.difference,
    formData.commission,
    formData.addressCommission,
    isEditMode,
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

  };

  // Handle route search and selection
  const handleRouteSearch = (value: string) => {
    setRouteSearchTerm(value);
    setShowRouteDropdown(true);
  };

  const handleRouteSelect = (contract: string) => {
    setFormData(prev => ({
      ...prev,
      route: contract
    }));
    setRouteSearchTerm(contract);
    setShowRouteDropdown(false);

    // Clear error when user selects
    if (errors.route) {
      setErrors(prev => ({
        ...prev,
        route: ''
      }));
    }
  };

  // Filter contracts based on search term
  const filteredContracts = ffaContracts.filter(contract =>
    contract.toLowerCase().includes(routeSearchTerm.toLowerCase())
  );

  // If search term is empty or matches exactly, show all contracts
  const displayContracts = routeSearchTerm === '' ? ffaContracts : filteredContracts;

  // Handle bunker port search and selection
  const handleBunkerSearch = (value: string) => {
    setBunkerSearchTerm(value);
    setShowBunkerDropdown(true);
  };

  const handleBunkerSelect = (name: string) => {
    setFormData(prev => ({
      ...prev,
      bunkerPort: name
    }));
    setBunkerSearchTerm(name);
    setShowBunkerDropdown(false);

    // Clear error when user selects
    if (errors.bunkerPort) {
      setErrors(prev => ({
        ...prev,
        bunkerPort: ''
      }));
    }
  };

  // Filter fuel names based on search term
  const filteredFuelNames = fuelNames.filter(name =>
    name.toLowerCase().includes(bunkerSearchTerm.toLowerCase())
  );

  // If search term is empty or matches exactly, show all fuel names
  const displayFuelNames = bunkerSearchTerm === '' ? fuelNames : filteredFuelNames;

  // Handle port selection
  const handleLoadPortSelect = (port: { id: string; name: string; country: string }) => {
    setSelectedLoadPort(port);
    setFormData(prev => ({
      ...prev,
      loadPort: port.name
    }));

    // Clear error when user selects
    if (errors.loadPort) {
      setErrors(prev => ({
        ...prev,
        loadPort: ''
      }));
    }
  };

  const handleDischargePortSelect = (port: { id: string; name: string; country: string }) => {
    setSelectedDischargePort(port);
    setFormData(prev => ({
      ...prev,
      dischargePort: port.name
    }));

    // Clear error when user selects
    if (errors.dischargePort) {
      setErrors(prev => ({
        ...prev,
        dischargePort: ''
      }));
    }
  };

  const handleSeasonalChange = (month: string, field: 'value' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      seasonalDifferences: {
        ...prev.seasonalDifferences,
        [month]: {
          ...prev.seasonalDifferences[month as keyof typeof prev.seasonalDifferences],
          [field]: value
        }
      }
    }));
  };

  const copyPort = (fromPort: string, toPort: string) => {
    setFormData(prev => ({
      ...prev,
      [toPort]: prev[fromPort as keyof FormData]
    }));
  };

  // Construct system name with proper calculations
  const constructSysName = () => {
    const stemSize = parseInt(formData.stemSize) / 1000 || '';
    const intakeTolerance = formData.intakeTolerance || '';
    const loadPortName = selectedLoadPort?.name || formData.loadPort || '';
    const dischargePortName = selectedDischargePort?.name || formData.dischargePort || '';
    const intake = formData.intake || '';
    const commission = formData.commission || '0';
    const addressCommission = formData.addressCommission || '0';
    const loadRate = parseFloat(formData.loadRate) || 0;
    const dischargeRate = parseFloat(formData.dischargeRate) || 0;

    // Format commission values
    const commissionValue = parseFloat(commission) || 0;
    const addressCommissionValue = parseFloat(addressCommission) || 0;

    // Construct the system name with proper formatting
    const sysName = `${stemSize}' ${intakeTolerance} ${loadPortName}-${dischargePortName} ${loadRate} satpm / ${dischargeRate} satpm ${addressCommissionValue}%+${commissionValue}%`;

    return sysName;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields = [
      'customer', 'route', 'stemSize', 'intake', 'totalDuration',
      'bunkerPort', 'loadPort', 'dischargePort', 'loadRate', 'dischargeRate',
      'loadTerms', 'dischargeTerms', 'totalVlsfoConsumption', 'totalLsmgoConsumption',
      'totalPda', 'totalMisc'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {

      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prepare route data for insertion
      const routeData: RouteData = {
        account_id: profile?.account_id || null,
        customer: formData.customer,
        route: formData.route,
        difference: parseFloat(formData.difference) || null,
        port_load: formData.loadPort,
        port_disch: formData.dischargePort,
        terms_load: formData.loadTerms,
        terms_disch: formData.dischargeTerms,
        rate_load: parseFloat(formData.loadRate) || null,
        rate_disch: parseFloat(formData.dischargeRate) || null,
        duration: parseFloat(formData.totalDuration) || null,
        total_vlsfo: parseFloat(formData.totalVlsfoConsumption) || null,
        total_lsmgo: parseFloat(formData.totalLsmgoConsumption) || null,
        total_pda: parseFloat(formData.totalPda) || null,
        total_misc: parseFloat(formData.totalMisc) || null,
        commission: parseFloat(formData.commission) || null,
        commission_adress: parseFloat(formData.addressCommission) || null,
        intake: parseFloat(formData.intake) || null,
        intake_tolerance: formData.intakeTolerance,
        rate: formData.rate,
        fuel: formData.bunkerPort,
        stemsize: parseFloat(formData.stemSize) || null,
        sys_name: constructSysName(),
        active: true,
        // Seasonal differences
        diff_jan: parseFloat(formData.seasonalDifferences.jan.value) || null,
        diff_feb: parseFloat(formData.seasonalDifferences.feb.value) || null,
        diff_mar: parseFloat(formData.seasonalDifferences.mar.value) || null,
        diff_apr: parseFloat(formData.seasonalDifferences.apr.value) || null,
        diff_may: parseFloat(formData.seasonalDifferences.may.value) || null,
        diff_jun: parseFloat(formData.seasonalDifferences.jun.value) || null,
        diff_jul: parseFloat(formData.seasonalDifferences.jul.value) || null,
        diff_aug: parseFloat(formData.seasonalDifferences.aug.value) || null,
        diff_sep: parseFloat(formData.seasonalDifferences.sep.value) || null,
        diff_oct: parseFloat(formData.seasonalDifferences.oct.value) || null,
        diff_nov: parseFloat(formData.seasonalDifferences.nov.value) || null,
        diff_dec: parseFloat(formData.seasonalDifferences.dec.value) || null,
        diff_jan_unit: formData.seasonalDifferences.jan.unit,
        diff_feb_unit: formData.seasonalDifferences.feb.unit,
        diff_mar_unit: formData.seasonalDifferences.mar.unit,
        diff_apr_unit: formData.seasonalDifferences.apr.unit,
        diff_may_unit: formData.seasonalDifferences.may.unit,
        diff_jun_unit: formData.seasonalDifferences.jun.unit,
        diff_jul_unit: formData.seasonalDifferences.jul.unit,
        diff_aug_unit: formData.seasonalDifferences.aug.unit,
        diff_sep_unit: formData.seasonalDifferences.sep.unit,
        diff_oct_unit: formData.seasonalDifferences.oct.unit,
        diff_nov_unit: formData.seasonalDifferences.nov.unit,
        diff_dec_unit: formData.seasonalDifferences.dec.unit,
        fobid: formData.fob,
        rates: formData.rates,
        terms: formData.termsConditions,
      };

      let error;
      if (isEditMode) {
        // Update existing route
        const { error: updateError } = await supabase
          .from('routes')
          .update(routeData)
          .eq('id', routeId);
        error = updateError;
      } else {
        // Insert new route
        const { error: insertError } = await supabase
          .from('routes')
          .insert(routeData);
        error = insertError;
      }

      if (error) throw error;

      // Calculate freight rate before saving
      if (formData.totalDuration && formData.bunkerPort && formData.route) {
        try {
          const routeData = {
            id: routeId || '', // Include the route ID for the calculation
            total_vlsfo: parseFloat(formData.totalVlsfoConsumption),
            total_lsmgo: parseFloat(formData.totalLsmgoConsumption),
            total_pda: parseFloat(formData.totalPda),
            total_misc: parseFloat(formData.totalMisc),
            intake: parseFloat(formData.intake),
            stemsize: parseFloat(formData.stemSize),
            duration: parseFloat(formData.totalDuration),
            route: formData.route,
            fuel: formData.bunkerPort,
            difference: parseFloat(formData.difference),
            commission: parseFloat(formData.commission),
            commission_adress: parseFloat(formData.addressCommission),
            calcMonth: null,
          };

          const result = await calculateFreightRate(routeData, true);
          formData.rate = result.freightRate;
          formData.rates = result.freightRates;
        } catch (error) {
          console.error('Calculation error during save:', error);
          // Continue with existing freight rate if calculation fails
        }
      }

      // Stay on the detail page after successful save
      toast({
        variant: "success",
        title: "Success",
        description: `Calculation ${isEditMode ? 'updated' : 'created'} successfully!`,
      });
      setErrors({}); // Clear any existing errors

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} calculation:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} calculation. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-10 w-full">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full mx-auto px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-10 w-full">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Calculation' : 'New Calculation'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditMode ? 'Edit existing freight calculation' : 'Create a new freight calculation'}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Freight Rate: {formData.rate.toFixed(2)} USD
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/calculations')}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Form Sections */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 p-0 bg-secondary">
              <TabsTrigger value="info" className="text-base py-3 px-6">General Information</TabsTrigger>
              <TabsTrigger value="terms" className="text-base py-3 px-6">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="attachment" className="text-base py-3 px-6">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-8">
              {/* General Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="h-6 w-6 mr-3" />
                    General Information
                  </CardTitle>
                  <CardDescription>
                    Basic details about the freight calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="customer" className="text-base font-medium">
                          Customer <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="customer"
                          value={formData.customer}
                          onChange={(e) => handleInputChange('customer', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.customer ? 'border-red-500' : ''}`}
                          placeholder="Enter customer name"
                        />
                        {errors.customer && (
                          <p className="text-sm text-red-500 mt-1">{errors.customer}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="route" className="text-base font-medium">
                          Route <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-2 route-dropdown-container">
                          <Input
                            id="route"
                            value={routeSearchTerm}
                            onChange={(e) => handleRouteSearch(e.target.value)}
                            onFocus={() => setShowRouteDropdown(true)}
                            className={`h-12 text-base ${errors.route ? 'border-red-500' : ''}`}
                            placeholder="Search and select route"
                          />
                          <ChevronDown className="absolute right-3 top-4 h-5 w-5 text-muted-foreground" />

                          {/* Dropdown */}
                          {showRouteDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {displayContracts.length > 0 ? (
                                displayContracts.map((contract) => (
                                  <div
                                    key={contract}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleRouteSelect(contract)}
                                  >
                                    {contract}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No contracts found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.route && (
                          <p className="text-sm text-red-500 mt-1">{errors.route}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="stemSize" className="text-base font-medium">
                          Stem Size <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="stemSize"
                          type="number"
                          value={formData.stemSize}
                          onChange={(e) => handleInputChange('stemSize', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.stemSize ? 'border-red-500' : ''}`}
                          placeholder="e.g., 66"
                        />
                        {errors.stemSize && (
                          <p className="text-sm text-red-500 mt-1">{errors.stemSize}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="intakeTolerance" className="text-base font-medium">
                          Intake Tolerance
                        </Label>
                        <Select
                          value={formData.intakeTolerance}
                          onValueChange={(value) => handleInputChange('intakeTolerance', value)}
                        >
                          <SelectTrigger className="mt-2 h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5%">5%</SelectItem>
                            <SelectItem value="10%">10%</SelectItem>
                            <SelectItem value="minmax">Min/Max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="intake" className="text-base font-medium">
                          Intake <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="intake"
                          type="number"
                          value={formData.intake}
                          onChange={(e) => handleInputChange('intake', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.intake ? 'border-red-500' : ''}`}
                          placeholder="e.g., 8000"
                        />
                        {errors.intake && (
                          <p className="text-sm text-red-500 mt-1">{errors.intake}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="totalDuration" className="text-base font-medium">
                          Total Duration <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="totalDuration"
                          type="number"
                          value={formData.totalDuration}
                          onChange={(e) => handleInputChange('totalDuration', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.totalDuration ? 'border-red-500' : ''}`}
                          placeholder="Days"
                        />
                        {errors.totalDuration && (
                          <p className="text-sm text-red-500 mt-1">{errors.totalDuration}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="bunkerPort" className="text-base font-medium">
                          Bunker Port <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-2 bunker-dropdown-container">
                          <Input
                            id="bunkerPort"
                            value={bunkerSearchTerm}
                            onChange={(e) => handleBunkerSearch(e.target.value)}
                            onFocus={() => setShowBunkerDropdown(true)}
                            className={`h-12 text-base ${errors.bunkerPort ? 'border-red-500' : ''}`}
                            placeholder="Search and select bunker port"
                          />
                          <ChevronDown className="absolute right-3 top-4 h-5 w-5 text-muted-foreground" />

                          {/* Dropdown */}
                          {showBunkerDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {displayFuelNames.length > 0 ? (
                                displayFuelNames.map((name) => (
                                  <div
                                    key={name}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleBunkerSelect(name)}
                                  >
                                    {name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No fuel names found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.bunkerPort && (
                          <p className="text-sm text-red-500 mt-1">{errors.bunkerPort}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="difference" className="text-base font-medium">
                          Fuel Cost
                        </Label>
                        <Input
                          id="difference"
                          type="number"
                          value={formData.difference}
                          onChange={(e) => handleInputChange('difference', e.target.value)}
                          className="mt-2 h-12 text-base"
                          placeholder="Delivered fuel cost (USD)"
                        />
                      </div>
                      {/*
                      <div>
                        <Label htmlFor="fob" className="text-base font-medium">
                          FOB
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="fob"
                            value={formData.fob}
                            onChange={(e) => handleInputChange('fob', e.target.value)}
                            className="h-12 text-base"
                            placeholder="FOB terms"
                          />
                          <ChevronDown className="absolute right-3 top-4 h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      */
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Port Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <MapPin className="h-6 w-6 mr-3" />
                    Port Information
                  </CardTitle>
                  <CardDescription>
                    Loading and discharge port details with rates and terms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="loadPort" className="text-base font-medium">
                          Load Port <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex-1">
                            <Input
                              id="loadPort"
                              value={formData.loadPort}
                              onChange={(e) => handleInputChange('loadPort', e.target.value)}
                              className={`h-12 text-base ${errors.loadPort ? 'border-red-500' : ''}`}
                              placeholder="Enter port name or select from list"
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowLoadPortDialog(true)}
                            className="h-12 px-4"
                            title="Select from port list"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.loadPort && (
                          <p className="text-sm text-red-500 mt-1">{errors.loadPort}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dischargePort" className="text-base font-medium">
                          Discharge Port <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex-1">
                            <Input
                              id="dischargePort"
                              value={formData.dischargePort}
                              onChange={(e) => handleInputChange('dischargePort', e.target.value)}
                              className={`h-12 text-base ${errors.dischargePort ? 'border-red-500' : ''}`}
                              placeholder="Enter port name or select from list"
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowDischargePortDialog(true)}
                            className="h-12 px-4"
                            title="Select from port list"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.dischargePort && (
                          <p className="text-sm text-red-500 mt-1">{errors.dischargePort}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="loadRate" className="text-base font-medium">
                          Load Rate <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="loadRate"
                          type="number"
                          value={formData.loadRate}
                          onChange={(e) => handleInputChange('loadRate', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.loadRate ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.loadRate && (
                          <p className="text-sm text-red-500 mt-1">{errors.loadRate}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dischargeRate" className="text-base font-medium">
                          Discharge Rate <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dischargeRate"
                          type="number"
                          value={formData.dischargeRate}
                          onChange={(e) => handleInputChange('dischargeRate', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.dischargeRate ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.dischargeRate && (
                          <p className="text-sm text-red-500 mt-1">{errors.dischargeRate}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="loadTerms" className="text-base font-medium">
                          Load Terms <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.loadTerms}
                          onValueChange={(value) => handleInputChange('loadTerms', value)}
                        >
                          <SelectTrigger className={`mt-2 h-12 text-base ${errors.loadTerms ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select terms" />
                          </SelectTrigger>
                          <SelectContent>
                            {TERMS_OPTIONS.map((term) => (
                              <SelectItem key={term} value={term}>{term}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.loadTerms && (
                          <p className="text-sm text-red-500 mt-1">{errors.loadTerms}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dischargeTerms" className="text-base font-medium">
                          Discharge Terms <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.dischargeTerms}
                          onValueChange={(value) => handleInputChange('dischargeTerms', value)}
                        >
                          <SelectTrigger className={`mt-2 h-12 text-base ${errors.dischargeTerms ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select terms" />
                          </SelectTrigger>
                          <SelectContent>
                            {TERMS_OPTIONS.map((term) => (
                              <SelectItem key={term} value={term}>{term}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.dischargeTerms && (
                          <p className="text-sm text-red-500 mt-1">{errors.dischargeTerms}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Calculator className="h-6 w-6 mr-3" />
                    Cost Calculation
                  </CardTitle>
                  <CardDescription>
                    Fuel consumption, port costs, and commission details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="totalVlsfoConsumption" className="text-base font-medium">
                          Total VLSFO Consumption <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="totalVlsfoConsumption"
                          type="number"
                          value={formData.totalVlsfoConsumption}
                          onChange={(e) => handleInputChange('totalVlsfoConsumption', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.totalVlsfoConsumption ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.totalVlsfoConsumption && (
                          <p className="text-sm text-red-500 mt-1">{errors.totalVlsfoConsumption}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="totalLsmgoConsumption" className="text-base font-medium">
                          Total LSMGO Consumption <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="totalLsmgoConsumption"
                          type="number"
                          value={formData.totalLsmgoConsumption}
                          onChange={(e) => handleInputChange('totalLsmgoConsumption', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.totalLsmgoConsumption ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.totalLsmgoConsumption && (
                          <p className="text-sm text-red-500 mt-1">{errors.totalLsmgoConsumption}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="totalPda" className="text-base font-medium">
                          Total PDA <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="totalPda"
                          type="number"
                          value={formData.totalPda}
                          onChange={(e) => handleInputChange('totalPda', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.totalPda ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.totalPda && (
                          <p className="text-sm text-red-500 mt-1">{errors.totalPda}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="totalMisc" className="text-base font-medium">
                          Total MISC <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="totalMisc"
                          type="number"
                          value={formData.totalMisc}
                          onChange={(e) => handleInputChange('totalMisc', e.target.value)}
                          className={`mt-2 h-12 text-base ${errors.totalMisc ? 'border-red-500' : ''}`}
                          placeholder="0.00"
                        />
                        {errors.totalMisc && (
                          <p className="text-sm text-red-500 mt-1">{errors.totalMisc}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="commission" className="text-base font-medium">
                          Commission (%)
                        </Label>
                        <Input
                          id="commission"
                          type="number"
                          value={formData.commission}
                          onChange={(e) => handleInputChange('commission', e.target.value)}
                          className="mt-2 h-12 text-base"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressCommission" className="text-base font-medium">
                          Address Commission (%)
                        </Label>
                        <Input
                          id="addressCommission"
                          type="number"
                          value={formData.addressCommission}
                          onChange={(e) => handleInputChange('addressCommission', e.target.value)}
                          className="mt-2 h-12 text-base"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seasonal Differences Section */}
              <Card>
                <CardHeader>
                  <Button
                    variant="ghost"
                    onClick={() => setSeasonalExpanded(!seasonalExpanded)}
                    className="flex items-center justify-between w-full p-0 h-auto"
                  >
                    <div className="text-left">
                      <CardTitle className="text-xl flex items-center">
                        <Calendar className="h-6 w-6 mr-3" />
                        Seasonal Differences to Curve
                      </CardTitle>
                      <CardDescription>
                        Monthly rate adjustments for seasonal variations
                      </CardDescription>
                    </div>
                    {seasonalExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </CardHeader>
                {seasonalExpanded && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {MONTHS.map((month) => (
                        <div key={month.key} className="space-y-3">
                          <Label className="text-base font-medium">{month.label}</Label>
                          <div className="flex space-x-3">
                            <Input
                              type="number"
                              value={formData.seasonalDifferences[month.key as keyof typeof formData.seasonalDifferences].value}
                              onChange={(e) => handleSeasonalChange(month.key, 'value', e.target.value)}
                              placeholder="0.00"
                              className="flex-1 h-12 text-base"
                            />
                            <Select
                              value={formData.seasonalDifferences[month.key as keyof typeof formData.seasonalDifferences].unit}
                              onValueChange={(value) => handleSeasonalChange(month.key, 'unit', value)}
                            >
                              <SelectTrigger className="w-24 h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="%">%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="h-6 w-6 mr-3" />
                    Terms & Conditions
                  </CardTitle>
                  <CardDescription>
                    Define the terms and conditions for this freight calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="terms" className="text-base font-medium">
                        Terms & Conditions
                      </Label>
                      <div className="mt-2">
                        <RichTextEditor
                          content={formData.termsConditions}
                          onChange={(content) => handleInputChange('termsConditions', content)}
                          placeholder="Enter terms and conditions for this freight calculation..."
                          className="min-h-[300px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachment">
              <Card>
                <CardContent className="pt-8">
                  <div className="text-center text-muted-foreground py-16">
                    <p className="text-xl font-medium mb-4">Attachments</p>
                    <p className="text-base">File attachments will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>


          {/* Error Display */}
          {errors.submit && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p className="font-medium">{errors.submit}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ports Dialogs */}
      <PortsDialog
        open={showLoadPortDialog}
        onOpenChange={setShowLoadPortDialog}
        onSelect={handleLoadPortSelect}
        title="Select Load Port"
        description="Choose a port for loading cargo"
        initialNameFilter={formData.loadPort}
      />

      <PortsDialog
        open={showDischargePortDialog}
        onOpenChange={setShowDischargePortDialog}
        onSelect={handleDischargePortSelect}
        title="Select Discharge Port"
        description="Choose a port for discharging cargo"
        initialNameFilter={formData.dischargePort}
      />
    </div>
  );
}
