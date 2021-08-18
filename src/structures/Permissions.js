class Permissions extends null {
    default = {}
}

class UserPermissions extends Permissions {
    constructor() {}
}

exports.Permissions = Permissions;
exports.UserPermissions = UserPermissions;
