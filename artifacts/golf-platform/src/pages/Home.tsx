import React from "react";
import { Link } from "wouter";
import { Button, Card, CardContent } from "@/components/ui";
import { motion } from "framer-motion";
import { useGetPrizePool, useGetCharities } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Target, Gift, ArrowRight, Heart } from "lucide-react";

export default function Home() {
  const { data: prizePool } = useGetPrizePool();
  const { data: charities } = useGetCharities({ featured: true });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-white/10 backdrop-blur-md mb-8">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-white/90">Next draw jackpot: {prizePool ? formatCurrency(prizePool.totalPool * 0.4) : "£10,000+"}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight max-w-5xl mx-auto">
              Play Golf. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Give Back.</span> <br/>
              Win Big.
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Turn your standard stableford rounds into charitable impact. Subscribe, enter your scores, support amazing causes, and enter our monthly algorithmic draw.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg group">
                  Start Your Impact
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/draws">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 bg-background/50 backdrop-blur-md">
                  How the Draw Works
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Three Steps to Impact</h2>
            <p className="text-muted-foreground text-lg">Your game has never meant more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "1. Choose Your Cause", desc: "Subscribe for £10/month and direct up to 50% to a charity of your choice." },
              { icon: Target, title: "2. Log Your Scores", desc: "Enter your 18-hole Stableford scores (1-45). Your last 5 scores act as your 'ticket' numbers." },
              { icon: Trophy, title: "3. Monthly Draw", desc: "Every month, 5 numbers are drawn. Match 3, 4, or 5 to win huge cash prizes." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <Card className="h-full bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      <section className="py-32 bg-secondary/30 border-y border-border/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full">
          <img 
            src={`${import.meta.env.BASE_URL}images/charity-impact.png`}
            alt="Charity Impact"
            className="w-full h-full object-cover opacity-20 mask-image-l-to-r"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black)' }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Causes We Support</h2>
            <p className="text-lg text-muted-foreground">
              By joining FairwayImpact, you directly contribute to these incredible organizations. You decide where your percentage goes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {charities?.slice(0, 3).map((charity) => (
              <Card key={charity.id} className="group overflow-hidden">
                {charity.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img src={charity.imageUrl} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{charity.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{charity.description}</p>
                  <div className="text-sm font-medium text-accent">
                    {formatCurrency(charity.totalContributions)} raised so far
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-10">
            <Link href="/charities">
              <Button variant="outline" className="gap-2">
                View All Charities <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="py-32 relative">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
           <img 
            src={`${import.meta.env.BASE_URL}images/jackpot-glow.png`}
            alt="Jackpot Glow"
            className="w-[800px] h-[800px] object-cover opacity-20 mix-blend-screen animate-pulse-slow"
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-8">Ready to Tee Off?</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
            <Card className="flex-1 border-primary/50 relative overflow-hidden bg-background">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px]" />
              <CardContent className="p-8 flex flex-col items-center">
                <h3 className="text-2xl font-bold text-muted-foreground mb-2">Monthly</h3>
                <div className="text-5xl font-black mb-6">£10<span className="text-lg text-muted-foreground font-medium">/mo</span></div>
                <ul className="text-sm text-left space-y-3 mb-8 w-full text-muted-foreground">
                  <li className="flex gap-2"><Trophy className="w-4 h-4 text-primary shrink-0"/> Entry into all monthly draws</li>
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-primary shrink-0"/> Up to 50% to your charity</li>
                  <li className="flex gap-2"><Target className="w-4 h-4 text-primary shrink-0"/> Unlimited score tracking</li>
                </ul>
                <Link href="/register?plan=monthly" className="w-full">
                  <Button variant="primary" className="w-full">Select Monthly</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="flex-1 border-accent/50 relative overflow-hidden bg-background">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px]" />
              <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                SAVE 16%
              </div>
              <CardContent className="p-8 flex flex-col items-center">
                <h3 className="text-2xl font-bold text-muted-foreground mb-2">Yearly</h3>
                <div className="text-5xl font-black mb-6">£100<span className="text-lg text-muted-foreground font-medium">/yr</span></div>
                <ul className="text-sm text-left space-y-3 mb-8 w-full text-muted-foreground">
                  <li className="flex gap-2"><Trophy className="w-4 h-4 text-accent shrink-0"/> 12 months for price of 10</li>
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-accent shrink-0"/> Maximize charity impact</li>
                  <li className="flex gap-2"><Target className="w-4 h-4 text-accent shrink-0"/> Uninterrupted draw entries</li>
                </ul>
                <Link href="/register?plan=yearly" className="w-full">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Select Yearly</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
