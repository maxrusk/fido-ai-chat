import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Laptop, LineChart, BadgeDollarSign, ExternalLink, Mail, Linkedin, MessageCircle, CheckCircle, ArrowRight, Users, Shield, Zap, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatInterface from "@/components/chat/ChatInterface";
import SystemMonitor from "@/components/SystemMonitor";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";



export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  const [showChat, setShowChat] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Check for mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleStartChat = () => {
    if (isAuthenticated) {
      window.location.href = '/';
    } else {
      window.location.href = '/api/login';
    }
  };

  const handleGetStarted = () => {
    // Redirect directly to Replit Auth
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:from-slate-900 dark:via-blue-900 dark:to-green-900 transition-colors duration-300 landing-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-8">
          {/* Left side - Fido Logo */}
          <div className="group relative hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
            {/* Existing hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-green-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* New ambient lighting effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/40 to-green-400/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/30 to-green-300/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <img 
              src={fidoLogo} 
              alt="Fido Logo" 
              className="relative h-12 w-auto drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300 z-10"
            />
          </div>

          {/* Right side - Dark mode toggle and Log In */}
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="sm"
              className="p-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 hover:rotate-12 transition-all duration-300 animate-button-pulse"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleGetStarted}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Log In
            </Button>
          </div>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto mb-8 bg-transparent border-none p-0 gap-3">
            <TabsTrigger value="home" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white text-gray-500 dark:text-gray-400 bg-transparent border-2 border-transparent text-base font-bold rounded-xl px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300">Home</TabsTrigger>
            <TabsTrigger value="use-cases" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white text-gray-500 dark:text-gray-400 bg-transparent border-2 border-transparent font-bold rounded-xl px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300">Use Cases</TabsTrigger>
            <TabsTrigger value="product" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white text-gray-500 dark:text-gray-400 bg-transparent border-2 border-transparent font-bold rounded-xl px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300">Product</TabsTrigger>
            <TabsTrigger value="vision" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white text-gray-500 dark:text-gray-400 bg-transparent border-2 border-transparent font-bold rounded-xl px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300">Our Vision</TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white text-gray-500 dark:text-gray-400 bg-transparent border-2 border-transparent font-bold rounded-xl px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            {/* Hero Section */}
            <div className="relative">
              <div className="pt-12 pb-16">
                <div className="text-center">
                  <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/50 dark:to-green-900/50 text-blue-900 dark:text-blue-200 text-sm font-medium mb-8 border border-blue-200 dark:border-blue-700 animate-fade-in-up">
                    <span className="mr-2">🤖</span>
                    Powered by Agentic Intelligence
                  </div>

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 dark:text-gray-100 mb-6 leading-tight animate-fade-in-up">
                    <div>You've got the vision</div>
                    <div className="bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
                      Fido handles the rest
                    </div>
                  </h1>

                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-600">
                    Fido turns your goals into a lender-ready plan, built with smart AI and backed by real business expertise.
                  </p>

                  <div className="flex flex-col gap-4 justify-center items-center animate-fade-in-up animation-delay-900">
                    <Button
                      onClick={handleGetStarted}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-button-pulse"
                    >
                      Let's Build Your Business Together (beta)
                    </Button>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-light text-center">
                      Your AI co-pilot is ready to help you plan, fund, and grow—starting now.
                    </p>
                  </div>
                </div>
              </div>
            </div>



            {/* Features Section */}
            <div className="py-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl mb-8 border border-blue-100/50 dark:border-gray-700/50">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Fido is Your AI Co-Pilot for Business Growth
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                  Combining smart automation and expert-backed insights to help you secure funding, build credit, and grow with confidence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-300 dark:to-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Laptop className="w-7 h-7 text-blue-700 dark:text-blue-800" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Get Funded Without the Frustration
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-light">
                      Fido automates SBA loan paperwork, checks eligibility, and boosts your chances—stop guessing and start growing.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-300 dark:to-green-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <BadgeDollarSign className="w-7 h-7 text-green-700 dark:text-green-800" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Build Credit That Works for You
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-light">
                      Fido gives you personalized, clear steps to grow your business credit—so you qualify for better loans and financing.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-200 to-cyan-300 dark:from-cyan-300 dark:to-cyan-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <LineChart className="w-7 h-7 text-cyan-700 dark:text-cyan-800" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      From Idea to Fundable Plan—Fast
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-light">
                      Fido transforms your goals into a strategic, lender-ready business plan, tailored to help you get approved.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-300 dark:to-green-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-7 h-7 text-green-700 dark:text-green-800" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      AI That Works With You—and For You
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-light">
                      Fido is more than a chatbot—it acts on your behalf, making smart decisions for you 24/7.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Use Cases */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Fido Supports Business Owners Like You</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-light">
                From first-time founders to experienced entrepreneurs, Fido levels the playing field with personalized, AI-powered guidance.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 text-blue-700 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">First-Time Borrowers</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Navigate your first loan with confidence and clarity</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <Zap className="h-8 w-8 mx-auto mb-3 text-green-700 dark:text-green-400" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Small Business Owners</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Get smart insights to fund and grow your operation</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <Users className="h-8 w-8 mx-auto mb-3 text-cyan-600 dark:text-cyan-400" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Aspiring Entrepreneurs</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Turn your idea into a business that's ready for investment</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-blue-700 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Underserved Communities</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Get accessible, trustworthy support to launch and grow</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mb-16">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                    Build Smarter. Grow Faster.
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Fido is your AI co-pilot for funding, credit, and planning—so you can focus on what matters most.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    No credit card. No stress. Just real momentum.
                  </p>
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleGetStarted}
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white px-8 py-3"
                    >
                      Let's Build Your Business Together (beta)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Sharing */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Know Another Founder?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                Share Fido and help someone else start smarter.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="hover:bg-blue-50"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Check out Fido - AI-powered SBA loan guidance for business owners!')}`, '_blank')}
                  className="hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // You could add a toast notification here
                  }}
                  className="hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="use-cases">
            <div className="py-16">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Real Business Scenarios
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                    See how Fido transforms complex business challenges into clear, actionable strategies
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                  {/* Use Case 1 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-indigo-300 dark:to-indigo-400 rounded-xl flex items-center justify-center mb-6">
                        <Users className="w-6 h-6 text-indigo-700 dark:text-indigo-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        "I need $150K to expand my restaurant"
                      </h3>
                      <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-700 dark:text-gray-200">Sarah's Challenge:</p>
                        <p>Sarah owns a successful food truck and wants to open a brick-and-mortar location. She needs funding but doesn't know where to start with SBA loans.</p>
                        
                        <p className="font-medium text-gray-700 dark:text-gray-200 pt-2">Fido's Solution:</p>
                        <ul className="space-y-2 text-sm">
                          <li>• Analyzes her financials and recommends SBA 504 loan for real estate</li>
                          <li>• Creates a comprehensive business plan with market analysis</li>
                          <li>• Connects her with preferred SBA lenders in her area</li>
                          <li>• Guides her through the application process step-by-step</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Use Case 2 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-300 dark:to-red-400 rounded-xl flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6 text-red-700 dark:text-red-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        "I want to start a tech consulting business"
                      </h3>
                      <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-700 dark:text-gray-200">Mark's Challenge:</p>
                        <p>Mark is a software engineer ready to go independent. He needs working capital but has never applied for business financing.</p>
                        
                        <p className="font-medium text-gray-700 dark:text-gray-200 pt-2">Fido's Solution:</p>
                        <ul className="space-y-2 text-sm">
                          <li>• Develops a service-based business plan tailored to tech consulting</li>
                          <li>• Recommends SBA Express loan for quick working capital</li>
                          <li>• Helps establish business credit from day one</li>
                          <li>• Provides ongoing strategic guidance for scaling</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Use Case 3 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-300 dark:to-purple-400 rounded-xl flex items-center justify-center mb-6">
                        <LineChart className="w-6 h-6 text-purple-700 dark:text-purple-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        "My manufacturing business needs equipment"
                      </h3>
                      <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-700 dark:text-gray-200">David's Challenge:</p>
                        <p>David runs a small manufacturing company that needs new equipment to meet growing demand. The machinery costs $300K.</p>
                        
                        <p className="font-medium text-gray-700 dark:text-gray-200 pt-2">Fido's Solution:</p>
                        <ul className="space-y-2 text-sm">
                          <li>• Evaluates equipment financing vs. traditional SBA loans</li>
                          <li>• Prepares detailed cash flow projections showing ROI</li>
                          <li>• Identifies tax benefits and depreciation strategies</li>
                          <li>• Negotiates with multiple lenders for best terms</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Use Case 4 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-300 dark:to-green-400 rounded-xl flex items-center justify-center mb-6">
                        <Shield className="w-6 h-6 text-green-700 dark:text-green-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        "I need to understand my funding options"
                      </h3>
                      <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-700 dark:text-gray-200">Maria's Challenge:</p>
                        <p>Maria wants to buy an existing retail business but is overwhelmed by different loan types, terms, and requirements.</p>
                        
                        <p className="font-medium text-gray-700 dark:text-gray-200 pt-2">Fido's Solution:</p>
                        <ul className="space-y-2 text-sm">
                          <li>• Explains SBA 7(a) vs. conventional loans in simple terms</li>
                          <li>• Analyzes the business financials and valuation</li>
                          <li>• Creates acquisition strategy with seller financing options</li>
                          <li>• Provides ongoing mentorship through the transition</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                  <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50 backdrop-blur-sm border border-blue-200 dark:border-blue-800/50 max-w-3xl mx-auto">
                    <CardContent className="p-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        What's Your Business Story?
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        Every business is unique. Fido adapts to your specific situation, industry, and goals to provide personalized guidance that gets results.
                      </p>
                      <Button 
                        onClick={handleGetStarted}
                        size="lg" 
                        className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white px-8 py-4 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Start Your Success Story
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="product">
            <div className="py-16">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Three Specialized Business Co-Pilots
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                    Specialized agents working together with complete business context continuity
                  </p>
                </div>

                {/* Specialized Agents Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  <Card 
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={handleGetStarted}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Business Plan Architect
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Strategic Planning Specialist</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        Strategic vision development, market analysis, and comprehensive business model design. Channels the wisdom of Steve Jobs, Walt Disney, and Jeff Bezos.
                      </p>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Strategic Vision & Mission Development
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Market Analysis & Competitive Positioning
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Business Model Innovation & Design
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Brand Foundation & Identity Strategy
                        </div>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        Launch Business Plan Architect →
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={handleGetStarted}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            Funding Navigator
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Financing & Capital Specialist</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        SBA loan guidance, investor connections, and funding strategy. Embodies the financial acumen of Warren Buffett and Barbara Corcoran.
                      </p>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          SBA Loan Applications & Requirements
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Investor Pitch Development & Strategy
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Financial Projections & Modeling
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Alternative Funding Source Identification
                        </div>
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-sm font-semibold group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                        Launch Funding Navigator →
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-200 dark:border-purple-800/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={handleGetStarted}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Growth Engine
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Scaling & Operations Specialist</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        Operational excellence, scaling strategies, and performance optimization. Channels Amazon's growth systems and Toyota's operational mastery.
                      </p>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Growth Strategy & Market Expansion
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Operational Process Optimization
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Performance Analytics & KPI Design
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Team Building & Management Systems
                        </div>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 text-sm font-semibold group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        Launch Growth Engine →
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center mb-16">
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Powered by Intelligence Stack
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                    Advanced agentic AI that doesn't just answer questions—it takes action on your behalf
                  </p>
                </div>

                {/* Core Features */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-indigo-300 dark:to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-8 h-8 text-indigo-700 dark:text-indigo-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Business Plan Architect
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Channels the strategic thinking of legendary entrepreneurs like Jobs, Bezos, and Musk to craft compelling, fundable business plans tailored to your vision.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-300 dark:to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <BadgeDollarSign className="w-8 h-8 text-red-700 dark:text-red-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Funding Navigator
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Automatically identifies optimal funding sources, prepares loan applications, and connects you with the right lenders based on your specific business profile.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-300 dark:to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <LineChart className="w-8 h-8 text-purple-700 dark:text-purple-800" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Growth Engine
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Continuously analyzes market conditions, tracks performance metrics, and suggests strategic pivots to accelerate your business growth trajectory.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Technology Stack */}
                <div className="mb-16">
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-12">
                    Powered by Cutting-Edge AI
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800/50">
                      <CardContent className="p-8">
                        <div className="flex items-center mb-4">
                          <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Agentic Intelligence</h4>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Unlike traditional chatbots, Fido takes autonomous action on your behalf—scheduling meetings, submitting applications, and negotiating terms.
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                          <li>• Proactive decision-making capabilities</li>
                          <li>• Multi-step task automation</li>
                          <li>• Real-time adaptive responses</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800/50">
                      <CardContent className="p-8">
                        <div className="flex items-center mb-4">
                          <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Enterprise Security</h4>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Bank-grade encryption and compliance ensures your sensitive business information stays protected while enabling powerful insights.
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                          <li>• SOC 2 Type II certified infrastructure</li>
                          <li>• End-to-end encryption</li>
                          <li>• GDPR and CCPA compliant</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Product Demo/CTA */}
                <div className="text-center">
                  <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50 backdrop-blur-sm border border-blue-200 dark:border-blue-800/50 max-w-4xl mx-auto">
                    <CardContent className="p-12">
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                        Experience Agentic Intelligence in Action
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                        See how Fido transforms months of business planning into days of strategic execution. Your AI business co-pilot is ready to work 24/7 on your behalf.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button 
                          onClick={handleStartChat}
                          size="lg" 
                          className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white px-10 py-4 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Try Fido Now - Free
                        </Button>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No setup required • Start in 30 seconds
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vision">
            <div className="py-16">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
                        <span className="text-3xl">⚡</span>
                        Fido Vision Manifesto
                      </h1>
                      <p className="text-xl text-gray-600 dark:text-gray-300 italic font-light">
                        Empowering people's finances — and futures — through agentic intelligence
                      </p>
                    </div>

                    <div className="space-y-8 text-gray-700 dark:text-gray-200 leading-relaxed">
                      <p className="text-lg font-medium">
                        We believe building a business should feel like having the greatest minds in history at your side.
                      </p>
                      
                      <div className="space-y-1">
                        <p>Not just a banker. Not just a chatbot.</p>
                        <p>But a co-pilot that knows what great looks like — and helps you build it.</p>
                      </div>

                      <div className="text-center text-gray-400 dark:text-gray-500 text-xl py-4">⸻</div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Today, entrepreneurs are overwhelmed.</h3>
                        <div className="space-y-1">
                          <p>By paperwork. By decisions. By complexity.</p>
                          <p>By too many tools and not enough time.</p>
                          <p>By questions they've never had to ask — let alone answer.</p>
                        </div>
                        <p className="mt-4 font-medium">We're here to change that.</p>
                      </div>

                      <div className="text-center text-gray-400 dark:text-gray-500 text-xl py-4">⸻</div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Fido is your intelligent business brain.</h3>
                        <div className="space-y-1 mb-4">
                          <p>Not just a product. Not just a platform.</p>
                          <p>A generative, proactive, agentic mind — in your pocket — that helps you turn vision into action.</p>
                        </div>
                        <p className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                          It's the intelligent operating system for your business. One that combines capital access, strategic execution, and deep operational knowledge — and makes it all available through one simple interface.
                        </p>
                      </div>

                      <div className="text-center text-gray-400 dark:text-gray-500 text-xl py-4">⸻</div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">A co-pilot for business creation, growth, and scale.</h3>
                        <p className="mb-4">Built on the best of today's AI, trained on the wisdom of the greatest founders, operators, and strategists across time.</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">It helps you:</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <p>• Access capital when and how you need it</p>
                              <p>• Design your business plan and iterate it in real time</p>
                              <p>• Distribute resources based on performance and strategy</p>
                              <p>• Make hiring and vendor decisions with data and clarity</p>
                            </div>
                            <div className="space-y-2">
                              <p>• Plan, track, and optimize your operations</p>
                              <p>• Answer the hard questions before they become fires</p>
                              <p>• Stay compliant, agile, and one step ahead</p>
                            </div>
                          </div>
                          <p className="mt-4 font-medium italic">And it never sleeps.</p>
                        </div>
                      </div>

                      <div className="text-center text-gray-400 dark:text-gray-500 text-xl py-4">⸻</div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">We're building the infrastructure for a new entrepreneurial era.</h3>
                        <div className="space-y-2 mb-4">
                          <p className="font-medium">Fast. Fair. Always-on.</p>
                          <p>Fido is the agentic layer of the modern economy — the connective tissue between you and the financial, strategic, and operational actions required to thrive.</p>
                        </div>
                        <div className="space-y-1">
                          <p>It doesn't just surface insights — it takes action.</p>
                          <p>It doesn't just automate — it augments.</p>
                          <p>And it doesn't just serve — it empowers.</p>
                        </div>
                      </div>

                      <div className="text-center text-gray-400 dark:text-gray-500 text-xl py-4">⸻</div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Our vision is this:</h3>
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50 p-6 rounded-lg border border-blue-200 dark:border-blue-800/50">
                          <div className="space-y-3 mb-6">
                            <p>A world where every entrepreneur has superintelligence in their corner.</p>
                            <p>Where anyone with a dream can build boldly — not alone, but with a partner that helps them think, plan, decide, and grow.</p>
                            <p>Where capital flows to ideas, and execution becomes a force of nature.</p>
                          </div>
                          <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
                            <p className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-2">
                              Fido is how you manifest your ambition.
                            </p>
                            <p className="italic">
                              From launch to scale, from credit to clarity —<br />
                              from vision to realization.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="text-center py-16">
              <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Get In Touch</h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light mb-8">
                  Have feedback or questions? We'd love to hear from you.
                  Reach out to us anytime.
                </p>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-center space-x-6">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-button-bounce"
                      onClick={() => window.open('mailto:founders@fidofinancial.ai', '_blank')}
                    >
                      <Mail className="w-4 h-4" />
                      <span>founders@fidofinancial.ai</span>
                    </Button>
                    <Button
                      onClick={handleGetStarted}
                      className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-button-glow"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer with Legal Links */}
      <footer className="py-12 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <a href="/privacy" className="block hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="/terms" className="block hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="mailto:founders@fidofinancial.ai" className="block hover:text-blue-600 transition-colors">Legal Inquiries</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Rights</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <a href="mailto:founders@fidofinancial.ai" className="block hover:text-blue-600 transition-colors">Data Requests</a>
                <a href="mailto:founders@fidofinancial.ai" className="block hover:text-blue-600 transition-colors">Data Protection Officer</a>
                <p className="text-xs">GDPR & CCPA Compliant</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="text-xs">🔒 AES-256 Encryption</p>
                <p className="text-xs">🛡️ SOC 2 Type II Compliant</p>
                <p className="text-xs">🔐 Enterprise-Grade Security</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <div className="text-center space-y-6">
              {/* System Monitor */}
              <div className="flex justify-center">
                <SystemMonitor />
              </div>
              

              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-x-4">
                <span>© 2025 Fido Financial</span>
                <span>•</span>
                <span>Empowering Small Businesses with Agentic AI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
