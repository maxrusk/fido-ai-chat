import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface DataCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataCollectionModal({ isOpen, onClose }: DataCollectionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    businessType: '',
    companySize: '',
    loanNeeds: [] as string[],
    monthlyRevenue: '',
    primaryGoals: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        businessType: user.businessType || '',
        companySize: user.companySize || '',
        loanNeeds: user.loanNeeds || [],
        monthlyRevenue: user.monthlyRevenue || '',
        primaryGoals: user.primaryGoals || '',
      });
    }
  }, [user]);

  const updateDataMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/user/preferences', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Success",
        description: "Business information saved successfully",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save business information",
        variant: "destructive",
      });
    },
  });

  const handleLoanNeedChange = (need: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      loanNeeds: checked 
        ? [...prev.loanNeeds, need]
        : prev.loanNeeds.filter(n => n !== need)
    }));
  };

  const handleSave = () => {
    updateDataMutation.mutate(formData);
  };

  const loanOptions = [
    'SBA Express Loan',
    'Working Capital',
    'Equipment Financing',
    'Real Estate Purchase',
    'Business Expansion',
    'Inventory Financing',
    'Debt Refinancing',
    'Startup Capital',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Business Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Type
            </Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select business type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail Store</SelectItem>
                <SelectItem value="restaurant-food">Restaurant/Food Service</SelectItem>
                <SelectItem value="professional-services">Professional Services</SelectItem>
                <SelectItem value="healthcare">Healthcare/Medical</SelectItem>
                <SelectItem value="construction">Construction/Contracting</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="transportation">Transportation/Logistics</SelectItem>
                <SelectItem value="technology">Technology/Software</SelectItem>
                <SelectItem value="beauty-wellness">Beauty/Wellness</SelectItem>
                <SelectItem value="automotive">Automotive Services</SelectItem>
                <SelectItem value="agriculture">Agriculture/Farming</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Size
            </Label>
            <Select
              value={formData.companySize}
              onValueChange={(value) => setFormData({ ...formData, companySize: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select company size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo entrepreneur</SelectItem>
                <SelectItem value="2-10">2-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="200+">200+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Loan Needs
            </Label>
            <div className="space-y-3">
              {loanOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.loanNeeds.includes(option)}
                    onCheckedChange={(checked) => handleLoanNeedChange(option, checked as boolean)}
                  />
                  <Label
                    htmlFor={option}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Monthly Revenue
            </Label>
            <Select
              value={formData.monthlyRevenue}
              onValueChange={(value) => setFormData({ ...formData, monthlyRevenue: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select revenue range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-10k">$0 - $10,000</SelectItem>
                <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                <SelectItem value="500k+">$500,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Goals
            </Label>
            <Textarea
              value={formData.primaryGoals}
              onChange={(e) => setFormData({ ...formData, primaryGoals: e.target.value })}
              placeholder="Tell us about your business goals and how we can help..."
              className="mt-2 h-20 resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateDataMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {updateDataMutation.isPending ? "Saving..." : "Save Information"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
