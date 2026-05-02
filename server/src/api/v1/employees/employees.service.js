const usersService = require('../users/users.service');

// Employee directory = all users except ADMIN role
exports.listEmployees = async () => usersService.listUsers({ excludeAdmin: true });

exports.getEmployee = async (id) => usersService.getUser(id);
