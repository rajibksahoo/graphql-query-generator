export const typeDefaults = {
  String: "",
  Int: 0,
  Float: 0.0,
  Boolean: false,
  ID: "1",
  // You can add custom scalar defaults below, e.g.:
  // Date: "2023-01-01",
  // JSON: "{}"
};

export function getDefaultValue(typeName) {
  if (typeDefaults.hasOwnProperty(typeName)) {
    return typeDefaults[typeName];
  }
  // Fallback for unknown custom scalars
  return null;
}
