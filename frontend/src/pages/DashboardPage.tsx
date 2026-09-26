import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent, CardActions,
  Chip, TextField, Select, MenuItem, FormControl, InputLabel, IconButton,
  Pagination, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Menu, LinearProgress,
} from '@mui/material';
import {
  Add, Search, MoreVert, Edit, Delete, CalendarToday,
} from '@mui/icons-material';
import { projectsApi } from '../api/projects';
import { Project } from '../types';
import { useAuthStore } from '../store/authStore';
import ProjectForm from '../components/ProjectForm';
import AppShell from '../components/AppShell';
import { canCreateProject, canManageProject, roleHelpText } from '../utils/roles';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<{ el: HTMLElement; id: number } | null>(null);

  const canCreate = canCreateProject(user);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list({ page, search, status: statusFilter || undefined });
      setProjects(data.results);
      setTotalCount(data.count);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await projectsApi.delete(deleteId);
    setDeleteId(null);
    fetchProjects();
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditProject(null);
    fetchProjects();
  };

  const pageCount = Math.ceil(totalCount / 10);

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>My Projects</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              {totalCount} project{totalCount !== 1 ? 's' : ''} · Signed in as {user?.role_display}
            </Typography>
            <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', mt: 0.5 }}>
              {roleHelpText(user?.role)}
            </Typography>
          </Box>
          {canCreate && (
            <Button startIcon={<Add />} variant="contained" onClick={() => { setEditProject(null); setFormOpen(true); }}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}>
              New Project
            </Button>
          )}
        </Box>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            size="small" sx={{ flex: 1, minWidth: 200, ...inputSx }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: '#64748b' }}>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="outlined" sx={{ borderColor: '#334155', color: '#94a3b8' }}>Search</Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={180} sx={{ bgcolor: '#1e293b', borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #334155', borderRadius: 2 }}>
            <Typography sx={{ color: '#64748b' }}>No projects found.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {projects.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '1.05rem' }}>{p.title}</Typography>
                      {canManageProject(user, p) && (
                        <IconButton size="small" onClick={(e) => setAnchorEl({ el: e.currentTarget, id: p.id })} sx={{ color: '#64748b' }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip label={p.status} size="small"
                        sx={{ bgcolor: p.status === 'active' ? '#1d4ed840' : '#16a34a30', color: p.status === 'active' ? '#60a5fa' : '#4ade80', fontWeight: 600 }} />
                      {p.is_overdue && (
                        <Chip label="Overdue" size="small" sx={{ bgcolor: '#7f1d1d60', color: '#f87171', fontWeight: 600 }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, minHeight: 40 }}>
                      {p.description?.slice(0, 100) || 'No description.'}{p.description && p.description.length > 100 ? '…' : ''}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Progress</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>{p.progress_percent}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={p.progress_percent}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1', borderRadius: 3 } }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      {p.completed_task_count}/{p.task_count} tasks done
                    </Typography>
                    {p.project_manager && (
                      <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', mt: 1 }}>
                        PM: {p.project_manager.full_name}
                      </Typography>
                    )}
                    {p.deadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 12, color: p.is_overdue ? '#f87171' : '#64748b' }} />
                        <Typography variant="caption" sx={{ color: p.is_overdue ? '#f87171' : '#64748b' }}>
                          Deadline {new Date(p.deadline).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" onClick={() => navigate(`/projects/${p.id}`)} sx={{ color: '#818cf8' }}>View Details</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)}
              sx={{ '& .MuiPaginationItem-root': { color: '#94a3b8', '&.Mui-selected': { bgcolor: '#6366f1', color: 'white' } } }} />
          </Box>
        )}
      </Container>

      <Menu anchorEl={anchorEl?.el} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <MenuItem onClick={() => { const p = projects.find(x => x.id === anchorEl?.id); setEditProject(p || null); setFormOpen(true); setAnchorEl(null); }}
          sx={{ color: '#94a3b8', gap: 1 }}><Edit fontSize="small" /> Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteId(anchorEl?.id || null); setAnchorEl(null); }} sx={{ color: '#f87171', gap: 1 }}>
          <Delete fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      <ProjectForm open={formOpen} project={editProject} onClose={() => { setFormOpen(false); setEditProject(null); }} onSuccess={handleFormSuccess} />

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <DialogTitle sx={{ color: '#f1f5f9' }}>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>This will permanently delete the project and all its tasks.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#f1f5f9',
    '& fieldset': { borderColor: '#334155' },
    '&:hover fieldset': { borderColor: '#6366f1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1' },
  },
  '& .MuiInputLabel-root': { color: '#64748b' },
};

export default DashboardPage;
