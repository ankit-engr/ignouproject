import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent, CardActions,
  Chip, TextField, Select, MenuItem, FormControl, InputLabel, IconButton,
  Pagination, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Menu, Avatar
} from '@mui/material';
import {
  Add, Search, MoreVert, Edit, Delete, AccountTree,
  CheckCircle, RadioButtonUnchecked, Logout, Person
} from '@mui/icons-material';
import { projectsApi } from '../api/projects';
import { Project, ProjectFormData } from '../types';
import { useAuthStore } from '../store/authStore';
import ProjectForm from '../components/ProjectForm';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
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
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
      {/* Navbar */}
      <Box sx={{ bgcolor: '#1e293b', borderBottom: '1px solid #334155', py: 1.5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTree sx={{ color: '#6366f1', fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 700 }}>ProjectFlow</Typography>
            </Box>
            <Box>
              <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ color: '#94a3b8' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 14 }}>
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}
                PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>{user?.full_name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>{user?.email}</Typography>
                </Box>
                <MenuItem onClick={() => { clearAuth(); navigate('/login'); }} sx={{ color: '#f87171', gap: 1 }}>
                  <Logout fontSize="small" /> Sign out
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>My Projects</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{totalCount} project{totalCount !== 1 ? 's' : ''} total</Typography>
          </Box>
          <Button startIcon={<Add />} variant="contained" onClick={() => { setEditProject(null); setFormOpen(true); }}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}>
            New Project
          </Button>
        </Box>

        {/* Filters */}
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
          <Button type="submit" variant="outlined" sx={{ borderColor: '#334155', color: '#94a3b8', '&:hover': { borderColor: '#6366f1', color: '#6366f1' } }}>
            Search
          </Button>
        </Box>

        {/* Projects Grid */}
        <Grid container spacing={3}>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ bgcolor: '#1e293b', borderRadius: 2 }} />
            </Grid>
          )) : projects.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <AccountTree sx={{ fontSize: 64, color: '#334155', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#475569' }}>No projects found</Typography>
                <Typography variant="body2" sx={{ color: '#334155', mt: 1 }}>Create your first project to get started</Typography>
              </Box>
            </Grid>
          ) : projects.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                '&:hover': { borderColor: '#6366f1', transform: 'translateY(-2px)', transition: 'all 0.2s' } }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Chip label={p.status} size="small"
                      icon={p.status === 'completed' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <RadioButtonUnchecked sx={{ fontSize: '14px !important' }} />}
                      sx={{ bgcolor: p.status === 'active' ? '#1d4ed840' : '#16a34a30', color: p.status === 'active' ? '#60a5fa' : '#4ade80', fontWeight: 600, fontSize: '0.7rem' }} />
                    <IconButton size="small" onClick={(e) => setAnchorEl({ el: e.currentTarget, id: p.id })} sx={{ color: '#475569' }}>
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, mt: 1.5, mb: 1, cursor: 'pointer', '&:hover': { color: '#818cf8' } }}
                    onClick={() => navigate(`/projects/${p.id}`)}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description || 'No description provided.'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, height: 4, bgcolor: '#334155', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', bgcolor: '#6366f1', borderRadius: 2,
                        width: p.task_count > 0 ? `${(p.completed_task_count / p.task_count) * 100}%` : '0%' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {p.completed_task_count}/{p.task_count} tasks
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small" onClick={() => navigate(`/projects/${p.id}`)} sx={{ color: '#818cf8' }}>View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)}
              sx={{ '& .MuiPaginationItem-root': { color: '#94a3b8', '&.Mui-selected': { bgcolor: '#6366f1', color: 'white' } } }} />
          </Box>
        )}
      </Container>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl?.el} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <MenuItem onClick={() => { const p = projects.find(x => x.id === anchorEl?.id); setEditProject(p || null); setFormOpen(true); setAnchorEl(null); }}
          sx={{ color: '#94a3b8', gap: 1 }}><Edit fontSize="small" /> Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteId(anchorEl?.id || null); setAnchorEl(null); }} sx={{ color: '#f87171', gap: 1 }}>
          <Delete fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Project Form Dialog */}
      <ProjectForm open={formOpen} project={editProject} onClose={() => { setFormOpen(false); setEditProject(null); }} onSuccess={handleFormSuccess} />

      {/* Delete Confirm */}
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
    </Box>
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
