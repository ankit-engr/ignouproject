import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Chip, IconButton, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Skeleton, Breadcrumbs, Link, Tooltip
} from '@mui/material';
import { Add, ArrowBack, Edit, Delete, CalendarToday, CheckCircle, RadioButtonUnchecked, HourglassEmpty } from '@mui/icons-material';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { ProjectDetail, Task, TaskStatus } from '../types';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'todo': { label: 'To Do', color: '#94a3b8', bg: '#334155', icon: <RadioButtonUnchecked sx={{ fontSize: 14 }} /> },
  'in-progress': { label: 'In Progress', color: '#fbbf24', bg: '#451a0340', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
  'done': { label: 'Done', color: '#4ade80', bg: '#16a34a30', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const isOverdue = (due: string | null) => due && new Date(due) < new Date() && true;

  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', p: 4 }}>
      <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: '#1e293b' }} />
      <Skeleton variant="rectangular" height={200} sx={{ bgcolor: '#1e293b', mt: 2, borderRadius: 2 }} />
    </Box>
  );

  if (!project) return null;

  const progress = project.task_count > 0 ? Math.round((project.completed_task_count / project.task_count) * 100) : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Box sx={{ bgcolor: '#1e293b', borderBottom: '1px solid #334155', py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
            <Link underline="hover" sx={{ color: '#64748b', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Projects</Link>
            <Typography sx={{ color: '#f1f5f9' }}>{project.title}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Project Header */}
        <Box sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>{project.title}</Typography>
                <Chip label={project.status} size="small"
                  sx={{ bgcolor: project.status === 'active' ? '#1d4ed840' : '#16a34a30', color: project.status === 'active' ? '#60a5fa' : '#4ade80', fontWeight: 600 }} />
              </Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>{project.description || 'No description.'}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 200, height: 6, bgcolor: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', bgcolor: '#6366f1', width: `${progress}%`, borderRadius: 3, transition: 'width 0.5s' }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>{progress}% complete · {project.completed_task_count}/{project.task_count} tasks</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button startIcon={<Edit />} variant="outlined" onClick={() => setProjectFormOpen(true)}
                sx={{ borderColor: '#334155', color: '#94a3b8', '&:hover': { borderColor: '#6366f1', color: '#6366f1' } }}>
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tasks Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600 }}>Tasks</Typography>
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
            <Button startIcon={<Add />} variant="contained" onClick={() => { setEditTask(null); setTaskFormOpen(true); }}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}>
              Add Task
            </Button>
          </Box>
        </Box>

        {/* Kanban-style columns */}
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
                  ) : tasks.map((task) => (
                    <Card key={task.id} sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 1.5, mb: 1.5,
                      '&:hover': { borderColor: '#6366f130' } }}>
                      <CardContent sx={{ p: '12px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography sx={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem', flex: 1, mr: 1 }}>{task.title}</Typography>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => { setEditTask(task); setTaskFormOpen(true); }} sx={{ color: '#475569', p: 0.5 }}>
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => setDeleteTaskId(task.id)} sx={{ color: '#475569', p: 0.5 }}>
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        {task.description && (
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 1 }}>{task.description}</Typography>
                        )}
                        {task.due_date && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 12, color: isOverdue(task.due_date) ? '#f87171' : '#64748b' }} />
                            <Typography variant="caption" sx={{ color: isOverdue(task.due_date) ? '#f87171' : '#64748b' }}>
                              {new Date(task.due_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <ProjectForm open={projectFormOpen} project={project} onClose={() => setProjectFormOpen(false)} onSuccess={() => { setProjectFormOpen(false); fetchProject(); }} />
      <TaskForm open={taskFormOpen} task={editTask} projectId={Number(id)} onClose={() => { setTaskFormOpen(false); setEditTask(null); }} onSuccess={() => { setTaskFormOpen(false); setEditTask(null); fetchProject(); }} />

      <Dialog open={Boolean(deleteTaskId)} onClose={() => setDeleteTaskId(null)} PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <DialogTitle sx={{ color: '#f1f5f9' }}>Delete Task?</DialogTitle>
        <DialogContent><Typography sx={{ color: '#94a3b8' }}>This task will be permanently removed.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTaskId(null)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;
