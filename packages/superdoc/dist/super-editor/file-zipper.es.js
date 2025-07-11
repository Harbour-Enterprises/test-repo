import { J as JSZip } from "./chunks/docx-zipper-LcofGdUl.js";
async function createZip(blobs, fileNames) {
  const zip = new JSZip();
  blobs.forEach((blob, index) => {
    zip.file(fileNames[index], blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
}
export {
  createZip
};
