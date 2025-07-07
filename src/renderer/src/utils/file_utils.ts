export async function browserReadFileText(fileObject: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      resolve(data);
    };
    reader.readAsText(fileObject);
  });
}

export async function browserReadFileBytes(fileObject: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target!.result as ArrayBuffer;

      resolve(data);
    };
    reader.readAsArrayBuffer(fileObject);
  });
}

export async function generateDownloadText(name: string, content: string, type: string) {
  const blob = new Blob([content], { type: type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function generateDownloadBytes(name: string, content: ArrayBuffer, type: string) {
  const blob = new Blob([content], { type: type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
