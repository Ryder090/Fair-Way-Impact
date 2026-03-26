import React, { useState } from "react";
import {
  useGetAnalytics,
  useAdminGetUsers,
  useGetDraws,
  useCreateDraw,
  useGetCharities,
  useGetWinners,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import {
  Users, PoundSterling, Trophy, Heart, BarChart3, Flag, CheckCircle,
  Search, Shield, ShieldOff, Play, Zap, Plus, RefreshCw, AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const COLORS = ["#10B981", "#FBBF24", "#F43F5E", "#3B82F6", "#8B5CF6", "#F97316"];

type Tab = "overview" | "users" | "draws" | "charities" | "winners";

const drawSchema = z.object({
  name: z.string().min(2, "Name required"),
  drawDate: z.string().min(1, "Date required"),
  drawType: z.enum(["random", "algorithmic"]),
});
type DrawForm = z.infer<typeof drawSchema>;

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      )}
    >
      {children}
    </button>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: analytics, isLoading } = useGetAnalytics();

  if (isLoading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading analytics…</div>;

  const stats = [
    { label: "Total Users", value: analytics?.totalUsers ?? 0, icon: <Users size={20} />, color: "bg-blue-500/20 text-blue-400" },
    { label: "Active Subscribers", value: analytics?.activeSubscribers ?? 0, icon: <Shield size={20} />, color: "bg-primary/20 text-primary" },
    { label: "Monthly Revenue", value: formatCurrency(analytics?.monthlyRevenue ?? 0), icon: <PoundSterling size={20} />, color: "bg-accent/20 text-accent" },
    { label: "Total Prize Pool", value: formatCurrency(analytics?.totalPrizePool ?? 0), icon: <Trophy size={20} />, color: "bg-yellow-500/20 text-yellow-400" },
    { label: "Charity Raised", value: formatCurrency(analytics?.totalCharityContributions ?? 0), icon: <Heart size={20} />, color: "bg-pink-500/20 text-pink-400" },
    { label: "Total Draws", value: analytics?.totalDraws ?? 0, icon: <Flag size={20} />, color: "bg-purple-500/20 text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={cn("p-2.5 w-fit rounded-lg mb-3", s.color)}>{s.icon}</div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Charity Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="h-64 w-full lg:w-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.charityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="totalContributions"
                    nameKey="charityName"
                  >
                    {analytics?.charityBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: "#12141D", borderColor: "#2E354A", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 w-full">
              {analytics?.charityBreakdown.map((c, i) => (
                <div key={c.charityId} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-sm truncate">{c.charityName}</span>
                  <span className="text-sm text-muted-foreground">{c.subscriberCount} backers</span>
                  <span className="text-sm font-bold text-accent">{formatCurrency(c.totalContributions)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminGetUsers({ page, limit: 15, search: search || undefined });
  const [updating, setUpdating] = useState<number | null>(null);

  const toggleActive = async (userId: number, current: boolean) => {
    setUpdating(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !current }),
      });
      refetch();
    } finally {
      setUpdating(null);
    }
  };

  const toggleRole = async (userId: number, current: string) => {
    setUpdating(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: current === "admin" ? "user" : "admin" }),
      });
      refetch();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} className="mr-1.5" /> Refresh
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading users…</td></tr>
              ) : data?.users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                data?.users.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        {u.firstName} {u.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "warning" : "default"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? "success" : "error"}>
                        {u.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={u.isActive ? "danger" : "outline"}
                          className="h-7 text-xs px-2"
                          isLoading={updating === u.id}
                          onClick={() => toggleActive(u.id, u.isActive)}
                        >
                          {u.isActive ? <ShieldOff size={12} /> : <Shield size={12} />}
                          <span className="ml-1">{u.isActive ? "Suspend" : "Restore"}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          isLoading={updating === u.id}
                          onClick={() => toggleRole(u.id, u.role)}
                        >
                          {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
            <span>Page {page} of {data?.totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Draws ───────────────────────────────────────────────────────────────────

type SimResult = {
  drawnNumbers: number[];
  fiveMatchWinners: number;
  fourMatchWinners: number;
  threeMatchWinners: number;
  fiveMatchPrize: number;
  fourMatchPrize: number;
  threeMatchPrize: number;
  jackpotWouldRollover: boolean;
};

function DrawsTab() {
  const { data: draws, isLoading, refetch } = useGetDraws();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [simResult, setSimResult] = useState<{ drawId: number; result: SimResult } | null>(null);
  const [executing, setExecuting] = useState<number | null>(null);
  const [simulating, setSimulating] = useState<number | null>(null);

  const createDraw = useCreateDraw({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/draws"] });
        setIsCreateOpen(false);
        reset();
      },
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DrawForm>({
    resolver: zodResolver(drawSchema),
    defaultValues: { drawType: "algorithmic" },
  });

  const simulate = async (drawId: number) => {
    setSimulating(drawId);
    try {
      const res = await fetch(`/api/draws/${drawId}/simulate`, {
        method: "POST",
        credentials: "include",
      });
      const result: SimResult = await res.json();
      setSimResult({ drawId, result });
    } finally {
      setSimulating(null);
    }
  };

  const execute = async (drawId: number, drawnNumbers: number[]) => {
    setExecuting(drawId);
    try {
      await fetch(`/api/draws/${drawId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drawnNumbers }),
      });
      setSimResult(null);
      refetch();
    } finally {
      setExecuting(null);
    }
  };

  const statusColor: Record<string, "success" | "warning" | "default"> = {
    completed: "success",
    in_progress: "warning",
    upcoming: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{draws?.length ?? 0} draws total</p>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" /> Create Draw
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading && <div className="text-center text-muted-foreground py-10">Loading draws…</div>}
        {draws?.map(draw => (
          <Card key={draw.id}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg">{draw.name}</h4>
                    <Badge variant={statusColor[draw.status] ?? "default"}>{draw.status}</Badge>
                    {draw.jackpotRolledOver && <Badge variant="error">Jackpot Rolled</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Date: <span className="text-foreground">{new Date(draw.drawDate).toLocaleDateString("en-GB")}</span></span>
                    <span>Pool: <span className="text-accent font-semibold">{formatCurrency(draw.totalPool)}</span></span>
                    <span>Participants: <span className="text-foreground">{draw.participantCount}</span></span>
                    <span>Type: <span className="text-foreground capitalize">{draw.drawType}</span></span>
                  </div>
                </div>
                {draw.status !== "completed" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      isLoading={simulating === draw.id}
                      onClick={() => simulate(draw.id)}
                    >
                      <Play size={12} className="mr-1" /> Simulate
                    </Button>
                    {simResult?.drawId === draw.id && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="h-8 text-xs"
                        isLoading={executing === draw.id}
                        onClick={() => execute(draw.id, simResult.result.drawnNumbers)}
                      >
                        <Zap size={12} className="mr-1" /> Execute
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {simResult?.drawId === draw.id && (
                <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border/60">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" /> Simulation Result
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {simResult.result.drawnNumbers.map(n => (
                      <span key={n} className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-sm flex items-center justify-center">
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-background/40 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs mb-1">5 Match</p>
                      <p className="font-bold">{simResult.result.fiveMatchWinners} winner{simResult.result.fiveMatchWinners !== 1 ? "s" : ""}</p>
                      {simResult.result.fiveMatchWinners > 0 && <p className="text-accent text-xs">{formatCurrency(simResult.result.fiveMatchPrize)} each</p>}
                      {simResult.result.jackpotWouldRollover && <p className="text-destructive text-xs">Jackpot rolls over</p>}
                    </div>
                    <div className="bg-background/40 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs mb-1">4 Match</p>
                      <p className="font-bold">{simResult.result.fourMatchWinners} winner{simResult.result.fourMatchWinners !== 1 ? "s" : ""}</p>
                      {simResult.result.fourMatchWinners > 0 && <p className="text-accent text-xs">{formatCurrency(simResult.result.fourMatchPrize)} each</p>}
                    </div>
                    <div className="bg-background/40 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs mb-1">3 Match</p>
                      <p className="font-bold">{simResult.result.threeMatchWinners} winner{simResult.result.threeMatchWinners !== 1 ? "s" : ""}</p>
                      {simResult.result.threeMatchWinners > 0 && <p className="text-accent text-xs">{formatCurrency(simResult.result.threeMatchPrize)} each</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Click Execute to finalise this draw with these numbers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Draw">
        <form onSubmit={handleSubmit(d => createDraw.mutate({ data: { name: d.name, drawDate: new Date(d.drawDate).toISOString(), drawType: d.drawType } }))} className="space-y-4">
          <div className="space-y-2">
            <Label>Draw Name</Label>
            <Input {...register("name")} placeholder="e.g. April Major Draw" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Draw Date & Time</Label>
            <Input type="datetime-local" {...register("drawDate")} />
            {errors.drawDate && <p className="text-xs text-destructive">{errors.drawDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Draw Type</Label>
            <select {...register("drawType")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary">
              <option value="algorithmic">Algorithmic (balances payouts)</option>
              <option value="random">Pure random</option>
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={createDraw.isPending}>Create Draw</Button>
        </form>
      </Modal>
    </div>
  );
}

// ─── Charities ───────────────────────────────────────────────────────────────

function CharitiesTab() {
  const { data: charities, isLoading, refetch } = useGetCharities();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", websiteUrl: "", imageUrl: "", isFeatured: false });

  const create = async () => {
    setSaving(true);
    try {
      await fetch("/api/charities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      setIsAddOpen(false);
      setForm({ name: "", description: "", websiteUrl: "", imageUrl: "", isFeatured: false });
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    await fetch(`/api/charities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isFeatured: !current }),
    });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{charities?.length ?? 0} charities</p>
        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} className="mr-1.5" /> Add Charity
        </Button>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-10">Loading charities…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {charities?.map(c => (
          <Card key={c.id} className="overflow-hidden">
            {c.imageUrl && (
              <div className="h-40 w-full overflow-hidden">
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold leading-tight">{c.name}</h4>
                {c.isFeatured && <Badge variant="warning">Featured</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-accent font-semibold">{formatCurrency(c.totalContributions)} raised</span>
                <span className="text-muted-foreground">{c.subscriberCount} backers</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={c.isFeatured ? "outline" : "secondary"}
                  className="h-7 text-xs flex-1"
                  onClick={() => toggleFeatured(c.id, c.isFeatured)}
                >
                  {c.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                {c.websiteUrl && (
                  <a href={c.websiteUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">Website</Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Charity">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Charity name" />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this charity do?"
              className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="featured">Feature on homepage</Label>
          </div>
          <Button
            variant="primary"
            className="w-full"
            isLoading={saving}
            disabled={!form.name || !form.description}
            onClick={create}
          >
            Add Charity
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Winners ─────────────────────────────────────────────────────────────────

function WinnersTab() {
  const { data: draws } = useGetDraws();
  const { data: winners, isLoading, refetch } = useGetWinners();
  const [updating, setUpdating] = useState<number | null>(null);

  const verify = async (winnerId: number) => {
    setUpdating(winnerId);
    try {
      await fetch(`/api/winners/${winnerId}/verify`, {
        method: "POST",
        credentials: "include",
      });
      refetch();
    } finally {
      setUpdating(null);
    }
  };

  const matchLabel: Record<string, string> = {
    five_match: "5 Match 🏆",
    four_match: "4 Match 🥈",
    three_match: "3 Match 🥉",
  };

  const matchBadge: Record<string, "success" | "warning" | "default"> = {
    five_match: "success",
    four_match: "warning",
    three_match: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{winners?.length ?? 0} total winners</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} className="mr-1.5" /> Refresh
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Winner</th>
                <th className="px-4 py-3 text-left">Draw</th>
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-left">Prize</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading winners…</td></tr>
              ) : !winners?.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No winners yet — run a draw first</td></tr>
              ) : (
                winners.map(w => (
                  <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{w.userFirstName} {w.userLastName}<br /><span className="text-xs text-muted-foreground">{w.userEmail}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{w.drawName}<br />{new Date(w.createdAt).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3"><Badge variant={matchBadge[w.matchType] ?? "default"}>{matchLabel[w.matchType] ?? w.matchType}</Badge></td>
                    <td className="px-4 py-3 text-accent font-bold">{formatCurrency(w.prizeAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={w.status === "verified" ? "success" : w.status === "paid" ? "success" : "warning"}>
                        {w.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {w.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          isLoading={updating === w.id}
                          onClick={() => verify(w.id)}
                        >
                          <CheckCircle size={12} className="mr-1" /> Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Root Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={14} /> },
    { id: "users", label: "Users", icon: <Users size={14} /> },
    { id: "draws", label: "Draws", icon: <Trophy size={14} /> },
    { id: "charities", label: "Charities", icon: <Heart size={14} /> },
    { id: "winners", label: "Winners", icon: <CheckCircle size={14} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20 text-accent"><BarChart3 size={24} /></div>
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage users, draws, charities, and winners.</p>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-secondary/40 rounded-xl border border-border/40 w-fit">
        {tabs.map(t => (
          <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            <span className="flex items-center gap-1.5">{t.icon}{t.label}</span>
          </TabButton>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "draws" && <DrawsTab />}
      {activeTab === "charities" && <CharitiesTab />}
      {activeTab === "winners" && <WinnersTab />}
    </div>
  );
}
