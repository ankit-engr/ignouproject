import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Container, TextField, Button, Typography, Paper,
  Alert, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, AccountTree } from '@mui/icons-material';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 chars').required('Password is required'),
});

type FormData = { email: string; password: string };

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.user, res.access, res.refresh);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid credentials. Try demo@example.com / Demo1234!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#0f172a' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <AccountTree sx={{ color: '#6366f1', fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ProjectFlow
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
            Sign in to continue to your projects
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

          <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>Demo credentials:</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>demo@example.com / Demo1234!</Typography>
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none' }}>
              Sign up
            </Link>
          </Typography>
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
