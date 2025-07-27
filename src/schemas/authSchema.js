import { z } from 'zod';

// schema para validação do formulário de login
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
});

// schema para resposta de login da API
export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    roles: z.array(z.string()).optional()
  }),
  permissions: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional()
});

// schema para validação do formulário de login SUAP
export const SuapLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Matrícula é obrigatória')
    .min(3, 'Matrícula deve ter pelo menos 3 dígitos')
    .max(15, 'Matrícula deve ter no máximo 15 dígitos')
    .regex(/^\d+$/, 'Matrícula deve conter apenas números'),
  
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
});

// schema para dados do usuário
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional()
}); 