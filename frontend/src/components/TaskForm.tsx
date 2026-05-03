import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { tasksApi } from '../api/tasks';
import { Task, TaskFormData } from '../types';

const schema = yup.object({
  title: yup.string().min(2, 'Min 2 chars').max(200).required('Title is required'),
  description: yup.string().max(2000).default(''),
  status: yup.mixed<'todo' | 'in-progress' | 'done'>().oneOf(['todo', 'in-progress', 'done']).required(),
  due_date: yup.string().default(''),
});

interface Props { open: boolean; task?: Task | null; projectId: number; onClose: () => void; onSuccess: () => void; }

const inputSx = {
  '& .MuiOutlinedInput-root': { color: '#f1f5f9', '& fieldset': { borderColor: '#334155' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } },
  '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
  '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
};

const TaskForm: React.FC<Props> = ({ open, task, projectId, onClose, onSuccess }) => {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: yupResolver(schema),
    defaultValues: { title: '', description: '', status: 'todo', due_date: '' },
  });

  useEffect(() => {
    if (task) reset({ title: task.title, description: task.description, status: task.status, due_date: task.due_date || '' });
    else reset({ title: '', description: '', status: 'todo', due_date: '' });
  }, [task, open, reset]);

  const onSubmit = async (data: TaskFormData) => {
    const payload = { ...data, due_date: data.due_date || '' };
    if (task) await tasksApi.update(projectId, task.id, payload);
    else await tasksApi.create(projectId, payload);
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid #334155' } }}>
      <DialogTitle sx={{ color: '#f1f5f9' }}>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Title" {...register('title')} error={!!errors.title} helperText={errors.title?.message} sx={{ ...inputSx, mt: 1 }} margin="normal" />
        <TextField fullWidth label="Description" multiline rows={2} {...register('description')} error={!!errors.description} helperText={errors.description?.message} sx={inputSx} margin="normal" />
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
        <TextField fullWidth label="Due Date" type="date" {...register('due_date')} error={!!errors.due_date} helperText={errors.due_date?.message}
          sx={inputSx} margin="normal" InputLabelProps={{ shrink: true }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
          {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm;
