import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, IconButton, Menu, MenuItem, Avatar, Button, Chip,
} from '@mui/material';
import { AccountTree, Logout, Assessment, Dashboard as DashIcon, Groups } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import DeveloperCredit from './DeveloperCredit';
import { canManageUsers } from '../utils/roles';

interface Props {
  children: React.ReactNode;
}

const AppShell: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement | null>(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: '#1e293b', borderBottom: '1px solid #334155', py: 1.5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                onClick={() => navigate('/dashboard')}
              >
                <AccountTree sx={{ color: '#6366f1', fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 700 }}>FlowTrack</Typography>
              </Box>
              <Button
                startIcon={<DashIcon />}
                size="small"
                onClick={() => navigate('/dashboard')}
                sx={{
                  color: location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/projects')
                    ? '#818cf8' : '#94a3b8',
                  textTransform: 'none',
                }}
              >
                Projects
              </Button>
              <Button
                startIcon={<Assessment />}
                size="small"
                onClick={() => navigate('/reports')}
                sx={{
                  color: location.pathname.startsWith('/reports') ? '#818cf8' : '#94a3b8',
                  textTransform: 'none',
                }}
              >
                Reports
              </Button>
              {canManageUsers(user) && (
                <Button
                  startIcon={<Groups />}
                  size="small"
                  onClick={() => navigate('/team')}
                  sx={{
                    color: location.pathname.startsWith('/team') ? '#818cf8' : '#94a3b8',
                    textTransform: 'none',
                  }}
                >
                  Team
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {user?.role_display && (
                <Chip
                  label={user.role_display}
                  size="small"
                  sx={{ bgcolor: '#312e81', color: '#c7d2fe', fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
                />
              )}
              <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ color: '#94a3b8' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 14 }}>
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>{user?.full_name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{user?.email}</Typography>
                  <Typography variant="caption" sx={{ color: '#818cf8' }}>{user?.role_display}</Typography>
                </Box>
                <MenuItem
                  onClick={() => { clearAuth(); navigate('/login'); }}
                  sx={{ color: '#f87171', gap: 1 }}
                >
                  <Logout fontSize="small" /> Sign out
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ flex: 1 }}>{children}</Box>
      <DeveloperCredit sx={{ pb: 2 }} />
    </Box>
  );
};

export default AppShell;
