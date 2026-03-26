import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetUserProfile, useGetScores, useGetMyDrawParticipation, useGetMyWinnings, useAddScore } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Target, Trophy, Heart, Activity, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const scoreSchema = z.object({
  score: z.coerce.number().min(1, "Min score is 1").max(45, "Max Stableford score is 45"),
  datePlayed: z.string().min(1, "Date is required"),
});

type ScoreForm = z.infer<typeof scoreSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: profile } = useGetUserProfile();
  const { data: scores } = useGetScores();
  const { data: participation } = useGetMyDrawParticipation();
  const { data: winnings } = useGetMyWinnings();
  
  const addScoreMutation = useAddScore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
        reset();
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScoreForm>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      datePlayed: new Date().toISOString().split('T')[0]
    }
  });

  const onScoreSubmit = (data: ScoreForm) => {
    addScoreMutation.mutate({ data });
  };

  const activeDraw = participation?.find(p => p.status === 'active' || p.status === 'upcoming');
  const recentScores = scores || [];
  
  // Calculate average score
  const avgScore = recentScores.length > 0 
    ? Math.round(recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Welcome back, {user?.firstName}</h1>
          <p className="text-muted-foreground mt-1">Here is your impact and performance overview.</p>
        </div>
        {profile?.subscription?.status === 'active' ? (
          <Badge variant="success" className="text-sm py-1 px-3"><Activity className="w-4 h-4 mr-2"/> Active Subscription</Badge>
        ) : (
          <Badge variant="error" className="text-sm py-1 px-3"><AlertCircle className="w-4 h-4 mr-2"/> Action Required: Subscribe</Badge>
        )}
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card border-l-4 border-l-primary">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary"><Target size={24}/></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg Stableford</p>
              <h3 className="text-3xl font-bold">{avgScore || '-'} <span className="text-sm font-normal text-muted-foreground">pts</span></h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card border-l-4 border-l-accent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/20 text-accent"><Trophy size={24}/></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Winnings</p>
              <h3 className="text-3xl font-bold text-accent">{winnings ? formatCurrency(winnings.totalWon) : '£0'}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card border-l-4 border-l-pink-500">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/20 text-pink-500"><Heart size={24}/></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Charity Selected</p>
              <h3 className="text-xl font-bold line-clamp-1">{profile?.charityName || 'None selected'}</h3>
              <p className="text-xs text-muted-foreground">{profile?.charityContributionPercent}% contribution</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Middle Col: Score Entry & History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Add Score Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log a New Score</CardTitle>
              <p className="text-sm text-muted-foreground">Your last 5 scores act as your ticket for the monthly draw.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onScoreSubmit)} className="flex items-end gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Stableford Score (1-45)</Label>
                  <Input type="number" {...register("score")} />
                  {errors.score && <p className="text-xs text-destructive">{errors.score.message}</p>}
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Date Played</Label>
                  <Input type="date" {...register("datePlayed")} />
                  {errors.datePlayed && <p className="text-xs text-destructive">{errors.datePlayed.message}</p>}
                </div>
                <Button type="submit" variant="primary" isLoading={addScoreMutation.isPending}>
                  Log Score
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Scores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Ticket Numbers</CardTitle>
              <Badge variant="default">{recentScores.length}/5 Logged</Badge>
            </CardHeader>
            <CardContent>
              {recentScores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No scores logged yet.</p>
                  <p className="text-sm">Log 5 scores to enter the next draw!</p>
                </div>
              ) : (
                <div className="flex gap-4 justify-center py-6">
                  {/* Fill empty spots with dashed circles */}
                  {[...Array(5)].map((_, i) => {
                    const score = recentScores[i];
                    return (
                      <div key={i} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner ${score ? 'bg-primary text-primary-foreground shadow-primary/50' : 'bg-secondary/50 border-2 border-dashed border-border text-muted-foreground'}`}>
                        {score ? score.score : '?'}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Draw Status */}
        <div className="space-y-8">
          <Card className="border-accent/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[40px] pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Trophy size={20}/> Next Draw Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDraw ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Draw Name</p>
                    <p className="font-semibold text-lg">{activeDraw.drawName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(parseISO(activeDraw.drawDate), 'MMMM do, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Your Numbers</p>
                    <div className="flex gap-2">
                      {activeDraw.userNumbers.length > 0 ? activeDraw.userNumbers.map((n, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold border border-border">
                          {n}
                        </div>
                      )) : <p className="text-sm italic text-muted-foreground">Waiting for scores...</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No active draws at the moment.</p>
              )}
            </CardContent>
          </Card>
          
          {winnings && winnings.winners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Winnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {winnings.winners.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-medium text-sm">{w.drawName}</p>
                        <p className="text-xs text-muted-foreground">{w.matchType.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">{formatCurrency(w.prizeAmount)}</p>
                        <Badge variant={w.status === 'paid' ? 'success' : 'warning'} className="text-[10px] uppercase">
                          {w.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
