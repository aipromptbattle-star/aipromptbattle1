"use client"

import * as React from "react"
import { APBButton } from "@/components/apb/APBButton"
import { APBCard } from "@/components/apb/APBCard"
import { StatusBadge } from "@/components/apb/StatusBadge"
import { TimerDisplay } from "@/components/apb/TimerDisplay"
import { TeamStatus } from "@/components/apb/TeamStatus"
import { RoundStatus } from "@/components/apb/RoundStatus"
import { StatCard } from "@/components/apb/StatCard"
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Terminal, MoreVertical } from "lucide-react"

export default function UIPreviewPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-20 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-4xl font-mono font-bold tracking-tighter uppercase text-white">AI Prompt Battle</h1>
          <p className="text-muted-foreground text-lg">Design System & UI Component Preview</p>
          <Separator className="my-6 bg-[var(--color-apb-surface-border)]" />
        </header>

        {/* APB Custom Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-mono font-semibold tracking-wide uppercase text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Core APB Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm text-muted-foreground uppercase tracking-widest">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <APBButton>Default</APBButton>
                <APBButton glow>Glow Active</APBButton>
                <APBButton variant="secondary">Secondary</APBButton>
                <APBButton variant="outline">Outline</APBButton>
                <APBButton variant="destructive">End Round</APBButton>
                <APBButton variant="ghost">Ghost</APBButton>
              </div>
            </div>
            
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm text-muted-foreground uppercase tracking-widest">Status Badges</h3>
              <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)]">
                <StatusBadge status="READY" />
                <StatusBadge status="LIVE" pulse />
                <StatusBadge status="PAUSED" />
                <StatusBadge status="CLOSED" />
                <StatusBadge status="ACTIVE" />
                <StatusBadge status="INACTIVE" />
                <StatusBadge status="OFFLINE" />
                <StatusBadge status="DRAFT" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Teams" value={100} subValue="4 Offline" />
            <StatCard label="Active Teams" value={96} />
            <StatCard label="System Load" value="Normal" className="border-[var(--color-apb-cyan)]/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RoundStatus roundNumber={1} totalRounds={4} status="LIVE" isActive title="Visual Generation Challenge" />
            <RoundStatus roundNumber={2} totalRounds={4} status="READY" title="Logic Puzzle" />
            <RoundStatus roundNumber={3} totalRounds={4} status="DRAFT" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TeamStatus teamId="APB-001" teamName="Prompt Masters" status="ACTIVE" sessions={{ current: 2, max: 2 }} />
            <TeamStatus teamId="APB-002" teamName="Neural Ninjas" status="OFFLINE" sessions={{ current: 0, max: 2 }} />
            <TeamStatus teamId="APB-003" teamName="Pixel Minds" status="INACTIVE" />
          </div>

          <APBCard className="p-8 flex items-center justify-center">
            <TimerDisplay time="14:32" />
          </APBCard>
          <APBCard className="p-8 flex items-center justify-center border-destructive/30">
            <TimerDisplay time="00:45" danger />
          </APBCard>
        </section>

        <Separator className="bg-[var(--color-apb-surface-border)]" />

        {/* Form Controls */}
        <section className="space-y-6">
          <h2 className="text-2xl font-mono font-semibold tracking-wide uppercase text-white">Form Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <APBCard className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamId">Team ID</Label>
                <Input id="teamId" placeholder="APB-001" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input id="teamName" placeholder="Enter team name..." />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="active" />
                <Label htmlFor="active" className="cursor-pointer">Team is active</Label>
              </div>
            </APBCard>

            <div className="space-y-6">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>System Notice</AlertTitle>
                <AlertDescription>
                  The next round will begin in approximately 5 minutes.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Team ID already exists. Please use a unique identifier.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Round Progress</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-[var(--color-apb-surface-border)]" />

        {/* Complex Layouts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-mono font-semibold tracking-wide uppercase text-white">Data Display</h2>
          
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="rounds">Rounds</TabsTrigger>
            </TabsList>
            <TabsContent value="teams" className="mt-4">
              <APBCard className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[100px] font-mono">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono font-medium">APB-001</TableCell>
                      <TableCell>Prompt Masters</TableCell>
                      <TableCell><StatusBadge status="ACTIVE" /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-ring">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit team</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Disable team</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono font-medium">APB-002</TableCell>
                      <TableCell>Neural Ninjas</TableCell>
                      <TableCell><StatusBadge status="INACTIVE" /></TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-ring">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit team</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Enable team</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </APBCard>
            </TabsContent>
            <TabsContent value="rounds" className="mt-4">
              <APBCard className="p-8 text-center text-muted-foreground">
                Round management view...
              </APBCard>
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <APBButton onClick={() => setDialogOpen(true)} variant="destructive">
              Test Confirmation Dialog
            </APBButton>
            
            <ConfirmationDialog 
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="End Round?"
              description="This will close the current round for all participants. They will no longer be able to submit."
              onConfirm={() => console.log("Round ended")}
              destructive
            />
          </div>
        </section>
      </div>
    </div>
  )
}
