"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Calculator,
  DollarSign,
  Fuel,
  MapPin,
  Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Database } from "@/types/database";

type RouteData = Database['public']['Tables']['routes']['Insert'];

interface NewCalculationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  // General Section
  customer: string;
  route: string;
  stemSize: string;
  intakeTolerance: string;
  intake: string;
  totalDuration: string;
  bunkerPort: string;
  delivery: string;
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

const TERMS_OPTIONS = ['FOB', 'CIF', 'CFR', 'EXW', 'FAS', 'DAP', 'DDP'];

export function NewCalculationModal({ open, onOpenChange, onSuccess }: NewCalculationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customer: '',
    route: '',
    stemSize: '',
    intakeTolerance: '10%',
    intake: '',
    totalDuration: '',
    bunkerPort: '',
    delivery: '',
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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seasonalExpanded, setSeasonalExpanded] = useState(false);
  
  const { profile } = useUserProfile();

  // Calculate freight rate summary
  const calculateFreightRate = () => {
    const loadRate = parseFloat(formData.loadRate) || 0;
    const dischargeRate = parseFloat(formData.dischargeRate) || 0;
    const vlsfoCost = parseFloat(formData.totalVlsfoConsumption) || 0;
    const lsmgoCost = parseFloat(formData.totalLsmgoConsumption) || 0;
    const pdaCost = parseFloat(formData.totalPda) || 0;
    const miscCost = parseFloat(formData.totalMisc) || 0;
    
    const totalCost = vlsfoCost + lsmgoCost + pdaCost + miscCost;
    const freightRate = loadRate + dischargeRate + totalCost;
    
    return {
      freightRate,
      vlsfoCost,
      lsmgoCost,
      pdaCost,
      miscCost,
      totalCost
    };
  };

  const freightCalculation = calculateFreightRate();

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
        name: `${formData.customer} - ${formData.route}`,
        account_id: profile?.account_id || null,
        customer: formData.customer,
        route: formData.route,
        port_load: formData.loadPort,
        port_disch: formData.dischargePort,
        terms_load: formData.loadTerms,
        terms_disch: formData.dischargeTerms,
        rate_load: parseFloat(formData.loadRate) || null,
        rate_disch: parseFloat(formData.dischargeRate) || null,
        difference: parseFloat(formData.dischargeRate) - parseFloat(formData.loadRate) || null,
        duration: parseFloat(formData.totalDuration) || null,
        total_vlsfo: parseFloat(formData.totalVlsfoConsumption) || null,
        total_lsmgo: parseFloat(formData.totalLsmgoConsumption) || null,
        total_pda: parseFloat(formData.totalPda) || null,
        total_misc: parseFloat(formData.totalMisc) || null,
        comission: parseFloat(formData.commission) || null,
        comission_adress: parseFloat(formData.addressCommission) || null,
        intake: parseFloat(formData.intake) || null,
        intake_tolerance: formData.intakeTolerance,
        rate: freightCalculation.freightRate,
        fuel: 'Mixed',
        terms: `${formData.loadTerms} / ${formData.dischargeTerms}`,
        stemsize: parseFloat(formData.stemSize) || null,
        sys_name: `${formData.stemSize}' ${formData.intakeTolerance} ${formData.loadPort}-${formData.dischargePort} ${formData.intake} satpm / ${formData.intake} satpm ${formData.commission}%+${formData.addressCommission}%`,
        savedBy: user.email || 'Unknown',
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
      };
      
      const { error } = await supabase
        .from('routes')
        .insert(routeData);
      
      if (error) throw error;
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        customer: '',
        route: '',
        stemSize: '',
        intakeTolerance: '10%',
        intake: '',
        totalDuration: '',
        bunkerPort: '',
        delivery: '',
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
      });
      
    } catch (error) {
      console.error('Error creating calculation:', error);
      setErrors({ submit: 'Failed to create calculation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">Freight Details</DialogTitle>
        </DialogHeader>

        {/* Freight Rate Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Freight Rate Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Freight Rate</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${freightCalculation.freightRate.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground flex items-center justify-center">
                  <Fuel className="h-4 w-4 mr-1" />
                  VLSFO
                </div>
                <div className="text-lg font-semibold text-red-600">
                  ${freightCalculation.vlsfoCost.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground flex items-center justify-center">
                  <Fuel className="h-4 w-4 mr-1" />
                  LSMGO
                </div>
                <div className="text-lg font-semibold text-red-600">
                  ${freightCalculation.lsmgoCost.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-xl font-bold text-green-600">
                  ${freightCalculation.totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">INFO</TabsTrigger>
            <TabsTrigger value="terms">TERMS</TabsTrigger>
            <TabsTrigger value="attachment">ATTACHMENT (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* General Section */}
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer" className="text-sm font-medium">
                        Customer <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customer"
                        value={formData.customer}
                        onChange={(e) => handleInputChange('customer', e.target.value)}
                        className={errors.customer ? 'border-red-500' : ''}
                        placeholder="Enter customer name"
                      />
                      {errors.customer && (
                        <p className="text-sm text-red-500">{errors.customer}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="route" className="text-sm font-medium">
                        Route <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="route"
                          value={formData.route}
                          onChange={(e) => handleInputChange('route', e.target.value)}
                          className={errors.route ? 'border-red-500' : ''}
                          placeholder="Enter route"
                        />
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                      {errors.route && (
                        <p className="text-sm text-red-500">{errors.route}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="stemSize" className="text-sm font-medium">
                        Stem Size <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="stemSize"
                        value={formData.stemSize}
                        onChange={(e) => handleInputChange('stemSize', e.target.value)}
                        className={errors.stemSize ? 'border-red-500' : ''}
                        placeholder="e.g., 66"
                      />
                      {errors.stemSize && (
                        <p className="text-sm text-red-500">{errors.stemSize}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="intakeTolerance" className="text-sm font-medium">
                        Intake Tolerance
                      </Label>
                      <Select
                        value={formData.intakeTolerance}
                        onValueChange={(value) => handleInputChange('intakeTolerance', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5%">5%</SelectItem>
                          <SelectItem value="10%">10%</SelectItem>
                          <SelectItem value="15%">15%</SelectItem>
                          <SelectItem value="20%">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="intake" className="text-sm font-medium">
                        Intake <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="intake"
                        value={formData.intake}
                        onChange={(e) => handleInputChange('intake', e.target.value)}
                        className={errors.intake ? 'border-red-500' : ''}
                        placeholder="e.g., 8000"
                      />
                      {errors.intake && (
                        <p className="text-sm text-red-500">{errors.intake}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="totalDuration" className="text-sm font-medium">
                        Total Duration <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="totalDuration"
                        value={formData.totalDuration}
                        onChange={(e) => handleInputChange('totalDuration', e.target.value)}
                        className={errors.totalDuration ? 'border-red-500' : ''}
                        placeholder="Days"
                      />
                      {errors.totalDuration && (
                        <p className="text-sm text-red-500">{errors.totalDuration}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bunkerPort" className="text-sm font-medium">
                        Bunker Port <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="bunkerPort"
                          value={formData.bunkerPort}
                          onChange={(e) => handleInputChange('bunkerPort', e.target.value)}
                          className={errors.bunkerPort ? 'border-red-500' : ''}
                          placeholder="Enter bunker port"
                        />
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                      {errors.bunkerPort && (
                        <p className="text-sm text-red-500">{errors.bunkerPort}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="delivery" className="text-sm font-medium">
                        Delivery
                      </Label>
                      <Input
                        id="delivery"
                        value={formData.delivery}
                        onChange={(e) => handleInputChange('delivery', e.target.value)}
                        placeholder="Delivery terms"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fob" className="text-sm font-medium">
                        FOB
                      </Label>
                      <div className="relative">
                        <Input
                          id="fob"
                          value={formData.fob}
                          onChange={(e) => handleInputChange('fob', e.target.value)}
                          placeholder="FOB terms"
                        />
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Port Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Port
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="loadPort" className="text-sm font-medium">
                        Load Port <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="loadPort"
                          value={formData.loadPort}
                          onChange={(e) => handleInputChange('loadPort', e.target.value)}
                          className={errors.loadPort ? 'border-red-500' : ''}
                          placeholder="Enter load port"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPort('loadPort', 'dischargePort')}
                          className="h-10 px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.loadPort && (
                        <p className="text-sm text-red-500">{errors.loadPort}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dischargePort" className="text-sm font-medium">
                        Discharge Port <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="dischargePort"
                          value={formData.dischargePort}
                          onChange={(e) => handleInputChange('dischargePort', e.target.value)}
                          className={errors.dischargePort ? 'border-red-500' : ''}
                          placeholder="Enter discharge port"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPort('dischargePort', 'loadPort')}
                          className="h-10 px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.dischargePort && (
                        <p className="text-sm text-red-500">{errors.dischargePort}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="loadRate" className="text-sm font-medium">
                        Load Rate <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="loadRate"
                        type="number"
                        value={formData.loadRate}
                        onChange={(e) => handleInputChange('loadRate', e.target.value)}
                        className={errors.loadRate ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.loadRate && (
                        <p className="text-sm text-red-500">{errors.loadRate}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dischargeRate" className="text-sm font-medium">
                        Discharge Rate <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dischargeRate"
                        type="number"
                        value={formData.dischargeRate}
                        onChange={(e) => handleInputChange('dischargeRate', e.target.value)}
                        className={errors.dischargeRate ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.dischargeRate && (
                        <p className="text-sm text-red-500">{errors.dischargeRate}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="loadTerms" className="text-sm font-medium">
                        Load Terms <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.loadTerms}
                        onValueChange={(value) => handleInputChange('loadTerms', value)}
                      >
                        <SelectTrigger className={errors.loadTerms ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          {TERMS_OPTIONS.map((term) => (
                            <SelectItem key={term} value={term}>{term}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.loadTerms && (
                        <p className="text-sm text-red-500">{errors.loadTerms}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dischargeTerms" className="text-sm font-medium">
                        Discharge Terms <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.dischargeTerms}
                        onValueChange={(value) => handleInputChange('dischargeTerms', value)}
                      >
                        <SelectTrigger className={errors.dischargeTerms ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          {TERMS_OPTIONS.map((term) => (
                            <SelectItem key={term} value={term}>{term}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.dischargeTerms && (
                        <p className="text-sm text-red-500">{errors.dischargeTerms}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="totalVlsfoConsumption" className="text-sm font-medium">
                        Total VLSFO Consumption <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="totalVlsfoConsumption"
                        type="number"
                        value={formData.totalVlsfoConsumption}
                        onChange={(e) => handleInputChange('totalVlsfoConsumption', e.target.value)}
                        className={errors.totalVlsfoConsumption ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.totalVlsfoConsumption && (
                        <p className="text-sm text-red-500">{errors.totalVlsfoConsumption}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="totalLsmgoConsumption" className="text-sm font-medium">
                        Total LSMGO Consumption <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="totalLsmgoConsumption"
                        type="number"
                        value={formData.totalLsmgoConsumption}
                        onChange={(e) => handleInputChange('totalLsmgoConsumption', e.target.value)}
                        className={errors.totalLsmgoConsumption ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.totalLsmgoConsumption && (
                        <p className="text-sm text-red-500">{errors.totalLsmgoConsumption}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="totalPda" className="text-sm font-medium">
                        Total PDA <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="totalPda"
                        type="number"
                        value={formData.totalPda}
                        onChange={(e) => handleInputChange('totalPda', e.target.value)}
                        className={errors.totalPda ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.totalPda && (
                        <p className="text-sm text-red-500">{errors.totalPda}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="totalMisc" className="text-sm font-medium">
                        Total MISC <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="totalMisc"
                        type="number"
                        value={formData.totalMisc}
                        onChange={(e) => handleInputChange('totalMisc', e.target.value)}
                        className={errors.totalMisc ? 'border-red-500' : ''}
                        placeholder="0.00"
                      />
                      {errors.totalMisc && (
                        <p className="text-sm text-red-500">{errors.totalMisc}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="commission" className="text-sm font-medium">
                        Commission (%)
                      </Label>
                      <Input
                        id="commission"
                        type="number"
                        value={formData.commission}
                        onChange={(e) => handleInputChange('commission', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressCommission" className="text-sm font-medium">
                        Address Commission (%)
                      </Label>
                      <Input
                        id="addressCommission"
                        type="number"
                        value={formData.addressCommission}
                        onChange={(e) => handleInputChange('addressCommission', e.target.value)}
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
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Seasonal differences to curve
                  </CardTitle>
                  {seasonalExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {seasonalExpanded && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MONTHS.map((month) => (
                      <div key={month.key} className="space-y-2">
                        <Label className="text-sm font-medium">{month.label}</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            value={formData.seasonalDifferences[month.key as keyof typeof formData.seasonalDifferences].value}
                            onChange={(e) => handleSeasonalChange(month.key, 'value', e.target.value)}
                            placeholder="0.00"
                            className="flex-1"
                          />
                          <Select
                            value={formData.seasonalDifferences[month.key as keyof typeof formData.seasonalDifferences].unit}
                            onValueChange={(value) => handleSeasonalChange(month.key, 'unit', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="" value="">USD</SelectItem>
                              <SelectItem key="%" value="%">%</SelectItem>                              
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
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  <p className="font-medium">Terms & Conditions</p>
                  <p className="text-sm mt-2">Terms configuration will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachment">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  <p className="font-medium">Attachments</p>
                  <p className="text-sm mt-2">File attachments will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Calculation'}
          </Button>
        </div>

        {errors.submit && (
          <div className="text-center text-red-500 text-sm">
            {errors.submit}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
