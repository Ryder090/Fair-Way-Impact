import React from "react";
import { useGetDraws, useGetPrizePool } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Trophy, Info, Calendar } from "lucide-react";

export default function Draws() {
  const { data: prizePool, isLoading: poolLoading } = useGetPrizePool();
  const { data: draws, isLoading: drawsLoading } = useGetDraws();

  const completedDraws = draws?.filter(d => d.status === 'completed') || [];
  const upcomingDraws = draws?.filter(d => d.status !== 'completed') || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Current Jackpot Header */}
      <div className="relative rounded-3xl overflow-hidden bg-secondary border border-border shadow-2xl mb-16">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/jackpot-glow.png`}
            alt="Jackpot"
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
          />
        </div>
        <div className="relative z-10 p-12 md:p-20 text-center flex flex-col items-center justify-center">
          <Badge variant="success" className="mb-6 py-1 px-4 text-sm uppercase tracking-wider">Current Prize Pool</Badge>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-accent to-yellow-600 drop-shadow-lg mb-4">
            {poolLoading ? '...' : formatCurrency(prizePool?.totalPool || 0)}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            {prizePool?.activeSubscribers || 0} active subscribers contributing this month.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Upcoming Draws */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-primary"/> Upcoming Draws</h2>
            {upcomingDraws.length === 0 ? (
              <p className="text-muted-foreground p-8 text-center bg-secondary/20 rounded-2xl border border-dashed">No upcoming draws scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {upcomingDraws.map(draw => (
                  <Card key={draw.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">{draw.name}</h3>
                        <p className="text-muted-foreground">{format(parseISO(draw.drawDate), 'MMMM do, yyyy - HH:mm')}</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">{draw.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Past Results */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Trophy className="text-accent"/> Past Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {completedDraws.map(draw => (
                <Card key={draw.id}>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-1">{draw.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{format(parseISO(draw.drawDate), 'MMM do, yyyy')}</p>
                    
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Total Pool</p>
                      <p className="text-xl font-bold text-accent">{formatCurrency(draw.totalPool)}</p>
                    </div>

                    {draw.jackpotRolledOver && (
                      <Badge variant="warning" className="w-full justify-center mb-4 text-xs">Jackpot Rolled Over!</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info size={20} className="text-primary"/> How it Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Every month, 5 numbers are drawn from the range 1-45. Your "ticket" is generated from the last 5 Stableford scores you've entered.
              </p>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h4 className="font-bold text-foreground mb-2">Prize Breakdown</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between"><span>Match 5 (Jackpot)</span> <span className="font-bold text-accent">40%</span></li>
                  <li className="flex justify-between"><span>Match 4</span> <span className="font-bold text-primary">35%</span></li>
                  <li className="flex justify-between"><span>Match 3</span> <span className="font-bold text-foreground">25%</span></li>
                </ul>
              </div>
              <p className="text-xs">
                If there are no Match 5 winners, the jackpot rolls over to the next month's draw, increasing the potential prize!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
