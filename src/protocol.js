module.exports = {
  login: require('./protocol/login'),
  login_code: require('./protocol/login-code'),
  logout: require('./protocol/logout'),

  app_create: require('./protocol/app-create'),
  app_enable: require('./protocol/app-enable'),
  app_disable: require('./protocol/app-disable'),
  app_publish: require('./protocol/app-publish'),
  app_delete: require('./protocol/app-delete'),
  app_rename: require('./protocol/app-rename'),
  app_stream_logs: require('./protocol/app-stream-logs'),
  app_code: require('./protocol/app-code'),

  status: require('./protocol/status'),

  domain_link: require('./protocol/domain-link'),
  domain_unlink: require('./protocol/domain-unlink'),

  workspace_create: require('./protocol/workspace-create'),
  workspace_rename: require('./protocol/workspace-rename'),
  workspace_delete: require('./protocol/workspace-delete'),
  workspace_invite: require('./protocol/workspace-invite'),
  workspace_leave: require('./protocol/workspace-leave')
}
