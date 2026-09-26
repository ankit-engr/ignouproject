import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Typography, Alert,
} from '@mui/material';
import { tasksApi } from '../api/tasks';
import { authApi } from '../api/auth';
import { Task, TaskFormData, User, Project } from '../types';
import { useAuthStore } from '../store/authStore';
import { canAssignTasks, canEditTaskFully } from '../utils/roles';

const schema = yup.object({
  title: yup.string().default(''),
  description: yup.string().max(2000).default(''),
  status: yup.mixed<'todo' | 'in-progress' | 'done'>().oneOf(['todo', 'in-progress', 'done']).required(),
  due_date: yup.string().default(''),
  assignee_id: yup.number().nullable().default(null),
});

interface Props {
  open: boolean;
  task?: Task | null;
  projectId: number;
  project?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

const inputSx = {
  '& .MuiOutlinedInput-root': { color: '#f1f5f9', '& fieldset': { borderColor: '#334155' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } },
  '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
  '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
};

const TaskForm: React.FC<Props> = ({ open, task, projectId, project, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const fullEdit = canEditTaskFully(user, project);
  const canAssign = canAssignTasks(user, project);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { title: '', description: '', status: 'todo', due_date: '', assignee_id: null },
  });

  useEffect(() => {
    if (open && canAssign) {
      authApi.listAssignableUsers().then(setUsers).catch(() => setUsers([]));
    }
  }, [open, canAssign]);

  useEffect(() => {
    setError('');
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date || '',
        assignee_id: task.assignee_id ?? task.assignee?.id ?? null,
      });
    } else {
      reset({ title: '', description: '', status: 'todo', due_date: '', assignee_id: null });
    }
  }, [task, open, reset]);

  const onSubmit = async (data: TaskFormData) => {
    setError('');
    try {
      if (fullEdit) {
        if (!data.title || data.title.trim().length < 2) {
          setError('Title must be at least 2 characters.');
          return;
        }
        const payload = {
          ...data,
          due_date: data.due_date || '',
          assignee_id: data.assignee_id || null,
        };
        if (task) await tasksApi.update(projectId, task.id, payload);
        else await tasksApi.create(projectId, payload);
      } else {
        if (!task) throw new Error('Cannot create');
        await tasksApi.update(projectId, task.id, { status: data.status });
      }
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Action not allowed for your role.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
      <DialogTitle sx={{ color: '#f1f5f9' }}>
        {fullEdit ? (task ? 'Edit Task' : 'New Task') : 'Update Task Status'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!fullEdit && (
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
            As a Team Member you can only change the status of tasks assigned to you.
          </Typography>
        )}
        {fullEdit ? (
          <>
            <TextField fullWidth label="Title" {...register('title')} error={!!errors.title} helperText={errors.title?.message} sx={{ ...inputSx, mt: 1 }} margin="normal" />
            <TextField fullWidth label="Description" multiline rows={2} {...register('description')} error={!!errors.description} helperText={errors.description?.message} sx={inputSx} margin="normal" />
          </>
        ) : (
          <Typography sx={{ color: '#e2e8f0', fontWeight: 600, mb: 2 }}>{task?.title}</Typography>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel sx={{ color: '#64748b' }}>Status</InputLabel>
          <Controller name="status" control={control} render={({ field }) => (
            <Select {...field} label="Status" sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          )} />
        </FormControl>
        {canAssign && (
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#64748b' }}>Assign To</InputLabel>
            <Controller name="assignee_id" control={control} render={({ field }) => (
              <Select
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                label="Assign To"
                sx={{ color: '#f1f5f9', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }, '.MuiSvgIcon-root': { color: '#64748b' } }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.full_name} — {u.role_display}
                  </MenuItem>
                ))}
              </Select>
            )} />
          </FormControl>
        )}
        {canAssign && (
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            {user?.role === 'admin' && 'Admin can assign to any role (Leader / Manager / Team Member).'}
            {user?.role === 'project_leader' && 'Project Leader assigns only to Project Manager.'}
            {user?.role === 'project_manager' && 'Project Manager assigns only to Team Member.'}
            {!fullEdit && ' You can update status only.'}
          </Typography>
        )}
        {fullEdit && (
          <TextField fullWidth label="Due Date" type="date" {...register('due_date')} error={!!errors.due_date} helperText={errors.due_date?.message}
            sx={inputSx} margin="normal" InputLabelProps={{ shrink: true }} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm;
