import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Box, Container, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { AccountTree } from '@mui/icons-material';
import { authApi } from '../api/auth';

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password is required'),
  password2: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm your password'),
});

type FormData = { first_name: string; last_name: string; email: string; password: string; password2: string };

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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await authApi.register(data);
      navigate('/login?registered=true');
    } catch (e: any) {
      const errs = e.response?.data;
      if (errs?.email) setError(`Email: ${errs.email[0]}`);
      else if (errs?.password) setError(`Password: ${errs.password[0]}`);
      else setError('Registration failed. Please try again.');
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
            <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700 }}>ProjectFlow</Typography>
          </Box>
          <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 1 }}>Create account</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>Start managing your projects today</Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="First Name" {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} sx={inputSx} />
              <TextField label="Last Name" {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} sx={inputSx} />
            </Box>
            <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={inputSx} margin="normal" />
            <TextField fullWidth label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={inputSx} margin="normal" />
            <TextField fullWidth label="Confirm Password" type="password" {...register('password2')} error={!!errors.password2} helperText={errors.password2?.message} sx={inputSx} margin="normal" />

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none' }}>Sign in</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
