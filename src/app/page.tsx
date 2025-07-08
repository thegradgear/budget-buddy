// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DollarSign, BarChart, Zap, UserPlus, ListPlus, Lightbulb, Twitter, Linkedin, Facebook, Quote } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Responsive Header */}
      <header className="h-14 sm:h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <Logo />
          <nav className="flex gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild className="text-sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="text-sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Responsive */}
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32 bg-primary-light">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
            <div className="grid gap-6 sm:gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col justify-center space-y-4 sm:space-y-6 order-2 lg:order-1">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight">
                    Take Control of Your Finances with Budget Buddy
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                    The simple, smart, and secure way to manage your money. Track your spending, visualize your habits, and get AI-powered insights to save more.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link href="/signup">Sign Up for Free</Link>
                  </Button>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <Image
                  src="https://placehold.co/600x400.png"
                  width="600"
                  height="400"
                  alt="Hero"
                  data-ai-hint="finance dashboard"
                  className="w-full h-auto aspect-[3/2] object-cover rounded-lg sm:rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Responsive Grid */}
        <section id="features" className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-secondary">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-block rounded-lg bg-primary-light text-primary px-3 py-1 text-sm font-medium">
                  Key Features
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-3xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Budget Buddy is packed with features designed to help you understand your money and achieve your financial goals.
                </p>
              </div>
            </div>
            <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary-light p-3 rounded-full flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Easy Transaction Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Quickly log your income and expenses. A clean interface makes tracking effortless.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary-light p-3 rounded-full flex-shrink-0">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Spending Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    See where your money goes with simple, beautiful charts. Understand your habits at a glance.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="bg-primary-light p-3 rounded-full flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Smart Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Get personalized, AI-driven tips to cut costs and boost your savings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section - Responsive */}
        <section id="how-it-works" className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-background">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                  How It Works
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                  Get Started in 3 Easy Steps
                </h2>
                <p className="max-w-3xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Start managing your finances in minutes. It's that simple.
                </p>
              </div>
            </div>
            <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">1. Create Your Account</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Sign up for free in less than a minute. All you need is an email address.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <ListPlus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">2. Add Your Transactions</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Manually log your income and expenses. The more you add, the smarter the insights.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <Lightbulb className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">3. Get Smart Insights</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Our AI analyzes your spending and provides personalized tips to help you save.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section - Responsive Grid */}
        <section id="testimonials" className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-secondary">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                  Loved by Savers Everywhere
                </h2>
                <p className="max-w-3xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Don't just take our word for it. Here's what our users are saying about Budget Buddy.
                </p>
              </div>
            </div>
            <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="h-full">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    "Budget Buddy has been a game-changer for my finances. I finally feel in control of my money."
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@sarah" data-ai-hint="woman smiling" />
                    <AvatarFallback>SL</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Sarah L.</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Freelance Designer</p>
                  </div>
                </CardFooter>
              </Card>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    "The AI suggestions are incredibly helpful. It's like having a personal finance coach in my pocket."
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@mike" data-ai-hint="man smiling" />
                    <AvatarFallback>MD</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Mike D.</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Software Engineer</p>
                  </div>
                </CardFooter>
              </Card>
              <Card className="h-full sm:col-span-2 lg:col-span-1">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    "I've tried other budgeting apps, but this is the first one that has actually stuck. So simple and effective!"
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@jessica" data-ai-hint="woman happy" />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Jessica P.</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Marketing Manager</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section - Responsive */}
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-background">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 text-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                Ready to Get Started?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Join thousands of users who are taking control of their financial future.
                Sign up today for free.
              </p>
            </div>
            <div className="mt-6 sm:mt-8 w-full max-w-sm mx-auto">
              <Button size="lg" asChild className="w-full">
                <Link href="/signup">Start Budgeting Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Responsive Footer */}
      <footer className="bg-navy text-primary-foreground">
        <div className="w-full max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <Logo className="text-white" />
              <p className="text-blue-200/70 text-sm leading-relaxed">Your financial co-pilot.</p>
              <div className="flex gap-4">
                <Link href="#" className="text-blue-200/70 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-blue-200/70 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-blue-200/70 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-base sm:text-lg">Product</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="#features" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-base sm:text-lg">Company</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-base sm:text-lg">Legal</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200/70 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 border-t border-slate-200/20 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-blue-200/70">
            &copy; {new Date().getFullYear()} Budget Buddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
