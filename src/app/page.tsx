import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, BarChart, Zap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Logo />
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Take Control of Your Finances with Fiscal Flow
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Fiscal Flow is packed with features designed to help you understand your money and achieve your financial goals.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Easy Transaction Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Quickly log your income and expenses. A clean interface makes tracking effortless.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Spending Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">See where your money goes with simple, beautiful charts. Understand your habits at a glance.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Smart Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get personalized, AI-driven tips to cut costs and boost your savings.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Fiscal Flow. All rights reserved.</p>
      </footer>
    </div>
  );
}
