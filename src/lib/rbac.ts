import { UserRole } from '@/contexts/organization-context'

// Role hierarchy: owner > admin > developer > viewer
const roleHierarchy: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
}

// Permission definitions
export const permissions = {
  // Organization management
  'org:delete': ['owner'],
  'org:update': ['owner', 'admin'],
  'org:view': ['owner', 'admin', 'developer', 'viewer'],
  
  // Billing
  'billing:manage': ['owner'],
  'billing:view': ['owner', 'admin'],
  
  // Team management
  'team:invite': ['owner', 'admin'],
  'team:remove': ['owner', 'admin'],
  'team:update-role': ['owner', 'admin'],
  'team:view': ['owner', 'admin', 'developer', 'viewer'],
  
  // Projects
  'project:create': ['owner', 'admin', 'developer'],
  'project:update': ['owner', 'admin', 'developer'],
  'project:delete': ['owner', 'admin'],
  'project:view': ['owner', 'admin', 'developer', 'viewer'],
  
  // Generations
  'generation:create': ['owner', 'admin', 'developer'],
  'generation:view': ['owner', 'admin', 'developer', 'viewer'],
  'generation:delete': ['owner', 'admin'],
  
  // API Keys
  'api-keys:manage': ['owner', 'admin'],
  'api-keys:view': ['owner', 'admin', 'developer'],
} as const

export type Permission = keyof typeof permissions

/**
 * Check if a role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = permissions[permission]
  return allowedRoles.includes(userRole)
}

/**
 * Check if a role meets or exceeds a required role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return Object.entries(permissions)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission as Permission)
}

/**
 * Role display names
 */
export const roleDisplayNames: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
}

/**
 * Role descriptions
 */
export const roleDescriptions: Record<UserRole, string> = {
  owner: 'Full access to all features including billing and organization deletion',
  admin: 'Can manage team members, projects, and view billing',
  developer: 'Can create and edit projects and generations',
  viewer: 'Can view projects and generations but cannot make changes',
}
