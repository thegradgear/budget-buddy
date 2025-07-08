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
      <header className="h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container flex items-center w-full px-6 md:px-10">
          <Logo />
          <nav className="ml-auto flex gap-2 sm:gap-6">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary-light">
          <div className="container px-6 md:px-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-display">
                    Take Control of Your Finances with Budget Buddy
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-body-lg">
                    The simple, smart, and secure way to manage your money. Track your spending, visualize your habits, and get AI-powered insights to save more.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/signup">Sign Up for Free</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="finance dashboard"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-6 md:px-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary-light text-primary px-3 py-1 text-sm font-medium">Key Features</div>
                <h2 className="text-h2 font-semibold tracking-tight">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground text-body-lg">
                  Budget Buddy is packed with features designed to help you understand your money and achieve your financial goals.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary-light p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Easy Transaction Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">Quickly log your income and expenses. A clean interface makes tracking effortless.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary-light p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Spending Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">See where your money goes with simple, beautiful charts. Understand your habits at a glance.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary-light p-3 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Smart Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">Get personalized, AI-driven tips to cut costs and boost your savings.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-6 md:px-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">How It Works</div>
                <h2 className="text-h2 font-semibold tracking-tight">Get Started in 3 Easy Steps</h2>
                <p className="max-w-[900px] text-muted-foreground text-body-lg">
                  Start managing your finances in minutes. It's that simple.
                </p>
              </div>
            </div>
            <div className="mx-auto grid grid-cols-1 items-start gap-12 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-2 text-center">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-h4 font-bold mt-4">1. Create Your Account</h3>
                <p className="text-muted-foreground">Sign up for free in less than a minute. All you need is an email address.</p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <ListPlus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-h4 font-bold mt-4">2. Add Your Transactions</h3>
                <p className="text-muted-foreground">Manually log your income and expenses. The more you add, the smarter the insights.</p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-primary-light p-4 ring-8 ring-primary-light/30">
                    <Lightbulb className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-h4 font-bold mt-4">3. Get Smart Insights</h3>
                <p className="text-muted-foreground">Our AI analyzes your spending and provides personalized tips to help you save.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-6 md:px-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-h2 font-semibold tracking-tight">Loved by Savers Everywhere</h2>
                <p className="max-w-[900px] text-muted-foreground text-body-lg">
                  Don't just take our word for it. Here's what our users are saying about Budget Buddy.
                </p>
              </div>
            </div>
            <div className="mx-auto grid grid-cols-1 gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-muted-foreground">"Budget Buddy has been a game-changer for my finances. I finally feel in control of my money."</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@sarah" data-ai-hint="woman smiling" />
                    <AvatarFallback>SL</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Sarah L.</p>
                    <p className="text-sm text-muted-foreground">Freelance Designer</p>
                  </div>
                </CardFooter>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-muted-foreground">"The AI suggestions are incredibly helpful. It's like having a personal finance coach in my pocket."</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@mike" data-ai-hint="man smiling" />
                    <AvatarFallback>MD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Mike D.</p>
                    <p className="text-sm text-muted-foreground">Software Engineer</p>
                  </div>
                </CardFooter>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary-light mb-4" />
                  <p className="text-muted-foreground">"I've tried other budgeting apps, but this is the first one that has actually stuck. So simple and effective!"</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@jessica" data-ai-hint="woman happy" />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Jessica P.</p>
                    <p className="text-sm text-muted-foreground">Marketing Manager</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container grid items-center justify-center gap-4 px-6 text-center md:px-10">
            <div className="space-y-3">
              <h2 className="text-h2 font-semibold tracking-tighter">Ready to Get Started?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground text-body-lg">
                Join thousands of users who are taking control of their financial future.
                Sign up today for free.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button size="lg" asChild className="w-full">
                <Link href="/signup">Start Budgeting Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-primary-foreground">
        <div className="container py-12 px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col gap-4">
              <Logo className="text-white" />
              <p className="text-blue-200/70 text-sm">Your financial co-pilot.</p>
              <div className="flex gap-4">
                <Link href="#" className="text-blue-200/70 hover:text-white"><Twitter className="h-5 w-5" /></Link>
                <Link href="#" className="text-blue-200/70 hover:text-white"><Facebook className="h-5 w-5" /></Link>
                <Link href="#" className="text-blue-200/70 hover:text-white"><Linkedin className="h-5 w-5" /></Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-blue-200/70 hover:text-white text-sm">Features</Link></li>
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">About Us</Link></li>
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Careers</Link></li>
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-blue-200/70 hover:text-white text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200/20 pt-8 text-center text-sm text-blue-200/70">
            &copy; {new Date().getFullYear()} Budget Buddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
