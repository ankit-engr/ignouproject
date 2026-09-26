import React from 'react';
import { Typography } from '@mui/material';

/** IGNOU BCA (BCSP-064) project credit — Ankit Singh */
const DeveloperCredit: React.FC<{ sx?: object }> = ({ sx }) => (
  <Typography
    variant="caption"
    sx={{
      display: 'block',
      textAlign: 'center',
      color: '#64748b',
      mt: 3,
      ...sx,
    }}
  >
    FlowTrack · Developed by Ankit Singh · IGNOU BCA (BCSP-064)
  </Typography>
);

export default DeveloperCredit;
