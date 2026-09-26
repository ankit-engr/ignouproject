import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Container, TextField, Button, Typography, Paper,
  Alert, InputAdornment, IconButton, Divider, Skeleton,
} from '@mui/material';
import { Visibility, VisibilityOff, AccountTree } from '@mui/icons-material';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import DeveloperCredit from '../components/DeveloperCredit';
import { UserRole } from '../types';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 chars').required('Password is required'),
});

type FormData = { email: string; password: string };

type DirectoryUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  password: string | null;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState<DirectoryUser[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    authApi.teamDirectory()
      .then(setTeam)
      .catch(() => setTeam([]))
      .finally(() => setTeamLoading(false));
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.user, res.access, res.refresh);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid credentials. Pick an account from the team list below.');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (u: DirectoryUser) => {
    setValue('email', u.email);
    if (u.password) setValue('password', u.password);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#0f172a', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <AccountTree sx={{ color: '#6366f1', fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.5px' }}>
              FlowTrack
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
            An agile-oriented full-stack project & task management system
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth label="Email" type="email" {...register('email')}
              error={!!errors.email} helperText={errors.email?.message}
              sx={inputSx} margin="normal"
            />
            <TextField
              fullWidth label="Password" type={showPass ? 'text' : 'password'} {...register('password')}
              error={!!errors.password} helperText={errors.password?.message}
              sx={inputSx} margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: '#64748b' }}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: '#334155' }} />

          <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 2, mb: 2, maxHeight: 320, overflowY: 'auto' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Full team directory (Admin, Project Leader, Project Manager, Team Member) — click to fill login:
            </Typography>
            {teamLoading ? (
              <>
                <Skeleton sx={{ bgcolor: '#334155' }} />
                <Skeleton sx={{ bgcolor: '#334155' }} />
                <Skeleton sx={{ bgcolor: '#334155' }} />
              </>
            ) : team.length === 0 ? (
              <Typography variant="caption" sx={{ color: '#f87171' }}>
                No users found. Run backend seed: python seed.py
              </Typography>
            ) : (
              team.map((u) => (
                <Box
                  key={u.id}
                  onClick={() => fillAccount(u)}
                  sx={{
                    mb: 1.25, p: 1, borderRadius: 1, cursor: 'pointer',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', fontWeight: 700 }}>
                    {u.role_display} — {u.full_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                    {u.email}
                    {u.password ? ` / ${u.password}` : ' / (password set by creator — ask Admin)'}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', px: 1 }}>
            New users created from the <strong style={{ color: '#94a3b8' }}>Team</strong> page also appear in this list.
          </Typography>
          <DeveloperCredit />
        </Paper>
      </Container>
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
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
};

export default LoginPage;
