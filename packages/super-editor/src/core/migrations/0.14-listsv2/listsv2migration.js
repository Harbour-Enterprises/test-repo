import { ListHelpers } from '@helpers/list-numbering-helpers.js';

const isDebugging = true;
const log = (...args) => {
  if (isDebugging) console.debug("[lists v2 migration]", ...args);
};

/**
 * Migration for lists v1 to v2
 * This function checks if the editor has any lists that need to be migrated from v1 to v2.
 * It splits list nodes that have more than one item into single-item lists,
 * @param {Editor} editor - The editor instance containing the lists to be migrated.
 * @return {Object} An object containing the extracted items and replacements made.
 *                  The `extracted` property contains the flattened list items,
 *                  and the `replacements` property contains the positions and nodes replaced.
 *                  If no migration is needed, it returns an empty object.
 */
export const migrateListsToV2IfNecessary = (editor) => {
  const replacements = [];
  if (!editor.options.ydoc) return replacements;

  log('\n\n\nATTEMPTING MIGRATIONS')

  const numbering = editor.converter.numbering;
  if (!numbering) return replacements;

  const { state } = editor;
  const { doc } = state;
  const { dispatch } = editor.view;

  const LIST_TYPES = ['orderedList', 'bulletList'];

  // Collect all list nodes that need to be replaced
  let lastListEndPos = 0;
  doc.descendants((node, pos) => {
    if (!LIST_TYPES.includes(node.type.name)) return;
  
    if (pos < lastListEndPos) return;

    const extracted = flattenListCompletely(node, editor, 0);
    if (extracted.length > 0) {
      replacements.push({ 
        from: pos, 
        to: pos + node.nodeSize, 
        listNode: node,
        replacement: extracted
      });
    }

    lastListEndPos = pos + node.nodeSize;
  });

  // Apply replacements in reverse order to avoid position drift
  if (replacements.length > 0) {
    let tr = state.tr;
    
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { from, to, replacement, listNode } = replacements[i];
      
      // Convert the flattened items to actual nodes
      const nodesToInsert = [];
      for (const item of replacement) {
        if (item.node.type.name === 'listItem') {
          // Create a single-item list containing this list item
          const singleItemList = listNode.type.create(
            listNode.attrs,
            [item.node]
          );
          nodesToInsert.push(singleItemList);
        } else {
          // Insert non-list content directly
          nodesToInsert.push(item.node);
        }
      }
      
      log('NODES TO INSERT', nodesToInsert);
      tr = tr.replaceWith(from, to, nodesToInsert);
    }
    
    dispatch(tr);
  }

  return replacements;
};


/**
 * Completely flatten a list structure into single-item lists
 * @param {Node} listNode - The list node to flatten
 * @param {Editor} editor - The editor instance
 * @param {number} baseLevel - The base nesting level
 * @returns {Array} Array of single-item list nodes
 */
function flattenListCompletely(listNode, editor, baseLevel = 0, sharedNumId = null) {
  const result = [];
  const listTypes = ['orderedList', 'bulletList'];

  const needsMigration = shouldMigrateList(listNode);
  log("Needs migration?", needsMigration);
  if (!needsMigration) return result;

  let numId = parseInt(listNode.attrs?.listId);
  log('LIST ID', numId, 'SHARED NUM ID', sharedNumId);
  const listHasDef = ListHelpers.getListDefinitionDetails({ numId, level: baseLevel, editor });
  if (!listHasDef || (!sharedNumId && !numId)) {
    // In some legacy cases, we might not find any list ID at all but we can infer
    // the list style from the list-style-type attribute.
    const currentListType = listNode.type.name;
    numId = ListHelpers.getNewListId(editor);
    log('Genearted new list ID', numId, 'for list type', currentListType);
    ListHelpers.generateNewListDefinition({
      numId,
      listType: currentListType,
      editor,
    });
  }

  if (!sharedNumId) sharedNumId = numId;

  for (const listItem of listNode.content.content) {
    // If the list item has no content, we will still add it as a single-item list
    // Or, main case, where the list item only has one item, it is ready for converting
    if (!listItem.content.content?.length) {
      result.push({ node: listItem, baseLevel });
    }

    // If the list has a single item, we need to check if it is a nested list
    // If it is, we need to flatten it completely
    // If it is not, we can just add it as a single-item list
    else if (listItem.content.content.length === 1) {
      const contentNode = listItem.content.content[0];
      if (listTypes.includes(contentNode.type.name)) {
        // If the content is a nested list, we need to flatten it completely
        const flattened = flattenListCompletely(contentNode, editor, baseLevel + 1, sharedNumId);
        result.push(...flattened);
      } else {
        const newList = ListHelpers.createSchemaOrderedListNode({
          level: baseLevel,
          numId: sharedNumId,
          listType: listNode.type.name,
          editor,
          contentNode: contentNode.toJSON(),
          listLevel: listItem.attrs.listLevel || [1],
        })
        result.push({ node: newList, baseLevel });
      }
    }

    // If we have multiple items, we need to:
    // Convert the first one to the list item
    // Everything else to root nodes
    else {
  
      const firstItem = listItem.content.content[0];
      if (listTypes.includes(firstItem.type.name)) {
        // If the first item is a nested list, we need to flatten it completely
        const flattened = flattenListCompletely(firstItem, editor, baseLevel + 1, sharedNumId);
        result.push(...flattened);
      } else {
        // If firstItem is already a paragraph or other valid listItem content, wrap it
        // If firstItem is something else, we might need to handle it differently
        if (firstItem.type.name === 'paragraph' || firstItem.isTextblock) {
          // Create a new list item node containing this content
          const newList = ListHelpers.createSchemaOrderedListNode({
            level: baseLevel,
            numId: sharedNumId,
            listType: listNode.type.name,
            editor,
            contentNode: firstItem.toJSON(),
            listLevel: listItem.attrs.listLevel || [1],
          })
          result.push({ node: newList, baseLevel });
        } else {
          // If it's not valid listItem content, treat it as a standalone node
          result.push({ node: firstItem });
        }
      }

      for (let contentItem of listItem.content.content.slice(1)) {
        if (listTypes.includes(contentItem.type.name)) {
          // If the first item is a nested list, we need to flatten it completely
          const flattened = flattenListCompletely(contentItem, editor, baseLevel + 1, sharedNumId);
          result.push(...flattened);
        } else {
          result.push({ node: contentItem });
        }
      }
    }
  }

  return result;
}

/**
 * Check if a list item needs migration to v2.
 * This function checks if a list item has more than one child or if the first child is a list item
 * without the required attributes for v2 migration. It returns true if migration is needed,
 * and false otherwise.
 * @param {Object} listItem - The list item to check for migration.
 * @returns {boolean} True if the list item needs migration, false otherwise.
 */
const shouldMigrateList = (listItem) => {
  const content = listItem.content;

  if (content?.content?.length > 1) {
    // If the list item has more than one child, it needs migration
    return true;
  }

  // Since we know we only have one child, let's check it
  const firstChild = content.firstChild;
  if (firstChild && firstChild.type.name === 'listItem') {
    const { attrs } = firstChild;

    // After v2, we expect level and listNumberingType to be defined
    const { level, listNumberingType } = attrs || {};
    if (typeof level !== 'number' || !listNumberingType) {
      return true;
    } 

    const childContent = firstChild?.content?.content;
    const nestedLists = childContent.filter(child => ['bulletList', 'orderedList'].includes(child.type.name));
    return nestedLists.length > 0;
  }

  return false;
}
