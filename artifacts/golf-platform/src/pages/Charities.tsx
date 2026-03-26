import React from "react";
import { useGetCharities } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Heart, Globe, Users } from "lucide-react";

export default function Charities() {
  const { data: charities, isLoading } = useGetCharities();

  if (isLoading) {
    return <div className="p-20 text-center text-muted-foreground animate-pulse">Loading charities...</div>;
  }

  const featured = charities?.filter(c => c.isFeatured) || [];
  const standard = charities?.filter(c => !c.isFeatured) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Our Charitable Partners</h1>
        <p className="text-xl text-muted-foreground">
          Discover the incredible causes that FairwayImpact members are supporting every single month.
        </p>
      </div>

      {featured.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Heart className="text-pink-500 fill-pink-500/20" /> Spotlight Causes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featured.map(charity => (
              <Card key={charity.id} className="overflow-hidden border-pink-500/30 bg-gradient-to-br from-card to-pink-900/10">
                {charity.imageUrl && (
                  <div className="h-64 w-full">
                    <img src={charity.imageUrl} alt={charity.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold">{charity.name}</h3>
                    <Badge variant="success" className="bg-pink-500/20 text-pink-500 border-pink-500/30">Featured</Badge>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {charity.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-6 border-t border-border/50 pt-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Heart size={14}/> Total Raised</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(charity.totalContributions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Users size={14}/> Backers</p>
                      <p className="text-2xl font-bold">{charity.subscriberCount}</p>
                    </div>
                    {charity.websiteUrl && (
                      <div className="ml-auto flex items-end">
                        <a href={charity.websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          Visit Website <Globe size={14}/>
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-6">All Causes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {standard.map(charity => (
            <Card key={charity.id} className="hover:border-primary/30 transition-colors">
               {charity.imageUrl && (
                <div className="h-40 w-full overflow-hidden">
                  <img src={charity.imageUrl} alt={charity.name} referrerPolicy="no-referrer" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{charity.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{charity.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-accent">{formatCurrency(charity.totalContributions)} raised</span>
                  <span className="text-muted-foreground flex items-center gap-1"><Users size={12}/> {charity.subscriberCount}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
