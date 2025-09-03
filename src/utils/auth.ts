export const isAuthenticated = (): boolean => {
  const email = localStorage.getItem('userEmail')
  const fullName = localStorage.getItem('userFullName')
  return !!email && !!fullName
}

export const logout = () => {
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userFullName')
}
