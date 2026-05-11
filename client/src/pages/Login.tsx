import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

/**
 * Login page with Google OAuth
 * Elegant, professional design for WhatsApp Business AI Agent SaaS
 */
export default function Login() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">WhatsApp AI Agent</h1>
          <p className="text-slate-600">Intelligent customer support, powered by AI</p>
        </div>

        {/* Main Card */}
        <Card className="p-8 shadow-xl border-0">
          <div className="space-y-6">
            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">AI-Powered Responses</p>
                  <p className="text-xs text-slate-500">Automatic replies to customer inquiries</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Real-Time Dashboard</p>
                  <p className="text-xs text-slate-500">Monitor all conversations in one place</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Manual Control</p>
                  <p className="text-xs text-slate-500">Take over anytime with a single toggle</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">Get started</span>
              </div>
            </div>

            {/* Login Button */}
            <a href={loginUrl} className="block">
              <Button className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                Sign in with Google
              </Button>
            </a>

            {/* Footer Text */}
            <p className="text-xs text-center text-slate-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </Card>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Trusted by businesses worldwide for intelligent customer engagement
          </p>
        </div>
      </div>
    </div>
  );
}
