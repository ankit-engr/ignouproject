import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Chip, IconButton, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Skeleton, Breadcrumbs, Link, LinearProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, CalendarToday, CheckCircle, RadioButtonUnchecked,
  HourglassEmpty, Person,
} from '@mui/icons-material';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { ProjectDetail, Task, TaskStatus } from '../types';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import AppShell from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import {
  canManageProject, canManageTasks, canCreateTask, canUpdateTask, canDeleteTask,
  roleHelpText, isTeamMember,
} from '../utils/roles';

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  'todo': { label: 'To Do', color: '#94a3b8', icon: <RadioButtonUnchecked sx={{ fontSize: 14 }} /> },
  'in-progress': { label: 'In Progress', color: '#fbbf24', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
  'done': { label: 'Done', color: '#4ade80', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await projectsApi.get(Number(id));
      setProject(data);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleDeleteTask = async () => {
    if (!deleteTaskId || !id) return;
    await tasksApi.delete(Number(id), deleteTaskId);
    setDeleteTaskId(null);
    fetchProject();
  };

  const filteredTasks = project?.tasks.filter(t => !taskFilter || t.status === taskFilter) || [];

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  if (loading) {
    return (
      <AppShell>
        <Box sx={{ p: 4 }}>
          <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: '#1e293b' }} />
          <Skeleton variant="rectangular" height={200} sx={{ bgcolor: '#1e293b', mt: 2, borderRadius: 2 }} />
        </Box>
      </AppShell>
    );
  }

  if (!project) return null;

  const manage = canManageProject(user, project);
  const manageTasks = canManageTasks(user, project);
  const addTask = canCreateTask(user, project);
  const progress = project.progress_percent ?? (
    project.task_count > 0 ? Math.round((project.completed_task_count / project.task_count) * 100) : 0
  );

  return (
    <AppShell>
      <Box sx={{ bgcolor: '#1e293b', borderBottom: '1px solid #334155', py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
            <Link underline="hover" sx={{ color: '#64748b', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Projects</Link>
            <Typography sx={{ color: '#f1f5f9' }}>{project.title}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>{project.title}</Typography>
                <Chip label={project.status} size="small"
                  sx={{ bgcolor: project.status === 'active' ? '#1d4ed840' : '#16a34a30', color: project.status === 'active' ? '#60a5fa' : '#4ade80', fontWeight: 600 }} />
                {project.is_overdue && (
                  <Chip label="Deadline Overdue" size="small" sx={{ bgcolor: '#7f1d1d60', color: '#f87171', fontWeight: 600 }} />
                )}
              </Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 1 }}>{project.description || 'No description.'}</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', mb: 2 }}>
                {roleHelpText(user?.role)}
                {isTeamMember(user) ? ' Showing only tasks assigned to you.' : ''}
                {manageTasks && !manage ? ' You can manage tasks on this project as collaborator.' : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                <Box sx={{ width: 220 }}>
                  <LinearProgress variant="determinate" value={progress}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1', borderRadius: 4 } }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {progress}% complete · {project.completed_task_count}/{project.task_count} tasks
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {project.deadline && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 14, color: project.is_overdue ? '#f87171' : '#64748b' }} />
                    <Typography variant="caption" sx={{ color: project.is_overdue ? '#f87171' : '#94a3b8' }}>
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                {project.owner && (
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Owner: {project.owner.full_name} ({project.owner.role_display})
                  </Typography>
                )}
                {project.project_manager && (
                  <Typography variant="caption" sx={{ color: '#818cf8' }}>
                    Project Manager: {project.project_manager.full_name}
                  </Typography>
                )}
              </Box>
            </Box>
            {manage && (
              <Button startIcon={<Edit />} variant="outlined" onClick={() => setProjectFormOpen(true)}
                sx={{ borderColor: '#334155', color: '#94a3b8', '&:hover': { borderColor: '#6366f1', color: '#6366f1' } }}>
                Edit Project
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
            {isTeamMember(user) ? 'My Assigned Tasks' : 'Tasks'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: '#64748b' }}>Filter Status</InputLabel>
              <Select value={taskFilter} label="Filter Status" onChange={(e) => setTaskFilter(e.target.value)}
                sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>
            {addTask && (
              <Button startIcon={<Add />} variant="contained" onClick={() => { setEditTask(null); setTaskFormOpen(true); }}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}>
                Add Task
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((status) => {
            const cfg = statusConfig[status];
            const tasks = tasksByStatus[status];
            return (
              <Grid item xs={12} md={4} key={status}>
                <Box sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                    <Typography sx={{ color: cfg.color, fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</Typography>
                    <Chip label={tasks.length} size="small" sx={{ bgcolor: '#334155', color: '#94a3b8', fontSize: '0.7rem', height: 20, ml: 'auto' }} />
                  </Box>

                  {tasks.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed #334155', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#475569' }}>No tasks here</Typography>
                    </Box>
                  ) : tasks.map((task) => {
                    const canEdit = canUpdateTask(user, task, project);
                    const canDel = canDeleteTask(user, task, project);
                    return (
                      <Card key={task.id} sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 1.5, mb: 1.5,
                        '&:hover': { borderColor: '#6366f130' } }}>
                        <CardContent sx={{ p: '12px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography sx={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem', flex: 1, mr: 1 }}>{task.title}</Typography>
                            <Box sx={{ display: 'flex' }}>
                              {canEdit && (
                                <IconButton size="small" onClick={() => { setEditTask(task); setTaskFormOpen(true); }} sx={{ color: '#475569', p: 0.5 }}>
                                  <Edit sx={{ fontSize: 14 }} />
                                </IconButton>
                              )}
                              {canDel && (
                                <IconButton size="small" onClick={() => setDeleteTaskId(task.id)} sx={{ color: '#475569', p: 0.5 }}>
                                  <Delete sx={{ fontSize: 14 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          {task.description && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 1 }}>{task.description}</Typography>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {task.assignee && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person sx={{ fontSize: 12, color: '#818cf8' }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  {task.assignee.full_name} · {task.assignee.role_display}
                                </Typography>
                              </Box>
                            )}
                            {!task.assignee && manageTasks && (
                              <Typography variant="caption" sx={{ color: '#475569' }}>Unassigned</Typography>
                            )}
                            {task.due_date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday sx={{ fontSize: 12, color: task.is_overdue ? '#f87171' : '#64748b' }} />
                                <Typography variant="caption" sx={{ color: task.is_overdue ? '#f87171' : '#64748b' }}>
                                  {new Date(task.due_date).toLocaleDateString()}
                                  {task.is_overdue ? ' · Overdue' : ''}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <ProjectForm open={projectFormOpen} project={project} onClose={() => setProjectFormOpen(false)} onSuccess={() => { setProjectFormOpen(false); fetchProject(); }} />
      <TaskForm
        open={taskFormOpen}
        task={editTask}
        projectId={Number(id)}
        project={project}
        onClose={() => { setTaskFormOpen(false); setEditTask(null); }}
        onSuccess={() => { setTaskFormOpen(false); setEditTask(null); fetchProject(); }}
      />

      <Dialog open={Boolean(deleteTaskId)} onClose={() => setDeleteTaskId(null)} PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <DialogTitle sx={{ color: '#f1f5f9' }}>Delete Task?</DialogTitle>
        <DialogContent><Typography sx={{ color: '#94a3b8' }}>This task will be permanently removed.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTaskId(null)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default ProjectDetailPage;
