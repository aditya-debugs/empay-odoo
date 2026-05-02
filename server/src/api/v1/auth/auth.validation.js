const { z } = require('zod');

exports.registerAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  phone: z.string().min(7, 'Phone number looks too short'),
});

exports.loginSchema = z.object({
  identifier: z.string().min(1, 'Email or login ID is required'),
  password: z.string().min(1, 'Password is required'),
});
