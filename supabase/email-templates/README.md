# Email Templates - Reino Editorial

Templates HTML para Supabase Auth. Se aplican en el dashboard de Supabase.

## Como aplicar

1. Ir a **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Para cada tipo de email, copiar el HTML correspondiente:

| Template Supabase | Archivo |
|---|---|
| Magic Link | `magic-link.html` |
| Confirm signup | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Invite user | `invite-user.html` |

3. Pegar el HTML en el campo "Body" del template correspondiente
4. Cambiar el "Subject" a:
   - **Magic Link**: `Tu enlace de acceso - Reino Editorial`
   - **Confirm signup**: `Confirma tu correo - Reino Editorial`
   - **Reset password**: `Restablecer contrasena - Reino Editorial`
   - **Invite user**: `Invitacion a Reino Editorial`
5. Guardar cambios

## Variables de Supabase

Los templates usan `{{ .ConfirmationURL }}` que Supabase reemplaza automaticamente con el enlace correcto.
