import {
  isObjectType,
  isInputObjectType,
  isScalarType,
  getNamedType,
  isListType,
  isNonNullType,
  isUnionType,
  isInterfaceType,
  isEnumType
} from "graphql";
import { getDefaultValue } from "./defaults.js";

/**
 * Traverses a type and builds a selection set (e.g. { id name ... })
 */
function buildSelectionSet(type, options, depth = 0) {
  const maxDepth = options.maxDepth !== undefined ? options.maxDepth : 10;
  if (depth > maxDepth) {
    return "";
  }
  
  const namedType = getNamedType(type);

  if (isScalarType(namedType) || isEnumType(namedType)) {
    return "";
  }

  if (isObjectType(namedType) || isInterfaceType(namedType)) {
    const fields = namedType.getFields();
    
    // Filter out excluded fields
    const excludeSet = new Set(options.excludeFields || []);
    const availableFields = Object.keys(fields).filter(f => !excludeSet.has(f));

    const selections = availableFields
      .slice(0, 5) // Limit number of fields to prevent massive queries if not needed, or just include all. Let's include all.
      .map((fieldName) => {
        const field = fields[fieldName];
        // recursively build
        const subSelection = buildSelectionSet(field.type, options, depth + 1);
        return subSelection ? `${fieldName} ${subSelection}` : fieldName;
      });
      
    // Include typing for unions/interfaces if needed, but for simplicity just select fields
    return selections.length > 0 ? `{\n  ${selections.join("\n  ")}\n}` : "";
  }
  
  if (isUnionType(namedType)) {
    const types = namedType.getTypes();
    const inlineFragments = types.map(t => {
      const subSelection = buildSelectionSet(t, options, depth + 1);
      return subSelection ? `... on ${t.name} ${subSelection}` : "";
    });
    return inlineFragments.some(Boolean) ? `{\n  ${inlineFragments.filter(Boolean).join("\n  ")}\n}` : "";
  }

  return "";
}

function resolveVariableDefault(type, options, depth = 0) {
  const maxDepth = options && options.maxDepth !== undefined ? options.maxDepth : 10;
  if (depth > maxDepth) {
    return null;
  }

  if (isNonNullType(type)) {
    return resolveVariableDefault(type.ofType, options, depth);
  }

  if (isListType(type)) {
    const innerDefault = resolveVariableDefault(type.ofType, options, depth + 1);
    return innerDefault !== null ? [innerDefault] : [];
  }

  const namedType = getNamedType(type);

  if (isEnumType(namedType)) {
    // Return first enum value as default
    return namedType.getValues()[0]?.value || "";
  }
  
  if (isInputObjectType(namedType)) {
    const fields = namedType.getFields();
    const defaults = {};
    for (const [fieldName, field] of Object.entries(fields)) {
      const fieldDefault = resolveVariableDefault(field.type, options, depth + 1);
      if (fieldDefault !== null) {
        defaults[fieldName] = fieldDefault;
      }
    }
    return defaults;
  }
  return getDefaultValue(namedType.name) ?? "";
}

export function generateOperation(operationType, fieldName, field, options) {
  const variables = {};
  const variableDefinitions = [];
  const argumentNodes = [];

  // Build arguments and variables
  for (const arg of field.args) {
    const varName = `$${arg.name}`;
    const varType = arg.type.toString();
    
    variableDefinitions.push(`${varName}: ${varType}`);
    argumentNodes.push(`${arg.name}: ${varName}`);
    
    // Determine a default value based on type
    const defaultVal = resolveVariableDefault(arg.type, options);
    variables[arg.name] = defaultVal !== null ? defaultVal : "";
  }

  const selectionSet = buildSelectionSet(field.type, options);
  
  const opName = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
  const varsDefString = variableDefinitions.length > 0 ? `(${variableDefinitions.join(", ")})` : "";
  const argsString = argumentNodes.length > 0 ? `(${argumentNodes.join(", ")})` : "";
  
  const query = `${operationType} ${opName}${varsDefString} {
  ${fieldName}${argsString} ${selectionSet}
}
`;

  return { query, variables, opName };
}

export function generateAll(schema, options = {}) {
  const operations = [];

  const queryType = schema.getQueryType();
  if (queryType) {
    const fields = queryType.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      operations.push({
        type: 'query',
        name: fieldName,
        ...generateOperation('query', fieldName, field, options)
      });
    }
  }

  const mutationType = schema.getMutationType();
  if (mutationType) {
    const fields = mutationType.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      operations.push({
        type: 'mutation',
        name: fieldName,
        ...generateOperation('mutation', fieldName, field, options)
      });
    }
  }

  return operations;
}
