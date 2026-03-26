import React, { useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useGetCharities, useCreateSubscription } from "@workspace/api-client-react";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  plan: z.enum(["monthly", "yearly"]),
  charityId: z.coerce.number().min(1, "Please select a charity"),
  charityContributionPercent: z.coerce.number().min(10, "Minimum 10%").max(50, "Maximum 50%"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser, isRegistering } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const planParam = searchParams.get("plan") === "yearly" ? "yearly" : "monthly";
  
  const [error, setError] = React.useState("");
  
  const { data: charities, isLoading: isLoadingCharities } = useGetCharities();
  const createSubMutation = useCreateSubscription();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      plan: planParam as any,
      charityContributionPercent: 20,
    }
  });

  const percent = watch("charityContributionPercent");

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      // 1. Register User
      await registerUser({ 
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password
        }
      });
      
      // 2. Create Subscription & set charity preference
      await createSubMutation.mutateAsync({
        data: {
          plan: data.plan,
          charityId: data.charityId,
          charityContributionPercent: data.charityContributionPercent
        }
      });
      // Redirect handled in useAuth
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl bg-secondary/20 border-border/50 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-center">Join FairwayImpact</h1>
            <p className="text-muted-foreground mt-2 text-center">Create your account and select your charity</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Details */}
              <div className="space-y-5">
                <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Account Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="John" {...register("firstName")} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" {...register("lastName")} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              {/* Charity & Subscription */}
              <div className="space-y-5">
                <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Your Impact</h3>

                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <select 
                    {...register("plan")}
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-200"
                  >
                    <option value="monthly">Monthly (£10/mo)</option>
                    <option value="yearly">Yearly (£100/yr - Save 16%)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Select Charity</Label>
                  <select 
                    {...register("charityId")}
                    className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-200"
                  >
                    <option value="">-- Choose a cause --</option>
                    {charities?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.charityId && <p className="text-xs text-destructive">{errors.charityId.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Contribution Percentage</Label>
                    <span className="text-sm font-bold text-accent">{percent || 20}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5"
                    className="w-full accent-primary" 
                    {...register("charityContributionPercent")}
                  />
                  <p className="text-xs text-muted-foreground">You can direct 10% to 50% of your subscription to your chosen charity. The rest fuels the prize pool.</p>
                  {errors.charityContributionPercent && <p className="text-xs text-destructive">{errors.charityContributionPercent.message}</p>}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-14 text-lg" 
              isLoading={isRegistering || createSubMutation.isPending}
            >
              Complete Registration & Subscribe
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              By subscribing, you agree to our Terms of Service and Privacy Policy. <br/>
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
