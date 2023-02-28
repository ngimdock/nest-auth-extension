import { CoffeesPermissions } from 'src/coffees/coffees.permission';

export const Permission = {
  ...CoffeesPermissions,
};

export type PermissionType = CoffeesPermissions; // ...other permissions enums here
