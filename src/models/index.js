const Client = require('./Clients/Client.model')
const Equipment = require('./Equipments/Equipment.model')
const Order = require('./Orders/Order.model')
const Request = require('./Requests/request.model')
const Schedule = require('./Schedules/Schedule.model')
const ScheduleEquipment = require('./Schedules/ScheduleEquipment.model')
const User = require('./Users/User.model')

let initialized = false

const initializeModelAssociations = () => {
  if (initialized) {
    return
  }

  Equipment.belongsTo(Client, { foreignKey: 'client', as: 'clientRecord' })

  Request.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })
  Request.belongsTo(User, { foreignKey: 'requester_user_id', as: 'requester' })
  Request.belongsTo(User, { foreignKey: 'reviewed_by_user_id', as: 'reviewer' })
  Request.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' })
  Request.hasOne(Order, { foreignKey: 'request_id', as: 'order' })

  Order.belongsTo(Request, { foreignKey: 'request_id', as: 'request' })
  Order.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })
  Order.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' })
  Order.belongsTo(User, { foreignKey: 'assigned_user_id', as: 'assignedUser' })

  Schedule.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })
  Schedule.belongsToMany(Equipment, {
    through: ScheduleEquipment,
    foreignKey: 'schedule_id',
    otherKey: 'equipment_id',
    as: 'equipments',
  })
  Equipment.belongsToMany(Schedule, {
    through: ScheduleEquipment,
    foreignKey: 'equipment_id',
    otherKey: 'schedule_id',
    as: 'schedules',
  })

  initialized = true
}

module.exports = {
  Client,
  Equipment,
  Order,
  Request,
  Schedule,
  ScheduleEquipment,
  User,
  initializeModelAssociations,
}
