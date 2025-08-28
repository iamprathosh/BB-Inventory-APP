"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Calendar, DollarSign, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface Project {
  _id: Id<"projects">;
  name: string;
  description?: string;
  startDate: number;
  endDate?: number;
  status: string;
  budget?: number;
  manager: Id<"users">;
  _creationTime: number;
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: string;
}

export default function ProjectsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "active",
    budget: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const projects = useQuery(api.projects.listProjects);
  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);
  const removeProject = useMutation(api.projects.deleteProject);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "active",
      budget: "",
    });
  };

  const handleAddProject = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      status: project.status,
      budget: project.budget?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (isEdit: boolean = false) => {
    if (!formData.name || !formData.startDate || !formData.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startDate = new Date(formData.startDate).getTime();
    const endDate = formData.endDate ? new Date(formData.endDate).getTime() : undefined;
    const budget = formData.budget ? parseFloat(formData.budget) : undefined;

    if (isNaN(startDate)) {
      toast.error("Please enter a valid start date");
      return;
    }

    if (endDate && isNaN(endDate)) {
      toast.error("Please enter a valid end date");
      return;
    }

    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      toast.error("Please enter a valid budget");
      return;
    }

    setIsLoading(true);

    try {
      if (isEdit && selectedProject) {
        await updateProject({
          id: selectedProject._id,
          name: formData.name,
          description: formData.description || undefined,
          startDate,
          endDate,
          status: formData.status,
          budget,
        });
        toast.success("Project updated successfully!");
        setIsEditDialogOpen(false);
      } else {
        await createProject({
          name: formData.name,
          description: formData.description || undefined,
          startDate,
          endDate,
          status: formData.status,
          budget,
        });
        toast.success("Project created successfully!");
        setIsAddDialogOpen(false);
      }
      resetForm();
      setSelectedProject(null);
    } catch (error) {
      toast.error(isEdit ? "Failed to update project" : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    setIsLoading(true);

    try {
      await removeProject({ id: selectedProject._id });
      toast.success("Project deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex space-x-4 items-center">
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  const ProjectDialog = ({ isOpen, onClose, isEdit = false }: { 
    isOpen: boolean; 
    onClose: () => void; 
    isEdit?: boolean; 
  }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            {isEdit ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? "Update project information" : "Create a new project to track inventory and activities"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-foreground">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate" className="text-foreground">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate" className="text-foreground">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-foreground">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget" className="text-foreground">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                className="bg-background"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSubmit(isEdit)} 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (isEdit ? "Update Project" : "Create Project")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <LoggedInLayout title="Project Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage your projects and track inventory allocation
            </p>
          </div>
          <Button onClick={handleAddProject} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Project Statistics */}
        {projects && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === "active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm transition-colors duration-300">
          {projects === undefined ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No projects found. Create your first project to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(project.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {project.budget ? `$${project.budget.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-sm min-w-48">
                             <DropdownMenuItem 
                               onClick={() => handleEditProject(project)}
                               className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                             >
                               <Edit className="mr-2 h-4 w-4" />
                               Edit
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => window.open(`/projects/${project._id}`, '_blank')}
                               className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                             >
                               <BarChart3 className="mr-2 h-4 w-4" />
                               View Analytics
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => handleDeleteProject(project)}
                               className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 cursor-pointer transition-colors"
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Delete
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create Project Dialog */}
        <ProjectDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
        />

        {/* Edit Project Dialog */}
        <ProjectDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          isEdit={true}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete{" "}
                <strong className="text-foreground">{selectedProject?.name}</strong> and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LoggedInLayout>
  );
}
