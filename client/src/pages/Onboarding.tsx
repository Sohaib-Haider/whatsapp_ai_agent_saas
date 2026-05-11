import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Onboarding flow for WhatsApp Business setup
 * Step 1: Business name and WhatsApp phone number
 * Step 2: WhatsApp API credentials
 * Step 3: Agent configuration
 * Step 4: Review and complete
 */

type OnboardingStep = 1 | 2 | 3 | 4;

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  const completeOnboarding = trpc.onboarding.completeOnboarding.useMutation();

  const [formData, setFormData] = useState({
    businessName: "",
    whatsappPhoneNumber: "",
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "",
    agentName: "",
    agentPersona: "",
    systemPrompt: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: OnboardingStep): boolean => {
    switch (currentStep) {
      case 1:
        return formData.businessName.trim() !== "" && formData.whatsappPhoneNumber.trim() !== "";
      case 2:
        return (
          formData.phoneNumberId.trim() !== "" &&
          formData.accessToken.trim() !== "" &&
          formData.verifyToken.trim() !== ""
        );
      case 3:
        return formData.agentName.trim() !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step < 4) {
      setStep((step + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error("Please complete all steps");
      return;
    }

    setIsLoading(true);
    try {
      await completeOnboarding.mutateAsync(formData);
      toast.success("Onboarding completed! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      toast.error("Failed to complete onboarding. Please try again.");
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Set Up Your AI Agent</h1>
          <p className="text-slate-600 mt-2">Complete these steps to get started</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? "bg-green-600 text-white"
                      : s === step
                        ? "bg-green-600 text-white ring-4 ring-green-100"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      s < step ? "bg-green-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Business Info</span>
            <span>API Credentials</span>
            <span>Agent Setup</span>
            <span>Review</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8 shadow-xl border-0 mb-6">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Business Information</h2>
                <p className="text-slate-600">Tell us about your business</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName" className="text-slate-700 font-medium">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Your business name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsappPhoneNumber" className="text-slate-700 font-medium">
                    WhatsApp Business Phone Number *
                  </Label>
                  <Input
                    id="whatsappPhoneNumber"
                    name="whatsappPhoneNumber"
                    value={formData.whatsappPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    The phone number customers will contact you on
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: API Credentials */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp API Credentials</h2>
                <p className="text-slate-600">Enter your Meta Developer Console credentials</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Where to find these credentials:</p>
                  <p>
                    Go to Meta Developer Console → Your App → WhatsApp → API Setup to find your
                    Phone Number ID and Access Token
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phoneNumberId" className="text-slate-700 font-medium">
                    Phone Number ID *
                  </Label>
                  <Input
                    id="phoneNumberId"
                    name="phoneNumberId"
                    value={formData.phoneNumberId}
                    onChange={handleInputChange}
                    placeholder="Your Phone Number ID"
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="accessToken" className="text-slate-700 font-medium">
                    Access Token *
                  </Label>
                  <Input
                    id="accessToken"
                    name="accessToken"
                    value={formData.accessToken}
                    onChange={handleInputChange}
                    placeholder="Your Access Token"
                    type="password"
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="verifyToken" className="text-slate-700 font-medium">
                    Verify Token *
                  </Label>
                  <Input
                    id="verifyToken"
                    name="verifyToken"
                    value={formData.verifyToken}
                    onChange={handleInputChange}
                    placeholder="Your Verify Token"
                    type="password"
                    className="mt-2 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Agent Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Configure Your AI Agent</h2>
                <p className="text-slate-600">Customize how your agent responds to customers</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="agentName" className="text-slate-700 font-medium">
                    Agent Name *
                  </Label>
                  <Input
                    id="agentName"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                    placeholder="e.g., Support Assistant"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="agentPersona" className="text-slate-700 font-medium">
                    Agent Persona
                  </Label>
                  <Textarea
                    id="agentPersona"
                    name="agentPersona"
                    value={formData.agentPersona}
                    onChange={handleInputChange}
                    placeholder="Describe your agent's personality and tone (e.g., friendly, professional, helpful)"
                    className="mt-2 h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="systemPrompt" className="text-slate-700 font-medium">
                    System Prompt
                  </Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={handleInputChange}
                    placeholder="Special instructions for your agent (e.g., business hours, policies)"
                    className="mt-2 h-24"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Setup</h2>
                <p className="text-slate-600">Make sure everything looks correct</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Business Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Business Name:</span>
                      <span className="font-medium text-slate-900">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">WhatsApp Number:</span>
                      <span className="font-medium text-slate-900">{formData.whatsappPhoneNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Agent Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Agent Name:</span>
                      <span className="font-medium text-slate-900">{formData.agentName}</span>
                    </div>
                    {formData.agentPersona && (
                      <div>
                        <span className="text-slate-600">Persona:</span>
                        <p className="text-slate-900 mt-1">{formData.agentPersona}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    ✓ Your setup is complete and ready to go! Click "Complete Setup" to start
                    managing conversations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={step === 1 || isLoading}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
