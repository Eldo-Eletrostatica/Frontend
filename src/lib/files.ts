// Triggers the browser download of a file returned by the API.
export function saveFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Released on the next tick: revoking right away can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
