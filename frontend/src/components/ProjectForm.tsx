import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography,
} from '@mui/material';
import { projectsApi } from '../api/projects';
import { authApi } from '../api/auth';
import { Project, ProjectFormData, User } from '../types';
import { useAuthStore } from '../store/authStore';

const schema = yup.object({
  title: yup.string().min(2, 'Min 2 chars').max(200, 'Max 200 chars').required('Title is required'),
  description: yup.string().max(2000, 'Max 2000 chars').default(''),
  status: yup.mixed<'active' | 'completed'>().oneOf(['active', 'completed']).required(),
  deadline: yup.string().default(''),
  project_manager_id: yup.number().nullable().default(null),
});

interface Props { open: boolean; project?: Project | null; onClose: () => void; onSuccess: () => void; }

const inputSx = {
  '& .MuiOutlinedInput-root': { color: '#f1f5f9', '& fieldset': { borderColor: '#334155' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } },
  '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
  '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
};

const ProjectForm: React.FC<Props> = ({ open, project, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [managers, setManagers] = useState<User[]>([]);
  const showManagerPicker = user?.role === 'admin' || user?.role === 'project_leader';

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { title: '', description: '', status: 'active', deadline: '', project_manager_id: null },
  });

  useEffect(() => {
    if (open && showManagerPicker) {
      authApi.listUsers()
        .then((users) => setManagers(users.filter((u) => u.role === 'project_manager')))
        .catch(() => setManagers([]));
    }
  }, [open, showManagerPicker]);

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        status: project.status,
        deadline: project.deadline || '',
        project_manager_id: project.project_manager_id ?? project.project_manager?.id ?? null,
      });
    } else {
      reset({ title: '', description: '', status: 'active', deadline: '', project_manager_id: null });
    }
  }, [project, open, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    const payload = {
      ...data,
      deadline: data.deadline || '',
      project_manager_id: data.project_manager_id || null,
    };
    if (project) await projectsApi.update(project.id, payload);
    else await projectsApi.create(payload);
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
      <DialogTitle sx={{ color: '#f1f5f9' }}>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Title" {...register('title')} error={!!errors.title} helperText={errors.title?.message} sx={{ ...inputSx, mt: 1 }} margin="normal" />
        <TextField fullWidth label="Description" multiline rows={3} {...register('description')} error={!!errors.description} helperText={errors.description?.message} sx={inputSx} margin="normal" />
        <FormControl fullWidth margin="normal" error={!!errors.status}>
          <InputLabel sx={{ color: '#64748b' }}>Status</InputLabel>
          <Controller name="status" control={control} render={({ field }) => (
            <Select {...field} label="Status" sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          )} />
          {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
        </FormControl>

        {showManagerPicker && (
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#64748b' }}>Project Manager</InputLabel>
            <Controller name="project_manager_id" control={control} render={({ field }) => (
              <Select
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                label="Project Manager"
                sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}
              >
                <MenuItem value="">Select Project Manager</MenuItem>
                {managers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.full_name} — {m.email}</MenuItem>
                ))}
              </Select>
            )} />
            <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
              Choose who will manage tasks and assign Team Members on this project.
            </Typography>
          </FormControl>
        )}

        <TextField
          fullWidth label="Project Deadline" type="date" {...register('deadline')}
          error={!!errors.deadline} helperText={errors.deadline?.message || 'Overall project deadline for progress tracking'}
          sx={inputSx} margin="normal" InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
          {isSubmitting ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectForm;
