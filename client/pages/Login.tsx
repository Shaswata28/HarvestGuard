import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { OTPInput } from "input-otp";
import AnimatedLogo from "@/components/AnimatedLogo";
import { ArrowLeft } from "lucide-react";
import type { LoginFarmerResponse, ErrorResponse } from "@shared/api";

export default function Login() {
  const { language, t } = useLanguage();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      toast({
        title: language === "bn" ? "সঠিক নম্বর দিন" : "Enter valid number",
        variant: "destructive",
      });
      return;
    }
    if (!password || password.length < 6) {
      toast({
        title: language === "bn" ? "পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)" : "Enter password (at least 6 characters)",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const demoOTP = "1234";
      console.log("🔐 DEMO MODE: OTP sent to", mobileNumber);
      console.log("📱 Your OTP is:", demoOTP);
      console.log("⏱️  Auto-filling in 1.5 seconds...");
      
      setOtpSent(true);
      toast({ title: language === "bn" ? "OTP পাঠানো হয়েছে" : "OTP sent" });
      setTimeout(() => {
        setOtp(demoOTP);
        console.log("✅ OTP auto-filled for demo");
      }, 1500);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    setLoading(true);

    try {
      // Format phone number to Bangladesh format (+880XXXXXXXXXX)
      let formattedPhone = mobileNumber;
      if (!formattedPhone.startsWith('+880')) {
        // Remove leading 0 if present and add +880
        formattedPhone = formattedPhone.startsWith('0') 
          ? `+880${formattedPhone.slice(1)}`
          : `+880${formattedPhone}`;
      }

      // Call backend login API
      // NOTE: For development, OTP is shown for UX but we send the actual password
      // In production, implement proper OTP verification with SMS service
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
      const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/farmers/login` : '/api/farmers/login';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          password: password // Using actual password from the form
        })
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error?.message || 'Login failed');
      }

      const data: LoginFarmerResponse = await response.json();

      // Update AuthContext with farmer data
      login(data.farmer._id, {
        id: data.farmer._id,
        name: data.farmer.name,
        phone: data.farmer.phone,
        division: data.farmer.division,
        district: data.farmer.district,
        upazila: data.farmer.upazila,
        registeredDate: data.farmer.registeredAt,
      });

      toast({ title: language === "bn" ? "স্বাগতম!" : "Welcome!" });
      navigate("/dashboard");
    } catch (error) {
      toast({ 
        title: language === "bn" ? "লগইন ব্যর্থ" : "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/admin-dashboard");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />

      {/* Back Button */}
      <Link to="/" className="absolute top-6 left-6 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">{t("back")}</span>
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-primary/10 p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <AnimatedLogo size="small" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {language === "bn" ? "ফিরে আসার জন্য ধন্যবাদ" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === "bn" ? "আপনার ফসলের সুরক্ষায় আমরা আছি" : "We are here to protect your harvest"}
            </p>
          </div>
        </div>

        {/* Role Tabs */}
        <Tabs defaultValue="farmer">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="farmer" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              {language === "bn" ? "কৃষক" : "Farmer"}
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              {language === "bn" ? "অ্যাডমিন" : "Admin"}
            </TabsTrigger>
          </TabsList>

          {/* Farmer Login */}
          <TabsContent value="farmer" className="space-y-6 mt-6">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"}
                  </label>
                  <Input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-12 rounded-xl border-primary/20 focus:ring-primary bg-white font-medium text-lg"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    {language === "bn" ? "পাসওয়ার্ড" : "Password"}
                  </label>
                  <Input
                    type="password"
                    placeholder={language === "bn" ? "আপনার পাসওয়ার্ড" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-primary/20 focus:ring-primary bg-white font-medium text-lg"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? t("loading") : (language === "bn" ? "ওটিপি পাঠান" : "Send OTP")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "আপনার মোবাইলে পাঠানো ৪ সংখ্যার কোডটি দিন" : "Enter the 4-digit code sent to your mobile"}
                  </p>
                  <div className="flex justify-center">
                    <OTPInput maxLength={4} value={otp} onChange={setOtp} render={({ slots }) => (
                      <div className="flex gap-2">
                        {slots.map((slot, idx) => (
                          <div key={idx} className={`w-12 h-14 flex items-center justify-center border-2 rounded-lg text-xl font-bold transition-all ${slot.isActive ? "border-primary bg-primary/5" : "border-muted"}`}>
                            {slot.char}
                          </div>
                        ))}
                      </div>
                    )} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? t("loading") : (language === "bn" ? "যাচাই করুন" : "Verify")}
                </Button>
              </form>
            )}
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin" className="space-y-6 mt-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <Input type="text" placeholder="Admin ID" className="h-12 rounded-xl bg-white border-primary/20" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} />
              <Input type="password" placeholder="Password" className="h-12 rounded-xl bg-white border-primary/20" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                {t("hero.login")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {language === "bn" ? "একাউন্ট নেই? " : "No account? "}
            <Link to="/register" className="text-primary font-bold hover:underline">
              {language === "bn" ? "খুলে নিন" : "Register here"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}