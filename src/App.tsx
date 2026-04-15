/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileUp, 
  Search, 
  Table as TableIcon, 
  DollarSign, 
  Download, 
  Plus, 
  ChevronRight, 
  FileText, 
  History, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Filter,
  MoreVertical,
  Settings,
  Database,
  Layers,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

import { Project, Job, Entity, PreviewCandidate, PriceSource } from './types';
import { MOCK_PROJECTS, MOCK_JOBS, MOCK_CANDIDATES, MOCK_ENTITIES, MOCK_PRICE_SOURCES } from './mockData';
import { api } from './services/api';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PreviewCandidate | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const data = await api.projects.list();
        setProjects(data);
        if (data.length > 0) setActiveProject(data[0]);
      } catch (error) {
        toast.error("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectScope, setNewProjectScope] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectScope) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const newP = await api.projects.create(newProjectName, newProjectScope);
      setProjects([newP, ...projects]);
      setActiveProject(newP);
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectScope('');
      toast.success("Project created successfully");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setUploadProgress(0);
        toast.success("Document uploaded successfully");
      }
    }, 200);
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F5F7] text-[#111827] font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Left Sidebar - Project Registry */}
      <aside className="w-[220px] border-r border-black bg-[#1A1C1E] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#2D2F34] flex items-center gap-2">
          <h1 className="font-extrabold text-sm tracking-[0.1em] text-white uppercase">E-SPEC PRO</h1>
        </div>

        <div className="p-5">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white text-xs font-semibold rounded-md h-10">
                <Plus className="w-4 h-4 mr-2" />
                Upload New PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#D1D5DB] text-[#111827]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription className="text-[#6B7280]">
                  Initialize a new electrical specification workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-[#6B7280]">Project Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Industrial Plant A-12" 
                    className="bg-white border-[#D1D5DB]" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope" className="text-[10px] uppercase tracking-widest text-[#6B7280]">Initial Scope</Label>
                  <Input 
                    id="scope" 
                    placeholder="e.g. Electrical Distribution" 
                    className="bg-white border-[#D1D5DB]" 
                    value={newProjectScope}
                    onChange={(e) => setNewProjectScope(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProject} className="bg-[#2C64E3] hover:bg-[#2C64E3]/90">Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 py-3">
            <div className="px-5 py-2 text-[10px] uppercase tracking-[0.05em] text-[#9CA3AF] font-semibold">Projects</div>
            {isLoading ? (
              <div className="px-5 py-2 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              projects.map((p) => (
                <button
                  key={p.project_id}
                  onClick={() => setActiveProject(p)}
                  className={`w-full text-left px-5 py-2 transition-all flex items-center justify-between text-sm ${
                    activeProject?.project_id === p.project_id 
                      ? 'bg-[#2D2F34] text-white border-l-3 border-[#2C64E3]' 
                      : 'text-[#9CA3AF] hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {activeProject?.project_id === p.project_id && (
                    <span className="bg-[#374151] text-[10px] px-1.5 py-0.5 rounded text-white font-bold">ACTIVE</span>
                  )}
                </button>
              ))
            )}

            <div className="px-5 py-2 mt-5 text-[10px] uppercase tracking-[0.05em] text-[#9CA3AF] font-semibold">Tools</div>
            <button className="w-full text-left px-5 py-2 text-sm text-[#9CA3AF] hover:bg-white/5">Entity Registry</button>
            <button className="w-full text-left px-5 py-2 text-sm text-[#9CA3AF] hover:bg-white/5">Price Sources</button>
            <button className="w-full text-left px-5 py-2 text-sm text-[#9CA3AF] hover:bg-white/5">Export Manager</button>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">Operator #42</span>
              <span className="text-[10px] text-white/40">Level 3 Access</span>
            </div>
            <Settings className="w-4 h-4 ml-auto text-white/40 cursor-pointer hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F4F5F7]">
        {/* Top Header */}
        <header className="h-[60px] border-b border-[#D1D5DB] flex items-center justify-between px-6 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold">{activeProject?.name || 'Select Project'}</h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[10px] uppercase text-[#6B7280] font-bold">Entities</div>
              <div className="text-sm font-semibold font-mono tabular-nums">142</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-[#6B7280] font-bold">Avg Confidence</div>
              <div className="text-sm font-semibold font-mono tabular-nums">91.4%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-[#6B7280] font-bold">Scope</div>
              <div className="text-sm font-semibold font-mono tabular-nums">{activeProject?.scope || 'LV/MV'}</div>
            </div>
          </div>
        </header>

        {/* Workspace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 py-4 flex items-center gap-4">
            <TabsList className="bg-[#E5E7EB] p-[3px] rounded-md h-auto">
              <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                SUMMARY
              </TabsTrigger>
              <TabsTrigger value="ingest" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                INGEST
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                PREVIEW
              </TabsTrigger>
              <TabsTrigger value="entities" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                ENTITIES
              </TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                PRICING
              </TabsTrigger>
              <TabsTrigger value="export" className="data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm rounded-sm px-3 py-1 text-[11px] font-medium transition-all">
                EXPORT
              </TabsTrigger>
            </TabsList>
            
            <div className="ml-auto flex items-center gap-2">
              <Input placeholder="Filter results..." className="h-7 w-48 bg-white border-[#D1D5DB] text-xs" />
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'DOCUMENTS', value: activeProject?.documents_count, icon: FileText, color: 'text-[#2C64E3]' },
                    { label: 'ACTIVE JOBS', value: activeProject?.jobs_count, icon: Activity, color: 'text-amber-500' },
                    { label: 'ENTITIES', value: '142', icon: Layers, color: 'text-purple-500' },
                    { label: 'PRICE SOURCES', value: activeProject?.price_sources_count, icon: DollarSign, color: 'text-green-500' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white border-[#D1D5DB] shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold tracking-widest text-[#6B7280] uppercase">{stat.label}</span>
                          <span className="text-2xl font-mono font-bold mt-1 text-[#111827]">{stat.value}</span>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-white border-[#D1D5DB] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold flex items-center gap-2 text-[#6B7280] uppercase tracking-wider">
                        <History className="w-4 h-4 text-[#2C64E3]" />
                        RECENT ACTIVITY
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {MOCK_JOBS.map((job) => (
                          <div key={job.job_id} className="flex items-center justify-between p-3 rounded-md bg-white border border-[#D1D5DB] hover:border-[#2C64E3]/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{job.document_id}</span>
                                <span className="text-[10px] text-[#6B7280] font-mono">{job.scope} • {job.source_channel}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase">{job.status}</span>
                                <span className="text-[9px] text-[#9CA3AF]">2m ago</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#D1D5DB]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-[#D1D5DB] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold flex items-center gap-2 text-[#6B7280] uppercase tracking-wider">
                        <Info className="w-4 h-4 text-[#2C64E3]" />
                        PROJECT SCOPE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1E40AF] leading-relaxed">
                        Current extraction scope is limited to LV distribution components and lighting schedules. 
                        High voltage equipment is currently filtered out.
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                          <span>Extraction Progress</span>
                          <span>84%</span>
                        </div>
                        <Progress value={84} className="h-1.5 bg-[#E5E7EB]" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-[10px] h-8 border-[#D1D5DB] hover:bg-[#F9FAFB] font-bold">
                        EDIT SCOPE CONFIG
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Ingest Tab */}
              <TabsContent value="ingest" className="mt-0">
                <Card className="bg-white border-[#D1D5DB] shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 border-r border-[#D1D5DB] flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
                        <FileUp className="w-10 h-10 text-[#2C64E3]" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold">Upload Specifications</h3>
                        <p className="text-sm text-[#6B7280] max-w-xs">
                          Drag and drop your electrical project PDFs here. We support multi-page schematics and BOM tables.
                        </p>
                      </div>
                      <div className="w-full max-w-sm">
                        {isUploading ? (
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-mono text-[#6B7280]">
                              <span>UPLOADING...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2 bg-[#E5E7EB]" />
                          </div>
                        ) : (
                          <Button onClick={handleUpload} className="w-full bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white font-bold tracking-wide">
                            SELECT FILES
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-8 bg-[#F9FAFB] space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Source Channel</h4>
                        <Select defaultValue="web">
                          <SelectTrigger className="bg-white border-[#D1D5DB]">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#D1D5DB] text-[#111827]">
                            <SelectItem value="web">WEB PORTAL</SelectItem>
                            <SelectItem value="telegram">TELEGRAM BOT</SelectItem>
                            <SelectItem value="folder">LOCAL FOLDER</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator className="bg-[#D1D5DB]" />
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Extraction Scope</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-md bg-white border border-[#2C64E3]/30">
                            <div className="w-4 h-4 rounded border border-[#2C64E3] bg-[#EFF6FF] flex items-center justify-center">
                              <div className="w-2 h-2 bg-[#2C64E3] rounded-sm" />
                            </div>
                            <span className="text-xs font-medium">Full Project Scan</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-md bg-white border border-[#D1D5DB] opacity-50">
                            <div className="w-4 h-4 rounded border border-[#D1D5DB]" />
                            <span className="text-xs">BOM Tables Only</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-md bg-white border border-[#D1D5DB] opacity-50">
                            <div className="w-4 h-4 rounded border border-[#D1D5DB]" />
                            <span className="text-xs">Single-Line Diagrams Only</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold">Candidate Entities</h3>
                    <Badge variant="secondary" className="bg-[#EFF6FF] text-[#2C64E3] border-[#BFDBFE]">
                      {MOCK_CANDIDATES.length} CANDIDATES FOUND
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-[#D1D5DB] hover:bg-[#F9FAFB] text-xs font-bold">
                      RE-SCAN
                    </Button>
                    <Button size="sm" className="bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white text-xs font-bold">
                      RUN FINAL EXTRACTION
                    </Button>
                  </div>
                </div>

                <Card className="bg-white border-[#D1D5DB] shadow-sm overflow-hidden rounded-lg">
                  <Table>
                    <TableHeader className="bg-[#F9FAFB]">
                      <TableRow className="border-[#D1D5DB] hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Designation</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-center">Score</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-center">Conf.</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_CANDIDATES.map((c) => (
                        <TableRow 
                          key={c.entity_id} 
                          className={`border-[#F3F4F6] cursor-pointer transition-colors ${selectedCandidate?.entity_id === c.entity_id ? 'bg-[#EFF6FF]' : 'hover:bg-[#F9FAFB]'}`}
                          onClick={() => setSelectedCandidate(c)}
                        >
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className="text-[9px] border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]">
                              {c.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-[#2C64E3]">{c.designation}</TableCell>
                          <TableCell className="text-xs font-medium max-w-xs truncate">{c.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                                <div className="h-full bg-[#2C64E3]" style={{ width: `${c.score * 100}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-[#6B7280]">{(c.score * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${c.confidence > 0.9 ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                              {(c.confidence * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#6B7280]">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* Entities Tab */}
              <TabsContent value="entities" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold">Extracted Entities</h3>
                  </div>
                </div>

                <Card className="bg-white border-[#D1D5DB] shadow-sm overflow-hidden rounded-lg">
                  <Table>
                    <TableHeader className="bg-[#F9FAFB]">
                      <TableRow className="border-[#D1D5DB] hover:bg-transparent">
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Designation</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-center">Qty</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-center">Conf.</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] py-3 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_ENTITIES.map((e) => (
                        <TableRow 
                          key={e.entity_id} 
                          className={`border-[#F3F4F6] cursor-pointer transition-colors ${selectedEntity?.entity_id === e.entity_id ? 'bg-[#EFF6FF]' : 'hover:bg-[#F9FAFB]'}`}
                          onClick={() => setSelectedEntity(e)}
                        >
                          <TableCell className="py-2.5">
                            <input type="checkbox" checked className="rounded border-[#D1D5DB]" readOnly />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]">
                              {e.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-[#2C64E3]">{e.designation}</TableCell>
                          <TableCell className="text-xs font-medium max-w-xs truncate">{e.name}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{e.qty}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#065F46]">
                              {(e.confidence * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Verified</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Price Source Registry</h3>
                  <Button size="sm" className="bg-[#2C64E3] hover:bg-[#2C64E3]/90 gap-2 font-bold text-xs">
                    <Plus className="w-4 h-4" />
                    REGISTER SOURCE
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {MOCK_PRICE_SOURCES.map((ps) => (
                    <Card key={ps.source_id} className="bg-white border-[#D1D5DB] shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold">{ps.name}</CardTitle>
                          <Badge className={ps.active ? 'bg-[#D1FAE5] text-[#065F46] border-[#10B981]/20' : 'bg-[#F3F4F6] text-[#6B7280]'}>
                            {ps.active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        <CardDescription className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">
                          {ps.source_type} • PRIORITY {ps.priority}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 p-2 rounded bg-[#F9FAFB] border border-[#D1D5DB] text-[10px] font-mono text-[#6B7280]">
                          <Database className="w-3 h-3" />
                          {ps.reference}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-[#D1D5DB] font-bold">TEST CONNECTION</Button>
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-[#D1D5DB] font-bold">CONFIGURE</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="mt-0 space-y-6">
                <Card className="bg-white border-[#D1D5DB] shadow-sm p-8">
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">Finalize Project</h3>
                      <p className="text-sm text-[#6B7280]">Generate Bill of Materials and project estimates based on verified entities.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-xl bg-white border border-[#D1D5DB] space-y-4 hover:border-[#2C64E3]/30 transition-all group shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center group-hover:bg-[#DBEAFE] transition-all">
                          <TableIcon className="w-6 h-6 text-[#2C64E3]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold">Bill of Materials</h4>
                          <p className="text-xs text-[#6B7280]">Full list of components with designations and quantities.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white text-[10px] h-8 font-bold">XLSX</Button>
                          <Button size="sm" variant="outline" className="flex-1 border-[#D1D5DB] text-[10px] h-8 font-bold">CSV</Button>
                        </div>
                      </div>

                      <div className="p-6 rounded-xl bg-white border border-[#D1D5DB] space-y-4 hover:border-green-500/30 transition-all group shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center group-hover:bg-[#A7F3D0] transition-all">
                          <DollarSign className="w-6 h-6 text-[#059669]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold">Project Estimate</h4>
                          <p className="text-xs text-[#6B7280]">Cost breakdown using active price sources and overrides.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] h-8 font-bold">PDF</Button>
                          <Button size="sm" variant="outline" className="flex-1 border-[#D1D5DB] text-[10px] h-8 font-bold">JSON</Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#D97706]">REVISION WARNING</span>
                        <p className="text-[10px] text-[#92400E] leading-relaxed">
                          3 entities are currently marked as "Unverified". Exporting now will include these items with a low-confidence flag in the final report.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

            </div>
          </ScrollArea>
        </Tabs>
      </main>

      {/* Right Rail - Details & Trace */}
      <aside className="w-[280px] border-l border-[#D1D5DB] bg-[#F9FAFB] flex flex-col shrink-0 overflow-hidden">
        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <div className="px-4 border-b border-[#D1D5DB]">
            <TabsList className="bg-transparent border-none h-12 gap-4 p-0 w-full">
              <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-[#2C64E3] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#2C64E3] rounded-none px-0 text-[10px] font-bold tracking-widest transition-all uppercase">
                DETAILS
              </TabsTrigger>
              <TabsTrigger value="trace" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-[#2C64E3] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#2C64E3] rounded-none px-0 text-[10px] font-bold tracking-widest transition-all uppercase">
                TRACE
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-[#2C64E3] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#2C64E3] rounded-none px-0 text-[10px] font-bold tracking-widest transition-all uppercase">
                JOBS
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="mt-0 p-4 space-y-6">
              {selectedEntity ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280]">Entity Details</div>
                      <span className="text-[11px] font-bold text-[#2C64E3]">#{selectedEntity.designation}</span>
                    </div>
                    <h3 className="text-base font-bold leading-tight">{selectedEntity.name}</h3>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Parameters</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedEntity.params).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 rounded bg-white border border-[#D1D5DB]">
                          <span className="text-[9px] text-[#6B7280] uppercase font-bold">{k}</span>
                          <span className="text-[11px] font-mono font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Quantity</h4>
                    <Input type="number" defaultValue={selectedEntity.qty} className="h-9 bg-white border-[#D1D5DB] text-sm font-mono" />
                  </div>
                </div>
              ) : selectedCandidate ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280]">Candidate Details</div>
                    <h3 className="text-base font-bold leading-tight">{selectedCandidate.name}</h3>
                    <span className="text-sm font-mono font-bold text-[#2C64E3]">{selectedCandidate.designation}</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Reasons for Match</h4>
                    <div className="space-y-2">
                      {selectedCandidate.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-[#6B7280] leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2C64E3] shrink-0 mt-0.5" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white font-bold tracking-wide h-9 text-xs">
                    CONFIRM & ADD TO ENTITIES
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                  <Info className="w-12 h-12" />
                  <p className="text-xs">Select an entity or candidate to view detailed information.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trace" className="mt-0 p-4 space-y-4">
              {selectedEntity || selectedCandidate ? (
                <div className="space-y-4">
                  <div className="panel-title">
                    <span>Source Trace</span>
                    <span className="text-[#2C64E3]">#{selectedEntity?.designation || selectedCandidate?.designation}</span>
                  </div>

                  <div className="space-y-3">
                    {(selectedEntity?.sources || []).map((s, i) => (
                      <div key={i} className="space-y-3">
                        <div className="source-trace-box text-[11px] p-3 rounded-sm font-mono leading-relaxed">
                          {s.raw_text}
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white border border-[#D1D5DB] p-2 rounded-sm">
                            <div className="text-[9px] text-[#6B7280] uppercase font-bold mb-0.5">Page Index</div>
                            <div className="text-[11px] font-bold">{s.page} / 112</div>
                          </div>
                          <div className="flex-1 bg-white border border-[#D1D5DB] p-2 rounded-sm">
                            <div className="text-[9px] text-[#6B7280] uppercase font-bold mb-0.5">Coordinates</div>
                            <div className="text-[11px] font-bold">[{s.bbox.join(', ')}]</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                  <Search className="w-12 h-12" />
                  <p className="text-xs">Select an item to inspect its source trace.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="mt-0 p-4">
              <div className="panel-title">Job History</div>
              <div className="space-y-0 mt-4">
                {MOCK_JOBS.map((job) => (
                  <div key={job.job_id} className="timeline-item border-l-2 border-[#D1D5DB] pl-4 pb-4 relative before:content-[''] before:absolute before:left-[-5px] before:top-0 before:w-2 before:h-2 before:bg-[#D1D5DB] before:rounded-full last:pb-0">
                    <div className="timeline-content text-xs">
                      <div className="font-bold">{job.document_id}</div>
                      <div className="text-[#6B7280] mt-0.5">{job.status.toUpperCase()} • {job.scope}</div>
                      <div className="timeline-time text-[10px] text-[#6B7280] mt-1">2 mins ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="p-4 border-t border-[#D1D5DB] bg-white">
            <Button className="w-full bg-[#2C64E3] hover:bg-[#2C64E3]/90 text-white text-xs font-bold h-9">
              Confirm & Generate BOM
            </Button>
            <Button variant="ghost" className="w-full text-xs text-[#6B7280] mt-2 h-8">
              Discard Selection
            </Button>
          </div>
        </Tabs>
      </aside>
    </div>
  );
}

