const Role = require('../models/Roles/Role.model')
const { ROLE_IDS, ROLE_NAMES } = require('./roles')

const REQUIRED_ROLES = [
  { id: ROLE_IDS.ADMIN_PLATAFORMA, description: ROLE_NAMES.ADMIN_PLATAFORMA },
  { id: ROLE_IDS.SOLICITANTE, description: ROLE_NAMES.SOLICITANTE },
  { id: ROLE_IDS.PLANEADOR, description: ROLE_NAMES.PLANEADOR },
  { id: ROLE_IDS.TECNICO, description: ROLE_NAMES.TECNICO },
  { id: ROLE_IDS.ADMIN_CLIENTE, description: ROLE_NAMES.ADMIN_CLIENTE },
]

const ensureRoles = async () => {
  for (const requiredRole of REQUIRED_ROLES) {
    const existingRole = await Role.findByPk(requiredRole.id)

    if (!existingRole) {
      await Role.create(requiredRole)
      continue
    }

    if (existingRole.description !== requiredRole.description) {
      existingRole.description = requiredRole.description
      await existingRole.save()
    }
  }
}

module.exports = {
  ensureRoles,
}
