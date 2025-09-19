import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState({
    aiModel: 'gpt-4o',
    responseStyle: 'professional',
    temperature: 0.7,
    saveHistory: true,
  });

  useEffect(() => {
    if (user) {
      setPreferences({
        aiModel: user.aiModel || 'gpt-4o',
        responseStyle: user.responseStyle || 'professional',
        temperature: parseFloat(user.temperature || '0.7'),
        saveHistory: user.saveHistory ?? true,
      });
    }
  }, [user]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', '/api/user/preferences', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Success",
        description: "Preferences updated successfully",
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
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      aiModel: preferences.aiModel,
      responseStyle: preferences.responseStyle,
      temperature: preferences.temperature.toString(),
      saveHistory: preferences.saveHistory,
    });
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      toast({
        title: "Feature Coming Soon",
        description: "Clear all data functionality will be available soon",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="ai-model" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Model
            </Label>
            <Select
              value={preferences.aiModel}
              onValueChange={(value) => setPreferences({ ...preferences, aiModel: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="response-style" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Response Style
            </Label>
            <Select
              value={preferences.responseStyle}
              onValueChange={(value) => setPreferences({ ...preferences, responseStyle: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Creativity Level
            </Label>
            <div className="mt-2">
              <Slider
                value={[preferences.temperature]}
                onValueChange={(value) => setPreferences({ ...preferences, temperature: value[0] })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Conservative</span>
                <span>{preferences.temperature.toFixed(1)}</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Save Chat History
            </Label>
            <Switch
              checked={preferences.saveHistory}
              onCheckedChange={(checked) => setPreferences({ ...preferences, saveHistory: checked })}
            />
          </div>

          <Separator />

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
              disabled={updatePreferencesMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Separator />

          <Button
            variant="destructive"
            onClick={handleClearAllData}
            className="w-full"
          >
            Clear All Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
