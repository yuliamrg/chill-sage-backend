const ROLE_IDS = {
  ADMIN: 1,
  ADMIN_PLATAFORMA: 1,
  SOLICITANTE: 2,
  PLANEADOR: 3,
  TECNICO: 4,
  ADMIN_CLIENTE: 5,
}

const ROLE_NAMES = {
  ADMIN: 'admin_plataforma',
  ADMIN_PLATAFORMA: 'admin_plataforma',
  SOLICITANTE: 'solicitante',
  PLANEADOR: 'planeador',
  TECNICO: 'tecnico',
  ADMIN_CLIENTE: 'admin_cliente',
}

const GLOBAL_READ_ROLE_NAMES = [ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE]

const SCOPED_ROLE_NAMES = [
  ROLE_NAMES.ADMIN_CLIENTE,
  ROLE_NAMES.SOLICITANTE,
  ROLE_NAMES.PLANEADOR,
  ROLE_NAMES.TECNICO,
]

const isPlatformAdminRole = (roleName) => roleName === ROLE_NAMES.ADMIN_PLATAFORMA
const isClientScopedRole = (roleName) => SCOPED_ROLE_NAMES.includes(roleName)

module.exports = {
  GLOBAL_READ_ROLE_NAMES,
  ROLE_IDS,
  ROLE_NAMES,
  SCOPED_ROLE_NAMES,
  isClientScopedRole,
  isPlatformAdminRole,
}
