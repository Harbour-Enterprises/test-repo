import xmljs from 'xml-js';
/**
 * @typedef {Object.<string, XmlNode>} ParsedDocx
 * this should have the `media` as a key for image handling
 */

/**
 * Convert docx to our inner representation
 * @param {{name: string, content: string}[]} docxAsXmlFileList
 * @returns {ParsedDocx}
 */
export const docxAsXmlFileList2ParsedDocx = (docxAsXmlFileList) => {
  const convertedXml = {};
  docxAsXmlFileList.forEach((file) => {
    convertedXml[file.name] = parseXmlToJson(file.content);
  });
  return convertedXml;
};

const defaultInitialXml = `<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14"><w:body></w:body></w:document>`;

export const parseXmlToJson = (xml) => {
  return JSON.parse(xmljs.xml2json(xml, null, 2));
};

/**
 *
 * @param {ParsedDocx} parsedDocx
 * @param {string} [fallbackXml]
 */
export const getInitialJSON = (parsedDocx, fallbackXml = defaultInitialXml) => {
  return parsedDocx['word/document.xml'] || parseXmlToJson(fallbackXml);
};
/**
 *
 * @param {ParsedDocx} parsedDocx
 * @returns *
 */
const getDeclaration = (parsedDocx) => {
  return getInitialJSON(parsedDocx).declaration;
};

const getThemeInfo = (themeName) => {
  themeName = themeName.toLowerCase();
  const theme1 = this.convertedXml['word/theme/theme1.xml'];
  const themeData = theme1.elements.find((el) => el.name === 'a:theme');
  const themeElements = themeData.elements.find((el) => el.name === 'a:themeElements');
  const fontScheme = themeElements.elements.find((el) => el.name === 'a:fontScheme');
  let fonts;

  if (themeName.startsWith('major')) {
    fonts = fontScheme.elements.find((el) => el.name === 'a:majorFont').elements[0];
  } else if (themeName.startsWith('minor')) {
    fonts = fontScheme.elements.find((el) => el.name === 'a:minorFont').elements[0];
  }

  const { typeface, panose } = fonts.attributes;
  return { typeface, panose };
};

/**
 *
 * @param {ParsedDocx} parsedDocx
 * @returns {{} | {fontSizePt: number, kern: string, typeface: string, panose: string}}
 */
const getDocumentDefaultStyles = (parsedDocx) => {
  const styles = parsedDocx['word/styles.xml'];
  if (!styles) return {};

  const defaults = styles.elements[0].elements.find((el) => el.name === 'w:docDefaults');

  // TODO: Check if we need this
  // const pDefault = defaults.elements.find((el) => el.name === 'w:pPrDefault');

  // Get the run defaults for this document - this will include font, theme etc.
  const rDefault = defaults.elements.find((el) => el.name === 'w:rPrDefault');
  if ('elements' in rDefault) {
    const rElements = rDefault.elements[0].elements;
    const fontThemeName = rElements.find((el) => el.name === 'w:rFonts')?.attributes['w:asciiTheme'];
    let typeface, panose;
    if (fontThemeName) {
      const fontInfo = getThemeInfo(fontThemeName);
      typeface = fontInfo.typeface;
      panose = fontInfo.panose;
    }

    const fontSizePt = Number(rElements.find((el) => el.name === 'w:sz')?.attributes['w:val']) / 2;
    const kern = rElements.find((el) => el.name === 'w:kern')?.attributes['w:val'];
    return { fontSizePt, kern, typeface, panose };
  }
  return {};
};
