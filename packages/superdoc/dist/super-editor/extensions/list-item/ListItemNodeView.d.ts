/**
 * @typedef {Object} IndentObject
 * @property {number} [left] - The left indent value
 * @property {number} [right] - The right indent value
 * @property {number} [firstLine] - The first line indent value
 * @property {number} [hanging] - The hanging indent value
 */
/**
 * The node view for the list item
 * @param {Node} node - The node to be rendered
 * @param {function} getPos - A function to get the position of the node
 * @param {Array} decorations - An array of decorations
 * @param {Editor} editor - The editor instance
 * @returns {ListItemNodeView} The node view instance
 */
export class ListItemNodeView {
    constructor(node: any, getPos: any, decorations: any, editor: any);
    node: any;
    editor: any;
    decorations: any;
    view: any;
    getPos: any;
    dom: HTMLLIElement;
    numberingDOM: HTMLSpanElement;
    contentDOM: HTMLDivElement;
    handleNumberingClick: (event: any) => void;
    destroy(): void;
    #private;
}
export function getVisibleIndent(stylePpr: DocxNode, numDefPpr: DocxNode, inlineIndent: any): IndentObject;
export type IndentObject = {
    /**
     * - The left indent value
     */
    left?: number;
    /**
     * - The right indent value
     */
    right?: number;
    /**
     * - The first line indent value
     */
    firstLine?: number;
    /**
     * - The hanging indent value
     */
    hanging?: number;
};
//# sourceMappingURL=ListItemNodeView.d.ts.map