import { Mark, Attribute } from '@core/index.js';
import { getMarkRange } from '@/core/helpers/getMarkRange.js';

export const Link = Mark.create({
  name: 'link',

  priority: 1000,

  keepOnSplit: false,

  inclusive: false,

  addOptions() {
    return {
      protocols: ['http', 'https'],
      htmlAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'a' }];
  },

  renderDOM({ htmlAttributes }) {
    if (!isAllowedUri(htmlAttributes.href, this.options.protocols)) {
      return ['a', mergeAttributes(this.options.htmlAttributes, { ...htmlAttributes, href: '' }), 0];
    }

    return ['a', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      href: {
        default: null,
        renderDOM: ({ href, name }) => {
          if (href && isAllowedUri(href, this.options.protocols)) return { href };
          else if (name) return { href: `#${name}` };
          return {};
        },
      },
      target: {
        default: this.options.htmlAttributes.target,
      },
      rel: {
        default: this.options.htmlAttributes.rel,
      },
      rId: {
        default: this.options.htmlAttributes.rId || null,
      },
      text: {
        default: null,
      },
      name: {
        default: null,
      },
    };
  },

  addCommands() {
    return {
      setLink:
        ({ href, text } = {}) =>
        ({ state, dispatch, editor }) => {
          // Determine the text range we need to operate on.
          const { selection } = state;
          const linkMarkType = editor.schema.marks.link;
          const underlineMarkType = editor.schema.marks.underline;

          let from = selection.from;
          let to = selection.to;

          // If the cursor is inside an existing link with an empty selection,
          // expand the range to cover the whole link so we can edit it.
          if (selection.empty) {
            const range = getMarkRange(selection.$from, linkMarkType);
            if (range) {
              from = range.from;
              to = range.to;
            }
          }

          const currentText = state.doc.textBetween(from, to, ' ');
          const finalText = (text ?? currentText) || href || '';

          let tr = state.tr;

          // Replace the text if it has changed (or if there was no text yet).
          if (finalText && currentText !== finalText) {
            tr = tr.insertText(finalText, from, to);
            to = from + finalText.length;
          }

          // Remove existing link and underline marks in the affected range.
          // Then add the new link and underline marks.
          if (linkMarkType) tr = tr.removeMark(from, to, linkMarkType);
          if (underlineMarkType) tr = tr.removeMark(from, to, underlineMarkType);

          if (underlineMarkType) tr = tr.addMark(from, to, underlineMarkType.create());
          tr = tr.addMark(from, to, linkMarkType.create({ href, text: finalText }));

          dispatch(tr.scrollIntoView());
          return true;
        },
      unsetLink:
        () =>
        ({ chain }) => {
          return chain()
            .unsetMark('underline', { extendEmptyMarkRange: true })
            .unsetColor()
            .unsetMark('link', { extendEmptyMarkRange: true })
            .run();
        },
      toggleLink:
        ({ href, text } = {}) =>
        ({ commands }) => {
          if (!href) return commands.unsetLink();
          return commands.setLink({ href, text });
        },
    };
  },
});

const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
function isAllowedUri(uri, protocols) {
  const allowedProtocols = ['http', 'https', 'mailto'];

  if (protocols) {
    protocols.forEach((protocol) => {
      const nextProtocol = typeof protocol === 'string' ? protocol : protocol.scheme;

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol);
      }
    });
  }

  // eslint-disable-next-line no-useless-escape
  return (
    !uri ||
    uri
      .replace(ATTR_WHITESPACE, '')
      .match(new RegExp(`^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))`, 'i'))
  );
}
