/** Trigger a browser download to the user's Downloads folder. */
export async function downloadFileToDevice(proxyUrl: string, filename: string) {
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error("Download failed");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
