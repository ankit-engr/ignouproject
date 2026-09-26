import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { AccountTree } from '@mui/icons-material';
import DeveloperCredit from '../components/DeveloperCredit';

const RegisterPage: React.FC = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#0f172a' }}>
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: 5, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AccountTree sx={{ color: '#6366f1', fontSize: 32 }} />
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700 }}>FlowTrack</Typography>
        </Box>
        <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 2 }}>
          Registration is closed
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          New accounts are created inside the app using this hierarchy:
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>• <strong>Admin</strong> → creates Admin, Project Leader, Project Manager, Team Member</Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>• <strong>Project Leader</strong> → creates Project Manager, Team Member</Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 3 }}>• <strong>Project Manager</strong> → creates Team Member only</Typography>
        <Button component={Link} to="/login" variant="contained"
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
          Back to Login
        </Button>
        <DeveloperCredit />
      </Paper>
    </Container>
  </Box>
);

export default RegisterPage;
