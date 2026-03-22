const pickAllowedFields = (payload, allowedFields) => {
  const safePayload = {}

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      safePayload[field] = payload[field]
    }
  }

  return safePayload
}

const withCreateAudit = (payload, auth) => ({
  ...payload,
  ...(auth?.userId ? { user_created_id: auth.userId } : {}),
})

const withUpdateAudit = (payload, auth) => ({
  ...payload,
  ...(auth?.userId ? { user_updated_id: auth.userId } : {}),
})

module.exports = {
  pickAllowedFields,
  withCreateAudit,
  withUpdateAudit,
}
