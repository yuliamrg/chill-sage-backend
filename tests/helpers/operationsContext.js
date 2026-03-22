const { initializeApp, getAuthHeader, login } = require('./auth')
const {
  cleanupTrackedFixtures,
  createClientFixture,
  createEquipmentFixture,
  createTechUserFixture,
  getUserByUsername,
  uniqueSuffix,
} = require('./operations')

const buildOperationsContext = async () => {
  await initializeApp()

  const adminToken = await getAuthHeader('admin')
  const planeadorToken = await getAuthHeader('planeador')
  const tecnicoToken = await getAuthHeader('tecnico')
  const solicitanteToken = await getAuthHeader('solicitante')

  const adminUser = await getUserByUsername(process.env.TEST_ADMIN_USERNAME)
  const tecnicoUser = await getUserByUsername(process.env.TEST_TECNICO_USERNAME)
  const solicitanteUser = await getUserByUsername(process.env.TEST_SOLICITANTE_USERNAME)

  const suffix = uniqueSuffix()
  const clientA = await createClientFixture({ adminUserId: adminUser.id, suffix: `${suffix}-a` })
  const clientB = await createClientFixture({ adminUserId: adminUser.id, suffix: `${suffix}-b` })
  const equipmentA1 = await createEquipmentFixture({ adminUserId: adminUser.id, clientId: clientA.id, suffix: `${suffix}-eq1` })
  const equipmentA2 = await createEquipmentFixture({ adminUserId: adminUser.id, clientId: clientA.id, suffix: `${suffix}-eq2` })
  const equipmentB1 = await createEquipmentFixture({ adminUserId: adminUser.id, clientId: clientB.id, suffix: `${suffix}-eq3` })

  const extraTechUser = await createTechUserFixture({
    adminUserId: adminUser.id,
    suffix,
    password: process.env.TEST_LOGIN_PASSWORD,
  })
  const extraTechLogin = await login({
    email: extraTechUser.email,
    password: process.env.TEST_LOGIN_PASSWORD,
  })

  return {
    adminToken,
    adminUser,
    clientA,
    clientB,
    equipmentA1,
    equipmentA2,
    equipmentB1,
    extraTechToken: `Bearer ${extraTechLogin.body.access_token}`,
    extraTechUser,
    planeadorToken,
    solicitanteToken,
    solicitanteUser,
    tecnicoToken,
    tecnicoUser,
  }
}

const cleanupOperationsContext = async () => {
  await cleanupTrackedFixtures()
}

module.exports = {
  buildOperationsContext,
  cleanupOperationsContext,
}
