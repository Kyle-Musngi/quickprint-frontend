export const formatRoleLabel = (role) => {
  if (!role) return '';

  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};
