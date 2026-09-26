import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Container, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Skeleton, Paper,
} from '@mui/material';
import { PersonAdd, Groups } from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { authApi } from '../api/auth';
import { User, UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  canManageUsers, rolesCreatableBy, ROLE_LABELS, roleHelpText,
} from '../utils/roles';

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password is required'),
  password2: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password'),
  role: yup.string().required('Role is required'),
});

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password2: string;
  role: UserRole;
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

const roleChipColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#7f1d1d60', color: '#fca5a5' },
  project_leader: { bg: '#312e81', color: '#c7d2fe' },
  project_manager: { bg: '#1e3a5f', color: '#93c5fd' },
  team_member: { bg: '#14532d50', color: '#86efac' },
};

const TeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const allowedRoles = rolesCreatableBy(user);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password2: '',
      role: allowedRoles[0] || 'team_member',
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authApi.listUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!canManageUsers(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccess('');
    try {
      const created = await authApi.createUser(data);
      setSuccess(`Created ${created.full_name} as ${created.role_display}.`);
      setOpen(false);
      reset({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password2: '',
        role: allowedRoles[0] || 'team_member',
      });
      load();
    } catch (e: any) {
      const d = e.response?.data;
      if (d?.role) setError(Array.isArray(d.role) ? d.role[0] : d.role);
      else if (d?.email) setError(Array.isArray(d.email) ? d.email[0] : d.email);
      else if (d?.password) setError(Array.isArray(d.password) ? d.password[0] : d.password);
      else if (d?.detail) setError(d.detail);
      else if (typeof d === 'object' && d?.non_field_errors) setError(d.non_field_errors[0]);
      else setError('Could not create user. Check details and try again.');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Groups sx={{ color: '#6366f1' }} />
              <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 700 }}>Team</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Signed in as {user?.role_display}. {roleHelpText(user?.role)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', mt: 0.5 }}>
              You can create: {allowedRoles.map((r) => ROLE_LABELS[r]).join(', ')}
            </Typography>
          </Box>
          <Button
            startIcon={<PersonAdd />}
            variant="contained"
            onClick={() => { setError(''); setOpen(true); }}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, borderRadius: 2 }}
          >
            Create User
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Skeleton height={40} sx={{ bgcolor: '#334155' }} />
              <Skeleton height={40} sx={{ bgcolor: '#334155' }} />
              <Skeleton height={40} sx={{ bgcolor: '#334155' }} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Name</TableCell>
                  <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Email</TableCell>
                  <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const chip = roleChipColor[u.role] || roleChipColor.team_member;
                  return (
                    <TableRow key={u.id}>
                      <TableCell sx={{ color: '#e2e8f0', borderColor: '#334155', fontWeight: 600 }}>{u.full_name}</TableCell>
                      <TableCell sx={{ color: '#94a3b8', borderColor: '#334155' }}>{u.email}</TableCell>
                      <TableCell sx={{ borderColor: '#334155' }}>
                        <Chip size="small" label={u.role_display} sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
        <DialogTitle sx={{ color: '#f1f5f9' }}>Create Team User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="First Name" {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} sx={inputSx} />
            <TextField label="Last Name" {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} sx={inputSx} />
          </Box>
          <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={inputSx} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#64748b' }}>Role</InputLabel>
            <Controller name="role" control={control} render={({ field }) => (
              <Select {...field} label="Role" sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}>
                {allowedRoles.map((r) => (
                  <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                ))}
              </Select>
            )} />
          </FormControl>
          <TextField fullWidth label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={inputSx} margin="normal" />
          <TextField fullWidth label="Confirm Password" type="password" {...register('password2')} error={!!errors.password2} helperText={errors.password2?.message} sx={inputSx} margin="normal" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default TeamPage;
