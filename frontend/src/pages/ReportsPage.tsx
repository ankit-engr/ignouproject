import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Skeleton, Button,
} from '@mui/material';
import {
  TrendingUp, AssignmentLate, CheckCircle, FolderOpen, Groups, WarningAmber,
} from '@mui/icons-material';
import { reportsApi } from '../api/reports';
import { ReportsData } from '../types';
import AppShell from '../components/AppShell';

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}> = ({ label, value, icon, accent = '#6366f1' }) => (
  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
          <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        </Box>
        <Box sx={{ color: accent, bgcolor: `${accent}22`, p: 1, borderRadius: 2, display: 'flex' }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.get()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary;

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>Progress & Reports</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Deadlines, assignment workload, and completion tracking across FlowTrack
          </Typography>
        </Box>

        {loading || !data || !s ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={100} sx={{ bgcolor: '#1e293b', borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Overall Progress" value={`${s.overall_progress}%`} icon={<TrendingUp />} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Active Projects" value={s.active_projects} icon={<FolderOpen />} accent="#60a5fa" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Tasks Done" value={`${s.done_tasks}/${s.total_tasks}`} icon={<CheckCircle />} accent="#4ade80" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Overdue Tasks" value={s.overdue_tasks} icon={<AssignmentLate />} accent="#f87171" />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Overdue Projects" value={s.overdue_projects} icon={<WarningAmber />} accent="#fb923c" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="In Progress" value={s.in_progress_tasks} icon={<TrendingUp />} accent="#fbbf24" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label="Unassigned" value={s.unassigned_tasks} icon={<Groups />} accent="#94a3b8" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase' }}>Roles in System</Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {Object.entries(data.role_counts).map(([role, count]) => (
                        <Chip key={role} size="small" label={`${role}: ${count}`}
                          sx={{ bgcolor: '#312e81', color: '#c7d2fe', fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 2 }}>Project Progress</Typography>
                    {data.projects.length === 0 ? (
                      <Typography sx={{ color: '#64748b' }}>No projects to report.</Typography>
                    ) : (
                      data.projects.map((p) => (
                        <Box key={p.id} sx={{ mb: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
                            <Button onClick={() => navigate(`/projects/${p.id}`)} sx={{ color: '#e2e8f0', textTransform: 'none', p: 0, minWidth: 0, fontWeight: 600 }}>
                              {p.title}
                            </Button>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {p.is_overdue && <Chip size="small" label="Overdue" sx={{ bgcolor: '#7f1d1d60', color: '#f87171', height: 22 }} />}
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>{p.progress_percent}%</Typography>
                            </Box>
                          </Box>
                          <LinearProgress variant="determinate" value={p.progress_percent}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#334155', mb: 0.5, '& .MuiLinearProgress-bar': { bgcolor: p.is_overdue ? '#f87171' : '#6366f1', borderRadius: 4 } }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {p.completed_task_count}/{p.task_count} tasks
                            {p.deadline ? ` · Deadline ${new Date(p.deadline).toLocaleDateString()}` : ''}
                            {` · Owner ${p.owner.full_name} (${p.owner.role_display})`}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 2 }}>Workload by Assignee</Typography>
                    {data.by_assignee.length === 0 ? (
                      <Typography sx={{ color: '#64748b' }}>No assignments yet.</Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Member</TableCell>
                            <TableCell sx={{ color: '#64748b', borderColor: '#334155' }} align="right">Tasks</TableCell>
                            <TableCell sx={{ color: '#64748b', borderColor: '#334155' }} align="right">Done</TableCell>
                            <TableCell sx={{ color: '#64748b', borderColor: '#334155' }} align="right">Late</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.by_assignee.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell sx={{ color: '#e2e8f0', borderColor: '#334155' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.full_name}</Typography>
                                <Typography variant="caption" sx={{ color: '#818cf8' }}>{a.role_display}</Typography>
                              </TableCell>
                              <TableCell sx={{ color: '#94a3b8', borderColor: '#334155' }} align="right">{a.total_tasks}</TableCell>
                              <TableCell sx={{ color: '#4ade80', borderColor: '#334155' }} align="right">{a.done_tasks}</TableCell>
                              <TableCell sx={{ color: a.overdue_tasks ? '#f87171' : '#94a3b8', borderColor: '#334155' }} align="right">{a.overdue_tasks}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 2 }}>Overdue Tasks</Typography>
                    {data.overdue_tasks.length === 0 ? (
                      <Typography sx={{ color: '#64748b' }}>No overdue tasks 🎉</Typography>
                    ) : (
                      data.overdue_tasks.map((t) => (
                        <Box key={t.id} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid #334155' }}>
                          <Button onClick={() => navigate(`/projects/${t.project_id}`)} sx={{ color: '#e2e8f0', textTransform: 'none', p: 0, fontWeight: 600 }}>
                            {t.title}
                          </Button>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            {t.project_title} · Due {new Date(t.due_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#f87171' }}>
                            {t.assignee ? `${t.assignee.full_name} (${t.assignee.role_display})` : 'Unassigned'}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </AppShell>
  );
};

export default ReportsPage;
