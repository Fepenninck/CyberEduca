export function mascararEmail(email: string): string {
  const separador = email.lastIndexOf('@');
  if (separador < 1) return '***';
  const local = email.slice(0, separador);
  return `${local.slice(0, Math.min(2, Math.max(0, local.length - 1)))}***${email.slice(separador)}`;
}

export function mascararEmailUsuario<T extends { email?: string }>(
  usuario: T,
): T {
  return usuario.email
    ? { ...usuario, email: mascararEmail(usuario.email) }
    : usuario;
}
