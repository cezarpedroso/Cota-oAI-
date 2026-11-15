import { z } from "zod";
export const loginSchema = z.object({
  email: z.email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});
export const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "Informe seu nome.").max(80),
});
