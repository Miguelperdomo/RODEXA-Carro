/** true si algún campo del objeto de errores tiene mensaje. */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
